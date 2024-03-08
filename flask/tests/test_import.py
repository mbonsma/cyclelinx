from os import path
import pickle

from sqlalchemy import select

from api.models import (
    Arterial,
    DisseminationArea,
    ExistingLane,
    ImprovementFeature,
    Project,
)
from api.utils import extract_files
from scripts.import_das import import_das
from scripts.import_improvements import import_improvements
from scripts.import_projects import import_arterials, _import_projects
from scripts.import_existing_lanes import import_geojson
from tests.factories import arterial_model_factory


def test_import_existing(app_ctx, fresh_db):
    session = fresh_db.session
    test_import_path = path.join(
        path.dirname(__file__), "fixtures", "cycling-network.geojson"
    )
    import_geojson(test_import_path, session)
    existing = fresh_db.session.execute(select(ExistingLane)).scalars().all()
    assert len(existing) == 1445


def test_import_features(app_ctx, fresh_db):
    test_import_path = path.join(path.dirname(__file__), "fixtures", "budget_40.xz")
    import_improvements(test_import_path, fresh_db.session)
    features = fresh_db.session.execute(select(ImprovementFeature)).scalars().all()
    assert len(features) == 118
    assert features[0].budgets[0].name == "40"


def test_import_das(app_ctx, fresh_db):
    test_import_path = path.join(path.dirname(__file__), "fixtures", "das.xz")
    import_das(test_import_path, fresh_db.session)
    das = fresh_db.session.execute(select(DisseminationArea)).scalars().all()
    assert len(das) == 3702


def test_import_arterials(app_ctx, fresh_db):
    extracted_path = extract_files(
        path.join(path.dirname(__file__), "fixtures", "arterial.xz")
    )

    import_arterials(extracted_path, fresh_db.session)
    arterials = fresh_db.session.execute(select(Arterial)).scalars().all()
    assert len(arterials) == 9981


def test_import_projects(app_ctx, fresh_db, tmp_path):
    mapping = [[0], [1, 2, 3], [0, 4]]
    mapping_location = tmp_path / "mapping.pkl"
    with open(mapping_location, "wb") as f:
        pickle.dump(mapping, f)
    for i in range(5):
        arterial_model_factory(fresh_db.session).create(import_idx=i)
    _import_projects(mapping_location, fresh_db.session)

    projects = fresh_db.session.execute(select(Project)).scalars().all()

    assert len(projects[0].arterials) == 1
    assert len(projects[1].arterials) == 3
    assert len(projects[2].arterials) == 2
