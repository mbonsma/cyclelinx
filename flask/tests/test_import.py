from os import path
import json

from sqlalchemy import select
import geopandas
from io import StringIO

from api.models import ImprovementFeature
from api.utils import improvement_features_to_geojson_features
from scripts.import_improvements import import_improvements
from tests.factories import improvement_feature_model_factory


def test_import(app_ctx, fresh_db):
    test_import_path = path.join(path.dirname(__file__), "fixtures", "budget_40.xz")
    import_improvements(test_import_path, fresh_db)
    features = fresh_db.session.execute(select(ImprovementFeature)).scalars().all()
    assert len(features) == 118
    assert features[0].budgets[0].name == "40"


# TODO: break these up
# TODO: we might be losing a decimal of precision with float
def test_can_make_geojson(app_ctx, fresh_db):
    improvement_feature_model_factory(fresh_db.session).create_batch(10)
    # sanity check on our database reset
    results = fresh_db.session.execute(select(ImprovementFeature)).scalars().all()
    assert len(results) == 10

    geojson = improvement_features_to_geojson_features(results)

    # poor man's validation....
    geopandas.read_file(StringIO(json.dumps(geojson)))

    assert True
