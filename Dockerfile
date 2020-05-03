FROM docker:19.03

COPY package.json /updater/package.json
COPY lib /updater/lib
COPY app.js /updater/app.js

RUN apk add --no-cache nodejs-npm && \
    cd /updater && \
    rm /updater/lib/current_config.json && \
    npm install . -g