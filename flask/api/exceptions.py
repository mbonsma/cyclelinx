import json

from werkzeug.exceptions import HTTPException


"""
    Override werkzeug base exception class to jsonify exception messages so that
    the client can interpret them in a uniform way.
"""


class GraphQLHttpException(HTTPException):
    def __str__(self) -> str:
        code = self.code if self.code is not None else "???"
        return json.dumps({"code": code, "description": self.description})

    def __repr__(self) -> str:
        code = self.code if self.code is not None else "???"
        return json.dumps({"code": code, "descriptdion": self.description})

class NotFound(GraphQLHttpException):
    """*404* `Not Found`

    Raise if a resource does not exist and never existed.
    """

    code = 404
    description = (
        "The requested URL was not found on the server. If you entered"
        " the URL manually please check your spelling and try again."
    )

class UnprocessableEntity(GraphQLHttpException):
    """*422* `Unprocessable Entity`

    Used if the request is well formed, but the instructions are otherwise
    incorrect.
    """

    code = 422
    description = (
        "The request was well-formed but was unable to be followed due"
        " to semantic errors."
    )
