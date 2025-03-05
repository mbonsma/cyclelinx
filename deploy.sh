#! /usr/bin/env bash

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec --workdir /code/api flask alembic upgrade head
