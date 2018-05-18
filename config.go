package jira_webhooks

import (
	"github.com/andygrunwald/go-jira"
	"github.com/kelseyhightower/envconfig"
)

var Config struct {
	Url      string
	Username string
	Password string
	BoardId  string
}

func init() {
	envconfig.MustProcess("jira", &Config)
}

var Client *jira.Client

func init() {
	var err error
	tp := jira.BasicAuthTransport{Username: Config.Username, Password: Config.Password}
	Client, err = jira.NewClient(tp.Client(), Config.Url)
	if err != nil {
		panic(err)
	}
}
