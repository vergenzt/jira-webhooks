var jira = require('../jira-client');
var _ = require('lodash');

module.exports.handler = async () => {
  const [epics, priorities, issues] = await Promise.all([
    jira.getEpics(),
    jira.getPriorities(),
    jira.getIssues({ jql: `status in ("Up Next", "In Progress")`, maxResults: 500 }),
  ]);

  console.log(`# epics: ${epics.length}`);
  console.log(`# priorities: ${priorities.length}`);
  console.log(`# issues: ${issues.length}`);

  const issueEpicRank = ({ fields: { epic } }) => {
    if (epic && epic.id) {
      const epicRank = _.findIndex(epics, { id: epic.id });
      return epicRank >= 0 ? epicRank : issues.length;
    } else {
      return issues.length;
    }
  };
  const issuePriorityRank = ({ fields: { priority: { name } } }) => (
    _.findIndex(priorities, { name })
  );

  const sortedIssues = _.sortBy(issues, [
    // highest priority first
    issue => issuePriorityRank(issue) === 0 ? 0 : 1,
    // then by epic
    issueEpicRank,
    // then by priority within epic
    issuePriorityRank,
  ]);

  await jira.orderIssues(sortedIssues);
};
