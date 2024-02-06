#! /usr/bin/env python

from os import walk, path
from pathlib import Path
import re
import tarfile
import tempfile

from geoalchemy2.elements import WKTElement
import geopandas
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert

from api.models import Budget, ImprovementFeature
from api.db import db


def extract_files(path: str):

    if not Path(path).exists():
        raise ValueError(f"Path {path} does not exist!")

    tempdir = tempfile.mkdtemp()

    with tarfile.open(path) as f:
        f.extractall(tempdir)

    return tempdir


def get_budget(filename: str):
    match = re.search(r"budget(\d+)", filename)
    if not match:
        raise ValueError(
            (
                "Import filename does not include the",
                "word budget followed by budget amount"
                "(e.g., `efficiency-n2000_id33_summary_args_job-budget480.shp`)!",
            )
        )
    budget_name = match.groups()[0]

    budget = db.session.execute(
        select(Budget).filter(Budget.name == str(budget_name))
    ).first()

    if not budget:
        budget = Budget(name=budget_name)
        db.session.add(budget)
        db.session.commit()

    return budget


def import_improvements(archive_path: str, truncate=True):
    """We assume the .shp file has a suffix like budget\d+.shp"""
    ext_dir = extract_files(archive_path)

    if truncate:
        db.session.execute(delete(ImprovementFeature))
        db.session.commit()

    for _, _, filenames in walk(ext_dir):
        for filename in filenames:
            if filename.endswith(".shp"):

                budget = get_budget(filename)
                features = geopandas.read_file(path.join(ext_dir, filename))
                rows = [entry[1].to_dict() for entry in features.iterrows()]
                for row in rows:
                    existing_feature = db.session.execute(
                        select(ImprovementFeature).filter(
                            ImprovementFeature.GEO_ID == row["GEO_ID"]
                        )
                    ).first()

                    if existing_feature is None:
                        row["geometry"] = WKTElement(str(row["geometry"]))
                        feature = ImprovementFeature(**row)
                        feature.budgets.append(budget)
                        db.session.add(feature)
                        db.session.commit()
                    elif budget.name not in [b.name for b in existing_feature.budgets]:
                        existing_feature.budgets.append(budget)
                        db.session.add(existing_feature)
                        db.session.commit()
