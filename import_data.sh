#! /usr/bin/env bash

set -e

DATA_DIR="${1:-}"

if [[ -z $DATA_DIR ]]; then
    echo "DATA_DIR not provided!"
    exit 1
fi

#./import_data.sh ~/cycle-network-toy/flask/data

docker compose run --rm \
    -v ${DATA_DIR}/best.tar.xz:/tmp/upload.tar.xz \
    --entrypoint="python /code/scripts/import_improvements.py --archive_path /tmp/upload.tar.xz" \
    flask

docker compose run --rm \
    -v ${DATA_DIR}/das.tar.xz:/tmp/upload.tar.xz \
    --entrypoint="python /code/scripts/import_das.py --archive_path /tmp/upload.tar.xz" \
    flask

docker compose run --rm \
    -v ${DATA_DIR}/arterial.tar.xz:/tmp/upload.tar.xz \
    -v ${DATA_DIR}/proj2artid.pkl:/tmp/proj2artid.pkl \
    --entrypoint="python /code/scripts/import_projects.py --archive_path /tmp/upload.tar.xz --mapping_path /tmp/proj2artid.pkl" \
    flask

docker compose run --rm \
    --entrypoint="python /code/scripts/create_dummy_scores.py" \
    flask

docker compose run --rm \
    -v ${DATA_DIR}/cycling-network.geojson:/tmp/upload.geojson \
    --entrypoint="python /code/scripts/import_existing_lanes.py --geojson_path /tmp/upload.geojson" \
    flask


docker compose run --rm \
    -v ${DATA_DIR}/cycling-network.geojson:/tmp/upload.geojson \
    --entrypoint="python /code/scripts/import_existing_lanes.py --geojson_path /tmp/upload.geojson" \
    flask
