var jira = require('../jira-client');
var _ = require('lodash');

module.exports.handler = async () => {
  const issues = await jira.getIssues({
    jql: 'project = TODO and statusCategory != Done order by rank',
    expand: 'editmeta',
    maxResults: 500
  });

  const sortedIssues = _.sortBy(issues, ({ key, fields, editmeta }) => {
    const importanceMeta = _.find(editmeta.fields, { name: 'Importance' });
    const importances = importanceMeta.allowedValues

    const issueImportanceId = fields[importanceMeta.key].id;
    return [
      _.findIndex(importances, { id: issueImportanceId }),
      _.findIndex(issues, { key })
    ];
  });

  await jira.orderIssues(sortedIssues);
  return {
    statusCode: 200,
    body: 'success'
  };
};
