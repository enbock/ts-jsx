#!/usr/bin/env bash
npm run build
cü package.json ./dist/package.json
cp LICENSE ./dist/
cp README.md ./dist/
cp -r example ./dist/
cp -r doc ./dist/
npm publish ./dist/

cat package.json | sed 's|"name": "@enbock/ts-jsx"|"name": "ts-jsx"|' > ./dist/package.json
npm publish ./dist/
