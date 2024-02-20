#! /usr/bin/env bash

# $1 is absolute archive path (archive is xz)
# $2 is absolute path to das
# $3 is absulute path to

set -ex

docker compose run --rm \
    -v "$1":/tmp/upload.xz \
    --entrypoint="python /code/scripts/import_improvements.py --archive_path /tmp/upload.xz" \
    flask
