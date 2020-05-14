var jira = require('../jiraClient');
var _ = require('lodash');

const getEscalationTermRegex = (importances) => new Regex(
  '\s*'
  + '(?<num>[-+]?\d+)'
  + '\s*'
  + '('
    + '(?<unitYear>y(ears?)?)|'
    + '(?<unitMonth>m(onths?)?)|'
    + '(?<unitWeek>w(eeks?)?)|'
    + '(?<unitDay>d(ays?)?)'
  + ')'
  + '(\s+(from|after) (?<baseline>due|start|created)( date)?\s+)?'
  + '('
    + '(\s*(?<importanceAbbr>⏬|🟢|🟡|🔶|🔺)\s*,?)'
    + '|(\s+(?<importanceAbbr>lowest|low|medium|high|highest))\s*(,|\s+|$)'
  + ')'
  , 'iug'
)

const parseEscalations = (escalationString) => {
  for (let match in escalationString.matchAll(escalationTermRegex)) {
    if (match.index != nextIndex) {
      throw new Error(`Could not parse escalation starting at index ${nextIndex}`)
    }
    nextIndex += match.length

    let date, importance;
    let {num, unit, baseline, importanceAbbr} = match;
    if (baseline) {
      date = dates[baseline] + parse
    }
  }
}

async function *parseEscalations(issueKey, importanceFieldName, escalationFieldName) {
  const {data: {
    editmeta: {
      fields: fieldsEditMeta
    },
    fields,
  }} = await jira.baseClient.get(`/issue/${issueKey}`);

  const fieldNames = new Map({
    importance: importanceFieldName,
    escalationString: escalationFieldName,
    due: 'Due date',
    start: 'Start date',
    created: 'Created'
  });
  const fieldKeys = fieldNames.mapValues(fieldName =>
    Object.entries(fieldsEditMeta).find(
      ([fieldKey, { name: _fieldName }]) => fieldName === _fieldName
    )[0]
  );

  const importances = fieldsEditMeta[fieldKeys.importance].allowedValues.map(v => v.value);
  const {importance, escalationString, ...dates} = fieldKeys.map(k => fields[k]);
  const escalationTermRegex = getEscalationTermRegex(importances);

  let nextIndex = 0;
}

function validateHandler() {
}

function dailyCheckEscalationsHandler() {
}

const

module.exports = {
  escalationTermRegex,
  validateHandler,
  dailyCheckEscalationsHandler,
};
