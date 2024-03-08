#! /usr/bin/env python

import json

from geoalchemy2.elements import WKTElement
import geopandas
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from api.models import ExistingLane
from api.settings import app_settings


def import_geojson(geojson_path: str, session: Session):
    rows = []
    # need to use geopandas or else proper metadata not set
    geojson = geopandas.read_file(geojson_path)
    for entry in geojson.iterrows():
        row = entry[1].to_dict()
        row["geometry"] = WKTElement(str(row["geometry"]))
        rows.append(row)

    stmt = insert(ExistingLane).on_conflict_do_nothing()
    session.execute(stmt, rows)
    session.commit()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        prog="Import Existing lanes",
        description="Add geojson to the database.",
    )

    parser.add_argument("--geojson_path")

    args = parser.parse_args()

    engine = create_engine(app_settings.POSTGRES_CONNECTION_STRING)

    with Session(engine) as session:
        import_geojson(args.geojson_path, session)
