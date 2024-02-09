from os import path

from sqlalchemy import select

from api.models import DisseminationArea, ImprovementFeature
from scripts.import_improvements import import_improvements
from scripts.import_das import import_das


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
