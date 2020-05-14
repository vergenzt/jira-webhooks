const jira = require('../jiraClient');
const { getPatch } = require('fast-array-diff');

const updateIssueRanksForSort = async (eventEmitter) => {
  const currentOrderFieldString = 'rank';
  const {
    JIRA_SORT_FIELDS: targetOrderFieldString,
    JIRA_BASE_JQL: baseJql,
  } = process.env;

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
      eventEmitter.emit('issuesUpdated', items.length);
    };

    await Promise.all(patchAdditions.map(updateJiraRankFromPatchAddition));
  } catch (e) {
    eventEmitter.emit('error', e);
  }
};

module.exports.handleViaWebhook = jira.createHandleWebhookFn(updateIssueRanksForSort, ['Rank', 'Importance']);
module.exports.handleDirect = jira.createHandleDirectFn(updateIssueRanksForSort);
