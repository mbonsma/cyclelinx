#! /usr/bin/env python

from os import walk, path
import re

from geoalchemy2.elements import WKTElement
import geopandas
from pyproj import Geod
from shapely.wkt import loads
from sqlalchemy import select, create_engine
from sqlalchemy.orm import Session

from api.models import Budget, ImprovementFeature
from api.settings import app_settings
from api.utils import extract_files


def get_budget(filename: str, session: Session):
    match = re.search(r"budget(\d+)", filename)
    if not match:
        raise ValueError(
            (
                "Import filename does not include the",
                "word budget followed by budget amount",
                "(e.g., `efficiency-n2000_id33_summary_args_job-budget480.shp`)!",
            )
        )
    budget_name = match.groups()[0]

    budget = session.execute(
        select(Budget).filter(Budget.name == str(budget_name))
    ).scalar()

    if not budget:
        budget = Budget(name=budget_name)
        session.add(budget)
        session.commit()

    return budget


def import_rows(dir_path: str, session: Session):
    geod = Geod(ellps="WGS84")
    for root, dirs, filenames in walk(dir_path):
        for filename in filenames:
            if filename.endswith(".shp"):
                print(f"processing {path.join(root, filename)}")
                budget = get_budget(filename, session)
                features = geopandas.read_file(path.join(root, filename))
                rows = [entry[1].to_dict() for entry in features.iterrows()]
                for row in rows:
                    existing_feature = session.execute(
                        select(ImprovementFeature).filter(
                            ImprovementFeature.GEO_ID == row["GEO_ID"]
                        )
                    ).scalar()

                    if existing_feature is None:
                        geom = str(row["geometry"])
                        row["geometry"] = WKTElement(geom)
                        row["total_length"] = geod.geometry_length(loads(geom))
                        feature = ImprovementFeature(**row)
                        feature.budgets.append(budget)
                        session.add(feature)
                        session.commit()
                    elif budget.name not in [b.name for b in existing_feature.budgets]:
                        existing_feature.budgets.append(budget)
                        session.add(existing_feature)
                        session.commit()


def import_improvements(archive_path: str, session: Session):
    """We assume the .shp file has a suffix like budget \\d+.shp"""
    ext_dir = extract_files(archive_path)

    import_rows(ext_dir, session)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        prog="Import Improvements",
        description="Add features related to a budget from a compressed archive.",
    )

    parser.add_argument("--archive_path")

    args = parser.parse_args()

    engine = create_engine(app_settings.POSTGRES_CONNECTION_STRING)

    with Session(engine) as session:
        import_improvements(args.archive_path, session)
