import json

import geopandas
from io import StringIO
from sqlalchemy import select


from api.models import Arterial
from api.utils import db_data_to_geojson_features
from tests.factories import (
    arterial_model_factory,
)


# TODO: we might be losing a decimal of precision with float
def test_can_make_geojson(app_ctx, fresh_db):
    arterial_model_factory(fresh_db.session).create_batch(10)

    # sanity check on our database reset
    results = fresh_db.session.execute(select(Arterial)).scalars().all()
    assert len(results) == 10

    geojson = db_data_to_geojson_features(results)

    # poor man's validation....
    geopandas.GeoDataFrame.from_features(geojson)

    geojson = db_data_to_geojson_features(results, [{"a": 1} for i in range(10)])

    geopandas.read_file(StringIO(json.dumps(geojson)))

    assert True
