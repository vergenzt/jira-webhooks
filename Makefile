all: bin/webhooks/rank_issue_highest

bin/%: %/*.go
	GOOS=linux go build -o $@ ./$*

deploy: all
	sls deploy
