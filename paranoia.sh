#!/bin/bash

rawFile=$(pwd)/$0
myFolder=$(dirname $rawFile)

sourceFolder=/var/lib/couchdb
targetFolder=$myFolder/backups

mkdir -p $targetFolder
echo Backup target: $targetFolder

while [[ true ]]
do
	nowDate=$(date +%Y%m%d%H%M%S)
	$(cd $sourceFolder; tar -czf $targetFolder/eer_$nowDate.tgz *)
	echo Ran backup at $nowDate
	sleep 300
done
