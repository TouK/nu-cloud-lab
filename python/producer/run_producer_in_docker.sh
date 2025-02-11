#!/bin/bash

docker build -t producer-app .
docker run -it producer-app 