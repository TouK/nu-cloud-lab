#!/bin/bash

docker build -t consumer-app .
docker run -it  consumer-app 