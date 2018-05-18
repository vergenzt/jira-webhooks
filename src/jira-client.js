var axios = require('axios');

var baseConfig = {
  auth: {
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_PASSWORD,
  }
}

module.exports.baseClient = axios.create({
  baseURL: process.env.JIRA_URL + '/rest/api/2',
  ...baseConfig
});

module.exports.agileClient = axios.create({
  baseURL: process.env.JIRA_URL + '/rest/agile/1.0',
  ...baseConfig
});
