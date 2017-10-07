#!/bin/bash
set -e

OUTPUT=$(node "$(pwd)/bin/aftersuccess.js")
STATUS=$?

echo "${STATUS} ${OUTPUT}"

if [[ "${STATUS}" == "0" ]]
then
  git config --global user.name "Dexus via TravisCI"
  git config --global user.email "github@josef-froehle.de"
  git config credential.helper "store --file=.git/credentials"
  echo "https://$GH_TOKEN:@github.com" > .git/credentials
  git checkout "$TRAVIS_BRANCH"
  npm run changelog
  git add HISTORY.md
  git commit -m "Update HISTORY.md via TravisCI" -m "[ci skip]"
  git push
fi
