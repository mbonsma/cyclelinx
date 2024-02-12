import json

from sqlalchemy import select
import geopandas
from io import StringIO

from api.models import FeatureScore, ImprovementFeature
from api.utils import db_data_to_geojson_features
from scripts.create_dummy_scores import create_dummy_scores, get_nearby_das
from tests.factories import (
    dissemination_area_factory,
    improvement_feature_model_factory,
)


# TODO: we might be losing a decimal of precision with float
def test_can_make_geojson(app_ctx, fresh_db):
    improvement_feature_model_factory(fresh_db.session).create_batch(10)
    # sanity check on our database reset
    results = fresh_db.session.execute(select(ImprovementFeature)).scalars().all()
    assert len(results) == 10

    geojson = db_data_to_geojson_features(results)

    # poor man's validation....
    geopandas.read_file(StringIO(json.dumps(geojson)))

    assert True


def test_get_nearby_das(fresh_db):
    feature = improvement_feature_model_factory(fresh_db.session).create(
        geometry="LINESTRING(-79.40082705472463 43.64430503964604, -79.40083825308278 43.64430275536802, -79.4027055361314 43.64392631444804)"
    )
    dissemination_area_factory(fresh_db.session).create(
        DAUID=1,
        geometry="MULTIPOLYGON (((-89.54660369558901 33.604813292663984, -89.54618030945963 33.60387151184312, -89.54618030945963 32.60387151184312, -89.54660369558901 33.604813292663984)))",
    )
    # this should be closest...
    dissemination_area_factory(fresh_db.session).create(
        DAUID=3,
        geometry="MULTIPOLYGON (((-79.54503469239548 43.60410899835276, -79.54618030945963 43.60387151184312, -79.54618030945963 42.60387151184312, -79.54503469239548 43.60410899835276)))",
    )

    dissemination_area_factory(fresh_db.session).create(
        DAUID=2,
        geometry="MULTIPOLYGON (((-69.54503469239548 33.60410899835276, -69.54618030945963 33.60387151184312, -69.54618030945963 32.60387151184312, -69.54503469239548 33.60410899835276)))",
    )

    nearby_das = get_nearby_das(feature, fresh_db.session, 1)

    assert nearby_das[0].DAUID == 3


def test_create_dummy_scores(fresh_db):
    improvement_feature_model_factory(fresh_db.session).create_batch(5)
    dissemination_area_factory(fresh_db.session).create_batch(5)

    create_dummy_scores(fresh_db.session, ["a", "b", "c"])

    scores = fresh_db.session.execute(select(FeatureScore)).scalars().all()
    assert len(scores) == 5 * 5 * 3
