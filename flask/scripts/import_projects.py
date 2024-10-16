#! /usr/bin/env python

from os import walk, path
import pickle

from geoalchemy2.elements import WKTElement
import geopandas
from pyproj import Geod
from shapely.wkt import loads
from sqlalchemy import select, create_engine
from sqlalchemy.orm import Session

from api.models import Arterial, Project
from api.settings import app_settings
from api.utils import extract_files


def _import_arterials(mapping_path: str, dir_path: str, session: Session):

    # {[project_id]: len(project_arterials)}
    proj_size = {}
    # {[art_import_index]: longest_project_id}
    proj_by_art = {}

    with open(mapping_path, "rb") as f:
        project_mapping: list[list[int]] = pickle.load(f)

    for proj_id, arterials in enumerate(project_mapping):
        proj_size[proj_id] = len(arterials)

    for proj_id, import_indices in enumerate(project_mapping):
        for arterial_index in import_indices:
            if proj_size[proj_id] > proj_by_art.get(arterial_index, 0):
                proj_by_art[arterial_index] = proj_id

    i = 0
    geod = Geod(ellps="WGS84")
    for root, dirs, filenames in walk(dir_path):
        for filename in filenames:
            if filename.endswith(".shp"):
                print(f"processing {path.join(root, filename)}")
                arterials = geopandas.read_file(path.join(root, filename))
                rows = [entry[1].to_dict() for entry in arterials.iterrows()]
                for row in rows:
                    existing_feature = session.execute(
                        select(Arterial).filter(Arterial.GEO_ID == row["GEO_ID"])
                    ).scalar()

                    if existing_feature is None:
                        geom = str(row["geometry"])
                        row["geometry"] = WKTElement(geom)
                        row["total_length"] = geod.geometry_length(loads(geom))
                        row["import_idx"] = i
                        arterial = Arterial(**row)
                        if proj_by_art.get(i):
                            default_project = session.execute(
                                select(Project).filter(Project.id == proj_by_art.get(i))
                            ).scalar()
                            arterial.default_project = default_project
                        session.add(arterial)
                        session.commit()
                    i += 1


def _import_projects(mapping_path: str, session: Session):

    with open(mapping_path, "rb") as f:
        project_mapping: list[list[int]] = pickle.load(f)

    i = 0
    for ids in project_mapping:
        existing = session.execute(select(Project).filter(Project.id == i)).scalar()

        if existing is None:
            project = Project(id=i)
            session.add(project)
            session.commit()

        i += 1


def import_projects(archive_path: str, mapping_path: str, session: Session):

    ext_dir = extract_files(archive_path)

    _import_projects(mapping_path, session)

    _import_arterials(mapping_path, ext_dir, session)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        prog="Import projects",
        description="Add a project and its child arterials.",
    )

    parser.add_argument("--archive_path")

    parser.add_argument("--mapping_path")

    args = parser.parse_args()

    engine = create_engine(app_settings.POSTGRES_CONNECTION_STRING)

    with Session(engine) as session:
        print("importing projects and arterials....")
        import_projects(args.archive_path, args.mapping_path, session)
