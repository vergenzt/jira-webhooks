var {agileClient} = require('../jira-client');

var BOARD_ID = process.env.JIRA_BOARD_ID;

// 1. Let top = highest-ranked issue from epic in "To Do".
// 2. Rank trigger issue higher than top.
//
// Docs links:
//  - https://goo.gl/559GY4
//  - https://goo.gl/KSxCRN
//  - https://goo.gl/fdk1wH
module.exports.onTodo = async (event) => {
  var {issue: {key: triggerIssueKey}} = JSON.parse(event.body);

  console.log(triggerIssueKey);

  var {data: {issues: [{key: topIssueKey}]}} = await agileClient.get(`/board/${BOARD_ID}/backlog`, {
    params: {
      maxResults: 1,
      fields: ['key']
    }
  });

  console.log(topIssueKey);

  await agileClient.put('/issue/rank', {
    issues: [triggerIssueKey],
    rankBeforeIssue: topIssueKey
  });
}
