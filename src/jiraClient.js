const EventEmitter = require('events');
var axios = require('axios');
var Promise = require('bluebird');
var _ = require('lodash');

var baseConfig = {
  auth: {
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_PASSWORD,
  }
}

var baseClient = axios.create({
  baseURL: process.env.JIRA_URL + '/rest/api/3',
  ...baseConfig
});

var agileClient = axios.create({
  baseURL: process.env.JIRA_URL + '/rest/agile/1.0',
  ...baseConfig
});

const jira = module.exports = {
  baseClient,
  agileClient,

  createHandleWebhookFn: (handler, watchedFields) =>  async ({ body: rawBody }) => {
    let error, numIssuesUpdated = 0;
    const eventEmitter = new EventEmitter()
      .on('issuesUpdated', n => numIssuesUpdated += n)
      .on('issuesUpdated', n => console.log(`Updated ${n} issues.`))
      .on('error', _error => error = _error)
      .on('error', console.error);

    const requestBody = JSON.parse(rawBody);
    const changedFields = _.map(_.get(requestBody, 'changelog.items'), 'field');
    if (watchedFields.length == 0 || _.intersection(changedFields, watchedFields).length > 0) {
      try {
        await handler(eventEmitter, requestBody);
      } catch (e) {
        eventEmitter.emit('error', e);
      }
    }

    const statusCode = 200; // always return success, even if we errored. we don't want Jira to retry.
    const responseBody = [error, `Updated ${numIssuesUpdated} issues.`].filter(el => el).join('. ');
    return { statusCode, responseBody };
  },

  createHandleDirectFn: (handler) => async () => {
    await handler(
      new EventEmitter()
        .on('issuesUpdated', n => console.log(`Updated ${n} issues.`))
        .on('error', e => { throw e; })
    );
  },

  getIssues: async ({jql, ...other}) => await (
    baseClient
      .get(`/search`, { params: { jql, ...other } })
      .then(({data: { issues }}) => issues)
  ),

  // https://developer.atlassian.com/cloud/jira/platform/rest/v3/#api-rest-api-3-issue-issueIdOrKey-put
  updateIssue: async (issueKey, args) => await (
    baseClient
      .put(`/issue/${issueKey}`, args)
  ),

  addComment: async (issueKey, commentText) => await (
    baseClient
      .post(`/issue/${issueKey}/comment`, {
        body: {
          type: 'doc',
          version: 1,
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: commentText
            }]
          }]
        }
      })
  ),

  rankIssues: async (issuesToRank, {rankBeforeIssue, rankAfterIssue}) => await (
    agileClient.put('/issue/rank', {
      issues: issuesToRank,
      rankBeforeIssue,
      rankAfterIssue,
    })
  ),

  orderIssues: async (orderedIssues) => {
    const [firstIssue, ...rest] = _.map(orderedIssues, 'key');

    const initialValue = firstIssue;
    const array = _.chunk(rest, 50);
    const reducer = async (lastSortedIssue, nextChunk) => {
      await jira.rankIssues(nextChunk, { rankAfterIssue: lastSortedIssue });
      return _.last(nextChunk);
    };

    return Promise.reduce(array, reducer, initialValue);
  }
};
