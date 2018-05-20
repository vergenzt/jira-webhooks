var axios = require('axios');

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

module.exports = {
  baseClient,
  agileClient,

  getEpicIdsByRank: async () => await (
    agileClient
      .get(`/board/${BOARD_ID}/epic`, { params: { done: false } })
      .then(({ data: { values: epicsByRank } }) => epicsByRank.map(({id}) => id))
  ),

  getIssues: async ({jql}) => await (
    agileClient
      .get(`/board/${BOARD_ID}/issue`, { params: { jql } })
      .then(({data: { issues }}) => issues)
  ),

  rankIssues: async (issuesToRank, {rankBeforeIssue, rankAfterIssue}) => await (
    agileClient.put('/issue/rank', {
      issues: issuesToRank,
      rankBeforeIssue,
      rankAfterIssue,
    })
  ),
};
