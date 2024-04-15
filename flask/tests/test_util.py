import json

import geopandas
from io import StringIO
import shapely.geometry
from sqlalchemy import select
import shapely

from api.models import ImprovementFeature, BudgetScore
from api.utils import db_data_to_geojson_features
from scripts.create_dummy_scores import create_dummy_scores, get_nearby_das
from tests.factories import (
    budget_model_factory,
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
    geopandas.GeoDataFrame.from_features(geojson)

    geojson = db_data_to_geojson_features(results, [{"a": 1} for i in range(10)])

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
    session = fresh_db.session
    poly = shapely.geometry.MultiPolygon(
        [(((0.0, 0.0), (0.0, 1.0), (1.0, 1.0), (1.0, 0.0)),)]
    )
    ls_in = shapely.geometry.LineString([(0, 0), (1, 1)])
    ls_out = shapely.geometry.LineString([(9, 9), (10, 10)])

    dissemination_area_factory(session).create_batch(5, geometry=poly.wkt)
    budgets = budget_model_factory(session).create_batch(3)
    for budget in budgets:
        i = improvement_feature_model_factory(session).create(geometry=ls_in.wkt)
        budget.improvement_features = [i]
        session.add(budget)
    improvement_feature_model_factory(session).create(geometry=ls_out.wkt)
    session.commit()

    create_dummy_scores(session, ["a", "b", "c"])

    scores = session.execute(select(BudgetScore)).scalars().all()
    # 5 * 3 for "default" scores with no budget
    # plus 3 das * 3 budgets * 3 metrics
    assert len(scores) == (3 * 3 * 3) + (5 * 3)
