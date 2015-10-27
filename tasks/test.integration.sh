#!/bin/env bash

# install
docker build -t auth-base -f tasks/integration/dockerfiles/baseDockerfile .;
docker build -t auth-crossbar -f tasks/integration/dockerfiles/crossbarDockerfile .;
docker build -t auth-authorizer -f tasks/integration/dockerfiles/authorizerDockerfile .;
docker build -t auth-service -f tasks/integration/dockerfiles/serviceDockerfile .;
docker build -t auth-test -f tasks/integration/dockerfiles/testDockerfile .;

# start services
echo "starting database server...";
docker run -d \
	--name auth-db \
	memsql/quickstart;
sleep 20;

echo "creating databases...";
# docker exec doest not work in circle ci.
# docker exec -d authorizer-db memsql-shell -e \
# "create database authorizer;";
docker run --rm \
	--name auth-mysql-client \
	--link auth-db:db \
	mysql sh -c \
	'mysql -h "$DB_PORT_3306_TCP_ADDR" -u root \
	--execute="create database authorizer;"';
sleep 20;

echo "starting crossbar...";
docker run -d \
  --name auth-crossbar \
  auth-crossbar;
sleep 20;

echo "starting authorizer...";
docker run -d \
  --name auth-authorizer \
  --link auth-db:db \
  --link auth-crossbar:crossbar \
  auth-authorizer \
    --ws-password servicepassword;
sleep 20;

echo "starting service...";
docker run -d \
  --name auth-service \
  --link auth-crossbar:crossbar \
  auth-service \
    --ws-password servicepassword;
sleep 20;

echo "running test...";
docker run \
  --name auth-test \
  --link auth-crossbar:crossbar \
  auth-test;
TEST_EC=$?;

# return with the exit code of the test
if [ $TEST_EC -eq 0 ]
then
  echo "It Saul Goodman !";
  exit 0;
else
  exit $TEST_EC;
fi
