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
  baseURL: process.env.JIRA_URL + '/rest/api/2',
  ...baseConfig
});

var agileClient = axios.create({
  baseURL: process.env.JIRA_URL + '/rest/agile/1.0',
  ...baseConfig
});

var BOARD_ID = process.env.JIRA_BOARD_ID;

const jira = module.exports = {
  baseClient,
  agileClient,

  getPriorities: async () => await (
    baseClient
      .get(`/priority`)
      .then(({ data: priorities }) => priorities)
  ),

  getEpics: async () => await (
    agileClient
      .get(`/board/${BOARD_ID}/epic`, { params: { done: false } })
      .then(({ data: { values: epics } }) => epics)
  ),

  getIssues: async ({jql, ...other}) => await (
    agileClient
      .get(`/board/${BOARD_ID}/issue`, { params: { jql, ...other } })
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
