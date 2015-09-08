#! /bin/bash

sudo -H pip install --upgrade pip
sudo -H pip install pyopenssl
if [ ! -d ~/google-cloud-sdk ]; then
  export CLOUD_SDK_REPO=cloud-sdk-`lsb_release -c -s`
  echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
  sudo apt-get update && sudo apt-get install google-cloud-sdk
fi
