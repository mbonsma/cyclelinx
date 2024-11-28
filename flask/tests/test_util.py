import geopandas
from sqlalchemy import select

from api.models import Arterial
from api.utils import model_to_dict, properties_to_geojson_features, DaScoreResult
from tests.factories import (
    arterial_model_factory,
)


# TODO: we might be losing a decimal of precision with float
def test_can_make_geojson(app_ctx, fresh_db):
    arterial_model_factory(fresh_db.session).create_batch(10)

    # sanity check on our database reset
    arterials = fresh_db.session.execute(select(Arterial)).scalars().all()
    assert len(arterials) == 10

    properties = [model_to_dict(a) for a in arterials]

    geojson = properties_to_geojson_features(properties)

    # poor man's validation....
    geopandas.GeoDataFrame.from_features(geojson)

    assert True


def test_da_score_result():
    scores = DaScoreResult()
    da_id = 1
    metric = "foo"
    score = 10
    base_score = 3

    scores.add_da_metric(da_id=da_id, metric=metric, score=score, base_score=base_score)

    results = scores.to_dict()

    assert results[str(da_id)] is not None
    score_block = results[str(da_id)]

    assert score_block["da"] == da_id
    assert score_block["scores"]["bin"][metric] == 1
    assert score_block["scores"]["budget"][metric] == 13
    assert score_block["scores"]["diff"][metric] == 10
    assert score_block["scores"]["original"][metric] == 3
