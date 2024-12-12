from collections import defaultdict
import json
import logging
import traceback

from cycle_calc.calculate_accessibility import main as calculate_accessibility
import geojson
from flask import Blueprint, Flask, Response, jsonify, request
from flask_caching import Cache
from flask_compress import Compress
from flask_cors import CORS
import logging
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from werkzeug.exceptions import HTTPException, NotFound, UnprocessableEntity
from werkzeug.wrappers.response import Response

from api.models import (
    db,
    Arterial,
    Budget,
    BudgetProjectMember,
    BudgetScore,
    DisseminationArea,
    ExistingLane,
    Intersection,
    Metric,
)
from api.settings import app_settings
from api.utils import properties_to_geojson_features, model_to_dict, DaScoreResult

logger = logging.getLogger(__name__)

cycling_api = Blueprint(
    "cycling_api",
    __name__,
)

default_cache = Cache(
    config={
        "CACHE_TYPE": "simple",
        "CACHE_DEFAULT_TIMEOUT": 60 * 60,  # 1 hour cache timeout
    },
)

compress = Compress()


def create_app(
    testing=False,
    cache: None | Cache = default_cache,
    compress: None | Compress = compress,
):
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        app_settings.POSTGRES_CONNECTION_STRING
        if not testing
        else app_settings.TEST_DB_CONNECTION_STRING
    )
    db.init_app(app)
    app.register_blueprint(cycling_api)
    CORS(app)

    if compress:
        compress.init_app(app)

    if cache:
        cache.init_app(app)

    return app


logger = logging.getLogger(__name__)


@cycling_api.route("/budgets", methods=["GET"])
def get_budgets():
    results = db.session.execute(select(Budget)).scalars().all()
    return [model_to_dict(result) for result in results]


@cycling_api.route("/arterials", methods=["GET"])
def get_arterials():
    arterials = [
        {
            "default_project_id": a.default_project_id,
            "total_length": a.total_length,
            "id": a.id,
            "budget_project_ids": [p.project_id for p in a.improvement_relationships],
            "feature_type": "arterial",
            "geometry": a.geometry,
            "GEO_ID": a.GEO_ID,
        }
        for a in db.session.execute(
            select(Arterial).options(selectinload(Arterial.improvement_relationships))
        )
        .scalars()
        .all()
    ]

    data = properties_to_geojson_features(arterials)

    return Response(geojson.dumps(data), content_type="application/json")


@cycling_api.route("/budgets/<int:id>/arterials")
def get_budget_arterials(id):

    budget = db.session.execute(select(Budget).filter(Budget.id == id)).scalar()

    if budget is None:
        raise NotFound("Budget not found!")

    results = (
        db.session.execute(
            select(BudgetProjectMember).filter(BudgetProjectMember.budget_id == id)
        )
        .scalars()
        .all()
    )

    return [model_to_dict(result) for result in results]


@cycling_api.route("/default-scores")
@default_cache.cached()
def get_default_scores():

    defaults: list[BudgetScore] = (
        db.session.execute(
            select(BudgetScore)
            .options(joinedload(BudgetScore.dissemination_area))
            .options(joinedload(BudgetScore.metric))
            .filter(BudgetScore.budget == None)
        )
        .scalars()
        .all()
    )

    default_dict = defaultdict(dict)

    for d in defaults:
        default_dict[d.dissemination_area_id][d.metric.name] = d.score
        default_dict[d.dissemination_area_id]["da"] = d.dissemination_area_id

    return default_dict


@cycling_api.route("/budgets/<int:budget_id>/scores")
@default_cache.cached()
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

    scores = DaScoreResult()

    for score in budget.scores:
        baseline_score = default_dict[score.dissemination_area_id][score.metric.name]

        scores.add_da_metric(
            da_id=score.dissemination_area_id,
            metric=score.metric.name,
            base_score=baseline_score,
            score=score.score,
        )

    return jsonify(scores.to_dict())


@cycling_api.route("/metrics")
def get_metrics():
    metrics = db.session.execute(select(Metric)).scalars().all()
    return [model_to_dict(metric) for metric in metrics]


@cycling_api.route("/existing-lanes")
@default_cache.cached(key_prefix="/existing-lanes")
def get_existing_lanes():
    lanes = [
        {
            "id": e.id,
            "total_length": e.total_length,
            "geometry": e.geometry,
            "feature_type": "existing_lane",
            "INFRA_HIGHORDER": e.INFRA_HIGHORDER,
        }
        for e in db.session.execute(select(ExistingLane)).scalars().all()
    ]
    data = properties_to_geojson_features(lanes)
    # dumping is much faster than jsonify
    res = Response(geojson.dumps(data), content_type="application/json")
    return res


@cycling_api.route("/das")
@default_cache.cached(key_prefix="/das")
def get_das():
    das = [
        {"id": d.id, "DAUID": d.DAUID, "geometry": d.geometry}
        for d in db.session.execute(select(DisseminationArea)).scalars().all()
    ]
    data = properties_to_geojson_features(das)
    res = Response(geojson.dumps(data), content_type="application/json")
    return res


@cycling_api.route("/intersections")
@default_cache.cached(key_prefix="/intersections")
def get_intersections():
    intersections = [
        {"id": i.id, "INTERSECTION_ID": i.INTERSECTION_ID, "geometry": i.geometry}
        for i in db.session.execute(select(Intersection)).scalars().all()
    ]
    data = properties_to_geojson_features(intersections)
    res = Response(geojson.dumps(data), content_type="application/json")
    return res


@cycling_api.route("/accessibility")
def get_accessibility():
    project_ids = request.args.get("project_ids")
    if project_ids is None:
        raise UnprocessableEntity("project_ids are required!")
    try:
        project_ids_list = [int(id) for id in project_ids.split(",")]
    except Exception as e:
        logger.error(e)
        raise UnprocessableEntity(
            "Project ids should be a comma-separate list of integers!"
        )

    da_map = {
        da.origin_id: da.id
        for da in db.session.execute(select(DisseminationArea)).scalars().all()
    }

    defaults = (
        db.session.execute(
            select(BudgetScore)
            .options(joinedload(BudgetScore.metric))
            .options(joinedload(BudgetScore.dissemination_area))
            .filter(BudgetScore.budget_id == None)
        )
        .scalars()
        .all()
    )

    default_map = {}

    for default in defaults:
        if not default_map.get(default.dissemination_area.id):
            default_map[default.dissemination_area.id] = {}
        default_map[default.dissemination_area.id][default.metric.name] = default.score

    results = calculate_accessibility(project_ids_list, ["job", "populations"])

    score_dict = DaScoreResult()

    for metric, scores in results.items():
        for origin_id, score in scores.items():
            if da_map.get(origin_id):
                da_id = da_map[origin_id]
                score_dict.add_da_metric(
                    da_id=da_id,
                    metric=metric,
                    score=float(score),
                    base_score=default_map[da_id][metric],
                )

    return jsonify(score_dict.to_dict())


# https://flask.palletsprojects.com/en/2.2.x/errorhandling/#generic-exception-handlers
@cycling_api.errorhandler(HTTPException)
def handle_http_exception(e: HTTPException):
    """Return JSON instead of HTML for HTTP errors."""
    # create a werkzeug response
    response = Response()
    logger.error(traceback.print_exception(e))
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
    logger.error(traceback.print_exception(e))
    if isinstance(e, HTTPException):
        return e
    return {
        "code": 500,
        "description": (
            e.args if app_settings.APP_ENV == "local" else "something went wrong"
        ),
    }, 500
