import os
from jira import JIRA

jira = JIRA(
    server = os.environ['JIRA_URL'],
    basic_auth = (
        os.environ['JIRA_USER'],
        os.environ['JIRA_PASS']
    ),
    options = {
        'agile_rest_path': 'agile' # https://git.io/vpAIu
    }
)
