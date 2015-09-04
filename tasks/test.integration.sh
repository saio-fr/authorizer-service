#!/bin/env bash

# install
#docker build -t auth-base -f tasks/integration/baseDockerfile .;
docker build -t auth-crossbar -f tasks/integration/crossbarDockerfile .;
docker build -t auth-authorizer -f tasks/integration/authorizerDockerfile .;
docker build -t auth-service -f tasks/integration/serviceDockerfile .;
docker build -t auth-test -f tasks/integration/testDockerfile .;

# start services
echo "starting database...";
docker run -d \
	--name auth-db \
	-e POSTGRES_PASSWORD=test \
	postgres;
sleep 3;

echo "starting crossbar...";
docker run -d \
  --name auth-crossbar \
  auth-crossbar;
sleep 3;

echo "starting authorizer...";
docker run -d \
  --name auth-authorizer \
  --link auth-db:db \
  --link auth-crossbar:crossbar \
  auth-authorizer \
    --ws-password servicepassword \
    --db-password test;
sleep 3;

echo "starting service...";
docker run -d \
  --name auth-service \
  --link auth-crossbar:crossbar \
  auth-service \
    --ws-password servicepassword;
sleep 3;

echo "running test...";
docker run \
  --name auth-test \
  --link auth-crossbar:crossbar \
  auth-test;
TEST_EC=$?;

# stop
docker stop auth-service;
docker stop auth-authorizer;
docker stop auth-crossbar;
docker stop auth-db;

# clean
docker rm auth-test;
docker rm auth-service;
docker rm auth-authorizer;
docker rm auth-crossbar;
docker rm auth-db;

# uninstall
docker rmi auth-test;
docker rmi auth-service;
docker rmi auth-authorizer;
docker rmi auth-crossbar;
# docker rmi auth-base;

# return with the exit code of the test
if [ $TEST_EC -eq 0 ]
then
  echo "It Saul Goodman !";
  exit 0;
else
  echo "test failed";
  exit $TEST_EC;
fi
