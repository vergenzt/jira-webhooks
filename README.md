# jira-webhooks 

This repo exists to implement some workflow additions I'd like to add to the personal Jira instance I use to manage my todo list.

## Background

For my system I've settled on using a Kanban board with four statuses:

 1. _To Do_: As the name suggests, these issues need doing.
 2. _Up Next_: The issues I'm currently focusing on.
 3. _Waiting_: Issues that are waiting until a certain "activation date" before they automatically transition to "Up Next".
 4. _Done_: Resolved issues.

I use [Automation for Jira](https://docs.codebarrel.io/automation) and custom fields to manage useful features like recurring issues (issues that clone themselves with a future activation date on completion) and waiting issue activation dates. See [jira-automation-rules](https://github.com/vergenzt/jira-automation-rules) repo for exports of those automation rules.

I'm considering adding a fifth _Blocked_ status for issues that "are blocked by" others and setting up automation rules to transition into and out of it based on issue links, but have not pursued that yet.

## Webhooks in this repo

### On transition to "To Do", rank issue highest

I've found myself not trusting that I'll actually get back to an issue if I deprioritize it out of "Up Next" (to focus on the other more urgent issues) because it often ends up ranked somewhere back in the middle of the backlog. This webhook is set up as a post function on the "To Do" transition to prioritize the trigger issue highest in its backlog.

Why this behavior makes sense on transition from each of the other statuses:
 - From "Up Next": it means the issue was top priority before, so it should be the next priority up after "Up Next" is cleared.
 - From "Waiting": it means there was a reason the issue were set to activate on the date it did, so it should be next up.
 - From "Done": it means the issue wasn't really done right, so probably needs to be looked at next.
