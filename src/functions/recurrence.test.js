const { baseClient: jiraClient } = require('../jiraClient');
const { updateStartDate, START_DATE, DUE_DATE, REPEATS } = require('./recurrence');

test('marking an issue as done resets start date', async () => {

  const { key } = await jiraClient.post(`/issue`, {
    fields: {
      summary: 'Test recurrence',
      [START_DATE]: '2020-05-24',
      [REPEATS]: 'starting 3 days after completion',
    }
  });

  // requires setting up external transition webhook

})
