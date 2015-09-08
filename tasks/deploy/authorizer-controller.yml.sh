#!/bin/bash
cat > tasks/deploy/authorizer-controller.yml <<EOF

apiVersion: v1
kind: ReplicationController
metadata:
  name: authorizer
  labels:
    name: authorizer
    branch: ${CIRCLE_BRANCH}
spec:
  replicas: ${REPLICAS_NUMBER}
  # selector identifies the set of pods that this
  # replication controller is responsible for managing
  selector:
    name: authorizer
    branch: ${CIRCLE_BRANCH}
  # template defines the 'cookie cutter' used for creating
  # new pods when necessary
  template:
    metadata:
      labels:
        # Important: these labels need to match the selector above
        # The api server enforces this constraint.
        name: authorizer
        branch: ${CIRCLE_BRANCH}
    spec:
      containers:
      - name: authorizer
        command: ["npm", "start", "--"]
        args: ["--ws-url", "ws://crossbar-private:8081", "--db-host", "memsql"]
        image: eu.gcr.io/saio-fr/authorizer:${CIRCLE_BRANCH}.${CIRCLE_SHA1}
        ports:
        - containerPort: 8081

EOF
