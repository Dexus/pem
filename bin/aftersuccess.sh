#!/bin/bash
set -e

VAR_PUSH=0

for i in "$@" ; do
    if [[ $i == "-push" ]] ; then
        VAR_PUSH=1
        break
    fi
done

git config --global user.name "Dexus via TravisCI"
git config --global user.email "github@josef-froehle.de"
git config credential.helper "store --file=.git/credentials"
echo "https://$GH_TOKEN:@github.com" > .git/credentials
git fetch
#git rm package-lock.json
git checkout "$TRAVIS_BRANCH" || exit 0

if [[ "${VAR_PUSH}" == "1" ]]
then
  git fetch --unshallow
  OUTPUT=$(node "$(pwd)/bin/aftersuccess.js")
  STATUS=$?
  echo "${OUTPUT}"
fi

if [[ "${STATUS}" == "0" && "${VAR_PUSH}" == "1" ]]
then
  sleep 10
  git pull
  npm run changelog
  git add HISTORY.md
  git commit -a -m "Update HISTORY.md via TravisCI" -m "[ci skip]"
  git push
fi
