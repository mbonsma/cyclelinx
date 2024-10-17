from logging import getLogger
from pathlib import Path
import tarfile
import tempfile
from typing import Any, Dict, List, Optional

import geojson
from shapely import to_geojson, wkb
from sqlalchemy import inspect
from sqlalchemy.ext.declarative import DeclarativeMeta
from sqlalchemy.ext.hybrid import hybrid_property

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


def properties_to_geojson_features(
    properties: List[Dict[str, Any]]
) -> geojson.FeatureCollection:
    """
    Convert a list of models with a ``geometry`` property to a geojson FeatureCollection

        Parameters
        ----------
        properties : List of dictionaries, must have a geometry property

        Returns
        -------
        FeatureCollection


    """

    features = []

    for property in properties:

        geometry = property.pop("geometry")

        geom = wkb.loads(str(geometry))
        f = geojson.loads(to_geojson(geom))
        features.append(geojson.Feature(geometry=f, properties=property))

    fc = geojson.FeatureCollection(
        features,
        crs={
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:EPSG::4326"},
        },
    )

    return fc


def extract_files(path: str):
    """
    Extract files from a tarball into a temporary directory

        Parameters
        ----------
        path : str, the path to the archive

        Returns
        -------
        str, the path to the extracted archive

    """

    if not Path(path).exists():
        raise ValueError(f"Path {path} does not exist!")

    tempdir = tempfile.mkdtemp()

    with tarfile.open(path) as f:
        f.extractall(tempdir)

    return tempdir
