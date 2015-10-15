#!/bin/env bash

# stop
docker stop auth-service;
docker stop auth-authorizer;
docker stop auth-crossbar;
docker stop auth-db;

docker logs auth-authorizer;

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
docker rmi auth-base;
