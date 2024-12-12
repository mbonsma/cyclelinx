from typing import List

from geoalchemy2.elements import WKTElement
import geopandas
from geopandas import GeoDataFrame
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from api.models import Intersection
from api.settings import app_settings
from api.utils import extract_files


def import_intersections(
    intersection_geojson_path: str, unsignaled_ids_path: str, session: Session
):
    intersection_geojson_extracted_path = extract_files(intersection_geojson_path)

    # need to use geopandas or else proper metadata not set
    intersections = geopandas.read_file(intersection_geojson_extracted_path)

    with open(unsignaled_ids_path, "r") as f:
        unsignaled_ids = [int(l) for l in f]

    return _import_intersections(intersections, unsignaled_ids, session)


def _import_intersections(
    intersections: GeoDataFrame, unsignaled_ids: List[int], session: Session
):

    rows = []
    for entry in intersections.iterrows():
        row = entry[1].to_dict()
        if row["INTERSECTION_ID"] in unsignaled_ids:
            geom = str(row["geometry"])
            row["geometry"] = WKTElement(geom)
            rows.append(row)

    stmt = insert(Intersection).on_conflict_do_nothing()
    session.execute(stmt, rows)
    session.commit()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        prog="Import Intersections",
        description="Add a filtered list of intersections to the database.",
    )

    parser.add_argument("--intersection_geojson_path")
    parser.add_argument("--unsignaled_ids_path")

    args = parser.parse_args()

    engine = create_engine(app_settings.POSTGRES_CONNECTION_STRING)

    with Session(engine) as session:
        import_intersections(
            args.intersection_geojson_path, args.unsignaled_ids_path, session
        )
