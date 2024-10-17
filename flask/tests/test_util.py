import geopandas
from sqlalchemy import select


from api.models import Arterial
from api.utils import model_to_dict, properties_to_geojson_features
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
