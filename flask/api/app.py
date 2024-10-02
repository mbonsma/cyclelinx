import json
import logging
from collections import defaultdict

from flask import Blueprint, Flask
from flask_cors import CORS
import logging
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from werkzeug.exceptions import HTTPException
from werkzeug.wrappers.response import Response


from api.models import db, Budget, BudgetScore, ExistingLane, Metric
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


@cycling_api.route("/budgets/<int:budget_id>/scores")
def get_project_scores(budget_id):
    budget: Budget = db.session.execute(
        select(Budget)
        .options(joinedload(Budget.scores).subqueryload(BudgetScore.dissemination_area))
        .filter(Budget.id == budget_id)
    ).scalar()

    defaults: list[BudgetScore] = (
        db.session.execute(
            select(BudgetScore)
            .options(joinedload(BudgetScore.dissemination_area))
            .options(joinedload(BudgetScore.metric))
            .filter(BudgetScore.budget == None)
            .filter(
                BudgetScore.dissemination_area_id.in_(
                    [s.dissemination_area_id for s in budget.scores]
                )
            )
        )
        .scalars()
        .all()
    )

    default_dict = defaultdict(dict)

    for d in defaults:
        default_dict[d.dissemination_area_id][d.metric.name] = d.score

    constructor = lambda: {
        "da": None,
        "scores": {"budget": {}, "default": {}, "diff": {}, "bin": {}},
    }

    score_dict = defaultdict(constructor)

    for score in budget.scores:
        score_dict[score.dissemination_area_id]["da"] = (
            db_data_to_geojson_features([score.dissemination_area])
            if not score_dict[score.dissemination_area_id]["da"]
            else score_dict[score.dissemination_area_id]["da"]
        )
        score_dict[score.dissemination_area_id]["scores"]["budget"][
            score.metric.name
        ] = score.score
        score_dict[score.dissemination_area_id]["scores"]["default"][
            score.metric.name
        ] = default_dict[score.dissemination_area_id][score.metric.name]
        score_dict[score.dissemination_area_id]["scores"]["diff"][score.metric.name] = (
            score.score - default_dict[score.dissemination_area_id][score.metric.name]
        )
        score_dict[score.dissemination_area_id]["scores"]["bin"][score.metric.name] = (
            0 if score.score == 0 else 1
        )

    return list(score_dict.values())


@cycling_api.route("/metrics")
def get_metrics():
    metrics = db.session.execute(select(Metric)).scalars().all()
    return [model_to_dict(metric) for metric in metrics]


@cycling_api.route("/existing-lanes")
def get_existing_laness():
    lanes = db.session.execute(select(ExistingLane)).scalars().all()
    return db_data_to_geojson_features(lanes)


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
    return {
        "code": 500,
        "description": (
            e.args if app_settings.APP_ENV == "local" else "something went wrong"
        ),
    }, 500
