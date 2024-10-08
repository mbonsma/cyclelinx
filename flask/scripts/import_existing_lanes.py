#! /usr/bin/env python

from geoalchemy2.elements import WKTElement
import geopandas
from pyproj import Geod
from shapely.wkt import loads
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from api.models import ExistingLane
from api.settings import app_settings


def import_geojson(geojson_path: str, session: Session):
    rows = []
    geod = Geod(ellps="WGS84")
    # need to use geopandas or else proper metadata not set
    geojson = geopandas.read_file(geojson_path)
    for entry in geojson.iterrows():
        row = entry[1].to_dict()
        geom = str(row["geometry"])
        row["geometry"] = WKTElement(geom)
        row["total_length"] = geod.geometry_length(loads(geom))
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
