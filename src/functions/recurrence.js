const jiraClient = require('../jiraClient');
const moment = require('moment');

const START_DATE = 'customfield_10015';
const DUE_DATE = 'duedate';
const REPEATS = 'customfield_10035';
const REPEATS_REGEX = /(?<targetFieldStr>starting) (?<intervalStr>-?\d+) (?<unit>day|week|month|year)s? (after|from) (?<baselineStr>start|due|completion)( date)?/i;

const updateStartDate = async (eventEmitter) => {
  const {
    timestamp: completionDateEpoch,
    issue: {
      key: issueKey,
      fields: {
        [REPEATS]: repeats,
        [START_DATE]: startDateStr,
        [DUE_DATE]: dueDateStr,
      }
    }
  } = webhookBody;

  const startDate = moment(startDateStr, 'YYYY-MM-DD');
  const dueDate = moment(dueDateStr, 'YYYY-MM-DD');
  const completionDate = moment(parseInt(completionDateEpoch));

  const match = repeats.match(REPEATS_REGEX);
  const { targetFieldStr, intervalStr, unit, baselineStr } = match.groups;

  const targetField = { 'starting': START_DATE }[ targetFieldStr ];
  const interval = parseInt(intervalStr);
  const baseline = { 'start': startDate, 'due': dueDate, 'completion': completionDate }[ baselineStr ];

  const targetValue = baseline.add(interval, unit);
  const targetValueStr = targetValue.format('YYYY-MM-DD');

  const targetFieldCommentStr = { [START_DATE]: 'start date' }[ targetField ];
  await jira.addComment(issueKey, `Updating ${targetFieldCommentStr} to ${targetValueStr}.`);

  await jira.updateIssue(issueKey, { fields: { [targetField]: targetValueStr }});
};

module.exports = {

  updateStartDate,
  START_DATE,
  DUE_DATE,
  REPEATS,

  handleTransitionWebhook: jiraClient.createHandleWebhookFn(updateStartDate, ['status'])

};
