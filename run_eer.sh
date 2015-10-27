#!/bin/bash

curl http://127.0.0.1:5984/ 2>&1 | grep 'Connection refused' > /dev/null
if [[ $? -eq 0 ]]; then
	echo "Couch doesn't appear to be running. Start it first"
	exit 1
fi

curl http://127.0.0.1:5984/eer | grep 'not_found' > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
	echo "Couch doesn't seem to have the EER database. Making it..."
	curl -X PUT http://127.0.0.1:5984/eer
	curl -X PUT http://127.0.0.1:5984/eer/_design/eer -d @app/db.json
fi

gulp mwm &
gulp serve:user &

echo "Started EER server processes in the background; 'ps' and 'kill -9 ...' the gulp processes to stop it"
