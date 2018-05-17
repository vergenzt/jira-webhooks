import os
import json
from jira_client import jira

JQL_FOR_TOP_ISSUE = os.environ['JIRA_JQL_FOR_TOP_ISSUE']

def handler(event, context):
    """
    1. Let top = [highest-ranked issue from epic](https://goo.gl/559GY4) in "To Do".
    2. [Rank trigger issue](https://goo.gl/KSxCRN) higher than top.
    """
    event_body = json.loads(event['body'])

    trigger_issue_key = event_body['issue']['key'] # https://goo.gl/fdk1wH
    top_issues = jira.search_issues(JQL_FOR_TOP_ISSUE, maxResults=1)
    top_issue_key = top_issues[0].key

    jira.rank(trigger_issue_key, top_issue_key)


if __name__=='__main__':
    # test case: it worked!
    # JIRA_URL=https://vergenz.atlassian.net
    # JIRA_JQL_FOR_TOP_ISSUE="project=TODO and statusCategory!=Done order by rank"
    handler({'body': {'issue': {'key': 'TODO-829'}}}, None)
