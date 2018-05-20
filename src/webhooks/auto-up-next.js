var {baseClient, agileClient} = require('../jira-client');

var BOARD_ID = process.env.JIRA_BOARD_ID;
var AUTO_UP_NEXT_MARKER = process.env.JIRA_AUTO_UP_NEXT_MARKER || '^';

// TODO: extract API calls into jira-client
module.exports.onDone = async (event) => {
  var {issue: {key: triggerIssueKey}} = JSON.parse(event.body);

  console.log(`Trigger issue key: ${triggerIssueKey}`);

  // get the trigger issue's epic and available transitions
  var {
    data: {
      fields: {
        epic: {
          id: epicId,
          name: epicName
        }
      },
      transitions
    }
  } = await agileClient.get(`/issue/${triggerIssueKey}`, {
    params: {
      expand: 'transitions',
      fields: ['epic']
    }
  });
  var {id: upNextTransitionId} = transitions.find(({to: {name}}) => name === 'Up Next');

  console.log(`Epic ID: ${epicId}`);
  console.log(`Epic Name: ${epicName}`);
  console.log(`Transition ID: ${upNextTransitionId}`);

  if (!epicName.startsWith(AUTO_UP_NEXT_MARKER)) {
    console.log(`Epic name does not start with '${AUTO_UP_NEXT_MARKER}'. Doing nothing.`);
    return;
  }

  var [
    { data: { issues: upNextIssues }},
    { data: { issues: [ { key: upNextInBacklogIssueKey }]}}
  ] = await Promise.all(
    ['Up Next', 'To Do'].map(
      status => agileClient.get(`/board/${BOARD_ID}/epic/${epicId}/issue`, {
        params: {
          jql: `status = "${status}"`,
          maxResults: 1,
          fields: ['key']
        }
      })
    )
  );

  console.log(`Any issues up next? ${(upNextIssues || []).length > 0}`);

  if ((upNextIssues || []).length > 0) {
    console.log(`Issues are in up next. Doing nothing.`);
    return;
  }

  console.log(`Next issue in backlog: ${upNextInBacklogIssueKey}`);

  await baseClient.post(`/issue/${upNextInBacklogIssueKey}/transitions`, {
    transition: { id: upNextTransitionId }
  });
}
