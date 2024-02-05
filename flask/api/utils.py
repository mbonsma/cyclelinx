from logging import getLogger
from typing import Any, Dict, List

from geoalchemy2.shape import to_shape
from sqlalchemy import inspect
from sqlalchemy.ext.declarative import DeclarativeMeta
from sqlalchemy.ext.hybrid import hybrid_property


import api.models as Models


logger = getLogger(__name__)


def input_to_dictionary(input: Any):
    """Convert Graphene inputs into dictionary."""
    dictionary = {}
    for key in input:
        dictionary[key] = input[key]
    return dictionary


def update_model(Model: DeclarativeMeta, input: Dict[str, Any]):
    for key, value in input.items():
        setattr(Model, key, value)


def model_to_dict(Model: DeclarativeMeta):
    dict = {}
    for key in Model.__mapper__.c.keys():
        if not key.startswith("_"):
            dict[key] = getattr(Model, key)

    for key, prop in inspect(Model.__class__).all_orm_descriptors.items():
        if isinstance(prop, hybrid_property):
            dict[key] = getattr(Model, key)
    return dict


# TODO: this should just be an object with an .add_feature method
# can refactor once it's working
def improvement_features_to_geojson_features(
    improvement_features: List[Models.ImprovementFeature],
):
    fc = {
        "type": "FeatureCollection",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"},
        },
        "features": [],
    }

    for feature in improvement_features:
        properties = model_to_dict(feature)
        geometry = to_shape(properties.pop("geometry"))
        x, y = geometry.xy
        geometry = {
            "type": "LineString",
            "coordinates": [[x, y] for x, y in zip(list(x), list(y))],
        }
        fc["features"].append(
            {"type": "Feature", "properties": properties, "geometry": geometry}
        )

    return fc
