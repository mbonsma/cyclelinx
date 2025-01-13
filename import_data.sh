#! /usr/bin/env bash

set -e

compose_file="docker-compose.prod.yml"

if [[ -z "$1" ]]; then
    echo >&2 "Please pass in a data directory!" && exit 1
fi

if [[ $1 == "--dev" ]]; then
    if [[ "$#" -lt 2 ]]; then
        echo >&2 "Please pass in a data directory!" && exit 1
    fi
    compose_file="docker-compose.yml"
    shift
else
    echo "Are you really in a production environment? (type y if yes, or else try again with the --dev flag)"
    read -r answer

    if [[ "$answer" != "y" ]]; then
        echo "Aborting" && exit 0
    fi
fi

DATA_DIR="${1}"

# ./import_data.sh --dev <flask/data>

docker compose -f "${compose_file}" run --rm \
    -v ${DATA_DIR}/das.tar.xz:/tmp/upload.tar.xz \
    --entrypoint="python /code/scripts/import_das.py --archive_path /tmp/upload.tar.xz" \
    flask

docker compose -f "${compose_file}" run --rm \
    -v ${DATA_DIR}/arterial.tar.xz:/tmp/upload.tar.xz \
    -v ${DATA_DIR}/proj2artid.pkl:/tmp/proj2artid.pkl \
    --entrypoint="python /code/scripts/import_projects.py --archive_path /tmp/upload.tar.xz --mapping_path /tmp/proj2artid.pkl" \
    flask

docker compose -f "${compose_file}" run --rm \
    -v ${DATA_DIR}/optimal_project_lists.csv:/tmp/optimal_project_lists.csv \
    -v ${DATA_DIR}/proj2artid.pkl:/tmp/proj2artid.pkl \
    --entrypoint="python /code/scripts/import_improvements.py --mapping_path /tmp/proj2artid.pkl --csv_path /tmp/optimal_project_lists.csv" \
    flask

docker compose -f "${compose_file}" run --rm \
    -v ${DATA_DIR}/scores_20241002.csv:/tmp/upload.csv \
    --entrypoint="python /code/scripts/import_scores.py --csv_path /tmp/upload.csv" \
    flask

docker compose -f "${compose_file}" run --rm \
    -v ${DATA_DIR}/cycling-network.geojson:/tmp/upload.geojson \
    --entrypoint="python /code/scripts/import_existing_lanes.py --geojson_path /tmp/upload.geojson" \
    flask
