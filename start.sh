#!/bin/bash
cd "$(dirname "$0")"
NODE_TLS_REJECT_UNAUTHORIZED=0 node server.js
