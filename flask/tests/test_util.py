import json

from sqlalchemy import select
import geopandas
from io import StringIO

from api.models import ImprovementFeature
from api.utils import improvement_features_to_geojson_features
from tests.factories import improvement_feature_model_factory


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
