import json
import traceback

from flask import Flask
from flask_cors import CORS
from graphql_server import format_error_default, GraphQLError
import logging
from werkzeug.exceptions import HTTPException
from werkzeug.wrappers.response import Response
from sqlalchemy import select

from api.db import db
from api.models import Budget
from api.settings import app_settings


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = (
    app_settings.POSTGRES_CONNECTION_STRING
    if app_settings.APP_ENV != "testing"
    else app_settings.TEST_DB_CONNECTION_STRING
)
db.init_app(app)
CORS(app)

logger = logging.getLogger(__name__)


@app.route("/budgets", methods=["GET"])
def get_budgets():
    return db.session(select(Budget).scalars().all())


@app.route("/budgets/<int:id>/features")
def get_budget_features():
    return ""


def format_error(error: GraphQLError):
    """Try to get a trace from exception that gql swallows"""
    if error.original_error:
        logger.error(traceback.print_exception(error.original_error))
    return format_error_default(error)


# https://flask.palletsprojects.com/en/2.2.x/errorhandling/#generic-exception-handlers
@app.errorhandler(HTTPException)
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


@app.errorhandler(Exception)
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
