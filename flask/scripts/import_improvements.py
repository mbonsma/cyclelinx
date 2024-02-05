#! /usr/bin/env python

from os import walk
from os import path
from pathlib import Path
import tarfile
import tempfile

from geoalchemy2.elements import WKTElement
import geopandas
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert

from api.models import ImprovementFeature
from api.db import db


def extract_files(path: str):

    if not Path(path).exists():
        raise ValueError(f"Path {path} does not exist!")

    tempdir = tempfile.mkdtemp()

    with tarfile.open(path) as f:
        f.extractall(tempdir)

    return tempdir


def import_improvements(archive_path: str, truncate=True):
    ext_dir = extract_files(archive_path)

    if truncate:
        db.session.execute(delete(ImprovementFeature))
        db.session.commit()

    # TODO: Attach to budget
    for _, _, filenames in walk(ext_dir):
        for filename in filenames:
            if filename.endswith(".shp"):
                features = geopandas.read_file(path.join(ext_dir, filename))
                rows = [entry[1].to_dict() for entry in features.iterrows()]
                for row in rows:
                    for k, v in row.items():
                        if k == "geometry":
                            row[k] = WKTElement(str(v))

                insert_stmt = insert(ImprovementFeature)
                db.session.execute(
                    insert_stmt.on_conflict_do_nothing(index_elements=["GEO_ID"]),
                    rows,
                )
                db.session.commit()
