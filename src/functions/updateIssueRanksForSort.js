const EventEmitter = require('events');
const jira = require('../jira-client');
const { getPatch } = require('fast-array-diff');

module.exports.handleViaWebhook = async ({ body: rawBody }) => {
  let error, numIssuesUpdated = 0;
  const eventEmitter = new EventEmitter()
    .on('issuesRanked', n => numIssuesUpdated += n)
    .on('error', _error => error = _error);

  const { webhookEvent, issue, changelog } = JSON.parse(rawBody);
  const changedFields = (changelog || []).map(({field}) => field);
  if (
    webhookEvent === 'jira:issue_created'
    || changedFields.includes('Rank')
    || changedFields.includes('Importance')
  ) {
    await updateIssueRanksForSort(eventEmitter);
  }

  const statusCode = 200; // always return success, even if we errored. we don't want Jira to retry.
  const body = [error, `Updated ${numIssuesUpdated} issue ranks.`].filter(el => el).join('. ');
  return { statusCode, body };
};

module.exports.handleDirect = async () => {
  await updateIssueRanksForSort(
    new EventEmitter()
      .on('issuesRanked', n => console.log(`Ranked ${n} issues.`))
      .on('error', e => { throw e; })
  );
};

const updateIssueRanksForSort = async (eventEmitter) => {
  const currentOrderFieldString = 'rank';
  const targetOrderFieldString = process.env.JIRA_SORT_ORDER || 'rank';
  const baseJql = process.env.JIRA_BASE_JQL;

  try {
    const [
      currentOrderKeys,
      targetOrderKeys
    ] = await Promise.all(
      [
        currentOrderFieldString,
        targetOrderFieldString
      ].map(async (orderString) => {
        const jql = `${baseJql} order by ${orderString}`;
        const issues = await jira.getIssues({ jql, maxResults: 500 });
        const issueKeys = issues.map(({key}) => key);
        return issueKeys;
      })
    );

    const patch = getPatch(currentOrderKeys, targetOrderKeys);
    const patchAdditions = patch.filter(op => op.type === 'add');

    const updateJiraRankFromPatchAddition = async ({ oldPos, items }) => {
      await jira.rankIssues(
        items
        , (
          oldPos == 0
          ? { rankBeforeIssue: currentOrderKeys[0] }
          : { rankAfterIssue:  currentOrderKeys[oldPos - 1] }
        )
      );
      eventEmitter.emit('issuesRanked', items.length);
    };

    await Promise.all(patchAdditions.map(updateJiraRankFromPatchAddition));
  } catch (e) {
    eventEmitter.emit('error', e);
  }
};
