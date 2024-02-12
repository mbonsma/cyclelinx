import json
import logging

from flask import Blueprint, Flask
from flask_cors import CORS
import logging
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from werkzeug.exceptions import HTTPException
from werkzeug.wrappers.response import Response


from api.models import db, Budget, FeatureScore, ImprovementFeature
from api.settings import app_settings
from api.utils import db_data_to_geojson_features, model_to_dict

logger = logging.getLogger(__name__)

cycling_api = Blueprint(
    "cycling_api",
    __name__,
)


def create_app(testing=False):
    app = Flask(__name__)
    # app.config.from_pyfile(config_filename)
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        app_settings.POSTGRES_CONNECTION_STRING
        if not testing
        else app_settings.TEST_DB_CONNECTION_STRING
    )
    db.init_app(app)
    app.register_blueprint(cycling_api)
    CORS(app)
    return app


logger = logging.getLogger(__name__)


@cycling_api.route("/budgets", methods=["GET"])
def get_budgets():
    results = db.session.execute(select(Budget)).scalars().all()
    return [model_to_dict(result) for result in results]


@cycling_api.route("/budgets/<int:id>/features")
def get_budget_features(id):
    budget = db.session.execute(
        select(Budget)
        .options(joinedload(Budget.improvement_features))
        .filter(Budget.id == id)
    ).scalar()

    return db_data_to_geojson_features(budget.improvement_features)


@cycling_api.route("/improvement_features/<int:id>/scores")
def get_improvement_feature_scores(id):
    feature = db.session.execute(
        select(ImprovementFeature)
        .options(
            joinedload(ImprovementFeature.scores).subqueryload(
                FeatureScore.dissemination_area
            )
        )
        .filter(ImprovementFeature.id == id)
    ).scalar()

    das = [score.dissemination_area for score in feature.scores]

    return db_data_to_geojson_features(das)


# https://flask.palletsprojects.com/en/2.2.x/errorhandling/#generic-exception-handlers
@cycling_api.errorhandler(HTTPException)
def handle_http_exception(e: HTTPException):
    """Return JSON instead of HTML for HTTP errors."""
    # create a werkzeug response
    response = Response()
    response.data = json.dumps(
        {
            "code": e.code,
            "name": e.name,
            "description": e.description,
        }
    )
    response.content_type = "application/json"
    return response


@cycling_api.errorhandler(Exception)
def handle_exception(e: Exception):
    # pass through HTTP errors
    if isinstance(e, HTTPException):
        return e

    logger.error(e.args)

    return {
        "code": 500,
        "description": (
            e.args if app_settings.APP_ENV == "local" else "something went wrong"
        ),
    }, 500
