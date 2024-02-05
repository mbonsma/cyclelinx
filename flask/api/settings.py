from os import getenv
from dataclasses import dataclass
from sqlalchemy.engine.url import URL


@dataclass
class _AppSettings:
    APP_ENV = getenv("APP_ENV")
    FLASK_APP_DEBUG = True if getenv("FLASK_APP_DEBUG") == "true" else False
    POSTGRES_CONNECTION_STRING = URL.create(
        drivername="postgresql",
        username=getenv("POSTGRES_USER"),
        host=getenv("POSTGRES_HOST"),
        database=getenv("POSTGRES_DB"),
        password=getenv("POSTGRES_PASSWORD"),
    )
    TEST_DB_CONNECTION_STRING = URL.create(
        drivername="postgresql",
        username=getenv("POSTGRES_USER"),
        host=getenv("POSTGRES_HOST"),
        password=getenv("POSTGRES_PASSWORD"),
        database=getenv("TEST_DB_NAME"),
    )
    TEST_DB_NAME = getenv("TEST_DB_NAME")


app_settings = _AppSettings()
