from json import loads
from logging import getLogger
from pathlib import Path
import tarfile
import tempfile
from typing import Any, Dict, List, Optional

from geoalchemy2.shape import to_shape
from shapely import to_geojson
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


def db_data_to_geojson_features(
    data: List[Any], extra_properties: Optional[List[dict[str, Any]]] = None
):
    """
    Convert a model with a ``geometry`` property to geojson

        Parameters
        ----------
        data : Model, the SQLAlchemy model
        extra_properties : any properties not on the model that should be added to the geojson ``properties``

        Returns
        -------
        dict, the geojson in dictionary format

    """

    if extra_properties is not None and len(extra_properties) != len(data):
        raise ValueError("Extra properties must be the same length as data!")

    fc = {
        "type": "FeatureCollection",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"},
        },
        "features": [],
    }

    for i, feature in enumerate(data):
        properties = model_to_dict(feature)
        geometry = to_shape(properties.pop("geometry"))
        geojson = loads(to_geojson(geometry))
        geojson["properties"] = properties
        if extra_properties is not None:
            geojson["properties"] = {**geojson["properties"], **extra_properties[i]}
        fc["features"].append(geojson)

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
