var {baseClient, agileClient} = require('../jira-client');

var BOARD_ID = process.env.JIRA_BOARD_ID;

module.exports.onDone = async (event) => {
  var {issue: {key: triggerIssueKey}} = JSON.parse(event.body);

  console.log(`Trigger issue key: ${triggerIssueKey}`);

  // get the trigger issue's epic and available transitions
  var {
    data: {
      fields: { epic: {id: epicId} },
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
  console.log(`Transition ID: ${upNextTransitionId}`);

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
  console
  console.log(`Next issue in backlog: ${upNextInBacklogIssueKey}`);

  if ((upNextIssues || []).length === 0) {
    await baseClient.post(`/issue/${upNextInBacklogIssueKey}/transitions`, {
      transition: { id: upNextTransitionId }
    });
  }
}
