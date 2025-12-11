#!/bin/bash

FILE="liquibase/root.changelog.xml"

if [ ! -f "$FILE" ]; then
  echo "${FILE} does not exist."
  exit 1
fi

if [ ! -s "$FILE" ]; then
  echo "Removing liquibase setup (not being used)"
  rm liquibase.properties
  rm -rf liquibase
  rm .github/workflows/flights_liquibase.yml
fi
