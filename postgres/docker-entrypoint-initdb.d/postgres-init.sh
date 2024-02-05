#!/bin/bash
set -e

apt-get update && apt-get install postgresql-contrib -y

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE EXTENSION postgis;
EOSQL
