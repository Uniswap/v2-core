FROM ubuntu:20.04

RUN apt update && \
    DEBIAN_FRONTEND=noninteractive apt -y install \
            software-properties-common npm && \
    npm install -g yarn && \
    rm -rf /var/lib/apt/lists/* && \
    yarn

COPY . /opt
WORKDIR /opt
RUN yarn compile
