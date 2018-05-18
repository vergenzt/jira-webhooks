import os
from jira_client import jira


# ID of the Kanban board to interact with
board_id = os.environ['JIRA_AUTO_UP_NEXT_BOARD_ID']

# Custom field on epics to configure whether this behavior is enabled
enabled_field = os.environ['JIRA_AUTO_UP_NEXT_ENABLED_FIELD']

# Status to transition from backlog into
up_next_status = os.environ['JIRA_AUTO_UP_NEXT_STATUS']


def on_done(event, context):
    """
    Given JIRA transition webhook data from a "Done" transition, check whether
    the associated epic is configured with auto-up-next behavior, and do it if
    so.
    """
    # 1. load issue
    # 2. load epic
    # 3. check_epic(epic)
    pass


def check_epic(epic):
    """
    Given an epic, check if auto-up-next is applicable, and do it if so.
    """
    # 1. load epic, check custom config field
    # ...
    pass


