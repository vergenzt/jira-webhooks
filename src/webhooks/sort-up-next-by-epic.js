var jira = require('../jira-client');
var _ = require('lodash');

module.exports.handler = async () => {
  var [allEpicIds, allIssues] = await Promise.all([
    jira.getEpicIdsByRank(),
    jira.getIssues({ jql: `status = "Up Next"` })
  ]);

  var issuesByEpicId = _.groupBy(allIssues, 'fields.epic.id');
  var issueKeysByEpicId = _.mapValues(issuesByEpicId, issues => _.map(issues, 'key'));
  var epicIds = _.intersectionBy(allEpicIds, _.keys(issueKeysByEpicId), id => id.toString());

  console.log(`Epic IDs: ${epicIds}`);
  console.log(`Issues keys by Epic ID: ${JSON.stringify(issueKeysByEpicId)}`);

  if (epicIds.length > 1) {
    for (var [i, epicId] of epicIds.entries()) {
      var issueKeys = issueKeysByEpicId[epicId];

      if (i === 0) {
        console.log(`Ranking issues higher: ${issueKeys}`);
        // rank epic issues before first issue of next epic
        var nextEpicId = epicIds[i+1];
        var nextEpicIssueKeys = issueKeysByEpicId[nextEpicId];
        await jira.rankIssues(issueKeys, {rankBeforeIssue: _.first(nextEpicIssueKeys)});
      } else {
        console.log(`Ranking issues lower: ${issueKeys}`);
        // rank epic issues after last issue of previous epic
        var lastEpicId = epicIds[i-1];
        var lastEpicIssueKeys = issueKeysByEpicId[lastEpicId];
        await jira.rankIssues(issueKeys, {rankAfterIssue: _.last(lastEpicIssueKeys)});
      }
    }
  }
};
