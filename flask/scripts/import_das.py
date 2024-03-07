#! /usr/bin/env python

from os import walk, path

from geoalchemy2.elements import WKTElement
import geopandas
from shapely.geometry.polygon import Polygon
from shapely.geometry.multipolygon import MultiPolygon
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from api.models import DisseminationArea
from api.settings import app_settings
from api.utils import extract_files


def import_rows(dir_path: str, session: Session):
    for root, dirs, filenames in walk(dir_path):
        for filename in filenames:
            if filename.endswith(".shp"):
                print(f"processing {path.join(root, filename)}")
                das = geopandas.read_file(path.join(root, filename))
                das = das.to_crs(epsg=4326)
                rows = []
                for entry in das.iterrows():
                    row = entry[1].to_dict()
                    # das are a mix of polygon and multipolygon
                    # so we'll convert to multi to keep things uniform
                    if isinstance(row["geometry"], Polygon):
                        row["geometry"] = MultiPolygon([row["geometry"]])
                    row["geometry"] = WKTElement(str(row["geometry"]))
                    rows.append(row)

                stmt = insert(DisseminationArea).on_conflict_do_nothing()

                session.execute(stmt, rows)

                session.commit()


def import_das(archive_path: str, session: Session):
    """We assume the .shp file has a suffix like budget\\d+.shp"""
    ext_dir = extract_files(archive_path)

    import_rows(ext_dir, session)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        prog="Import DAs",
        description="Add dissemination areas from a compressed archive.",
    )

    parser.add_argument("--archive_path")

    args = parser.parse_args()

    engine = create_engine(app_settings.POSTGRES_CONNECTION_STRING)

    with Session(engine) as session:
        print("importing DAs...")
        import_das(args.archive_path, session)
