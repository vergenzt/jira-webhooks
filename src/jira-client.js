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

  getIssues: async ({jql, ...other}) => await (
    baseClient
      .get(`/search`, { params: { jql, ...other } })
      .then(({data: { issues }}) => issues)
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
