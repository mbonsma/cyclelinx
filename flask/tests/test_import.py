from csv import DictWriter
from os import path
import pickle

from sqlalchemy import select

from api.models import (
    Arterial,
    Budget,
    DisseminationArea,
    ExistingLane,
    Project,
)
from api.utils import extract_files
from scripts.import_das import import_das
from scripts.import_improvements import import_improvements
from scripts.import_projects import _import_arterials, _import_projects
from scripts.import_existing_lanes import import_geojson
from tests.factories import (
    arterial_model_factory,
    budget_model_factory,
    project_model_factory,
)


def test_import_existing(app_ctx, fresh_db):
    session = fresh_db.session
    test_import_path = path.join(
        path.dirname(__file__), "fixtures", "cycling-network.geojson"
    )
    import_geojson(test_import_path, session)
    existing = fresh_db.session.execute(select(ExistingLane)).scalars().all()
    assert len(existing) == 1445


def test_import_improvements(app_ctx, fresh_db, tmp_path):
    session = fresh_db.session

    for i in range(0, 5):
        arterial_model_factory(session).create(import_idx=i)

    mapping = [[0], [1, 2, 3], [0, 4]]

    projects = []
    for idx, _ in enumerate(mapping):
        p = Project(id=idx)
        session.add(p)
        session.commit()
        projects.append(p)

    mapping_location = tmp_path / "mapping.pkl"
    with open(mapping_location, "wb") as f:
        pickle.dump(mapping, f)

    csv_path = tmp_path / "test_csv.csv"
    with open(csv_path, "w") as f:
        writer = DictWriter(f, ["budget", "projects"])
        writer.writeheader()
        writer.writerow(
            {
                "budget": "123",
                "projects": f"[{','.join([str(p.id) for p in projects])}]",
            }
        )

    import_improvements(mapping_location, csv_path, fresh_db.session)

    budget = session.execute(select(Budget)).scalar()

    relationships = budget.improvement_relationships

    assert len(relationships) == 6  # 6 arterials in the mapping, including dupe


def test_import_arterials(app_ctx, fresh_db, tmp_path):
    session = fresh_db.session

    # we have a duplicate here, so we'd expect arterial w/ index 0 to have default_project_id 2
    mapping = [[0], [1, 2, 3], [0, 4]]

    for idx, _ in enumerate(mapping):
        p = Project(id=idx)
        session.add(p)
        session.commit()

    mapping_location = tmp_path / "mapping.pkl"
    with open(mapping_location, "wb") as f:
        pickle.dump(mapping, f)

    extracted_path = extract_files(
        path.join(path.dirname(__file__), "fixtures", "arterial.tar.xz")
    )
    _import_arterials(mapping_location, extracted_path, fresh_db.session)
    arterials = fresh_db.session.execute(select(Arterial)).scalars().all()
    assert len(arterials) == 9981

    for arterial in arterials:
        if arterial.import_idx in [1, 2, 3]:
            assert arterial.default_project_id == 1
        elif arterial.import_idx in [0, 4]:
            assert arterial.default_project_id == 2
        else:
            assert arterial.default_project_id is None


def test_import_das(app_ctx, fresh_db):
    test_import_path = path.join(path.dirname(__file__), "fixtures", "das.tar.xz")
    import_das(test_import_path, fresh_db.session)
    das = fresh_db.session.execute(select(DisseminationArea)).scalars().all()
    assert len(das) == 3702


def test_import_projects(app_ctx, fresh_db, tmp_path):
    mapping = [[0], [1, 2, 3], [0, 4]]
    mapping_location = tmp_path / "mapping.pkl"
    with open(mapping_location, "wb") as f:
        pickle.dump(mapping, f)
    _import_projects(mapping_location, fresh_db.session)

    projects = fresh_db.session.execute(select(Project)).scalars().all()

    assert len(projects) == 3
