package main

import (
	"fmt"

	"github.com/andygrunwald/go-jira"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/vergenzt/jira-webhooks"
)

func main() {
	lambda.Start(rankIssueHighest)
}

func rankIssueHighest(request struct {
	Body struct {
		Issue struct {
			Key string
		}
	}
}) {
	topIssueKey := getTopIssueKey()
	if topIssueKey != "" {
		rankIssue(request.Body.Issue.Key, topIssueKey)
	}
}

func getTopIssueKey() string {
	// https://developer.atlassian.com/cloud/jira/software/rest/#api-board-boardId-backlog-get
	var topIssues []jira.Issue
	requestUrl := fmt.Sprintf("/rest/agile/1.0/board/%v/backlog", jira_webhooks.Config.BoardId)
	requestParams := jira.SearchOptions{MaxResults: 1, Fields: []string{"key"}}
	request, err := jira_webhooks.Client.NewRequest("GET", requestUrl, requestParams)
	if err != nil {
		panic(err)
	}
	_, err = jira_webhooks.Client.Do(request, &topIssues)
	if err != nil {
		panic(err)
	}

	if len(topIssues) >= 1 {
		return topIssues[0].Key
	} else {
		return ""
	}
}

func rankIssue(issueKey, nextIssueKey string) {
	// https://developer.atlassian.com/cloud/jira/software/rest/#api-issue-rank-put
	requestUrl := "/rest/agile/1.0/issue/rank"
	requestParams := struct {
		IssueKeys    []string `json:"issues"`
		NextIssueKey string   `json:"rankBeforeIssue"`
	}{
		[]string{issueKey},
		nextIssueKey,
	}
	request, err := jira_webhooks.Client.NewRequest("PUT", requestUrl, requestParams)
	if err != nil {
		panic(err)
	}
	_, err = jira_webhooks.Client.Do(request, nil)
	if err != nil {
		panic(err)
	}
}
