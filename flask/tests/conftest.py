import logging
import pytest

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy_utils import create_database, database_exists

from api.settings import app_settings


logger = logging.getLogger(__name__)


@pytest.fixture(scope="session")
def connection():
    """
    Create the database if it doesn't exist and connect.
    """
    url = app_settings.TEST_DB_CONNECTION_STRING

    NEEDS_GIS = False

    if not database_exists(url):
        create_database(url)
        NEEDS_GIS = True

    engine = create_engine(url)

    if NEEDS_GIS:
        connection = engine.connect()
        session = scoped_session(
            sessionmaker(autocommit=False, autoflush=False, bind=connection)
        )

        session.execute(text("CREATE EXTENSION postgis;"))
        session.commit()
        connection.close()

    return engine.connect()


@pytest.fixture
def app():
    from api.app import create_app

    app = create_app(testing=True)
    app.config.update({"TESTING": True})

    yield app


@pytest.fixture
def app_ctx(app):
    """Use only when access to the connection (db) is needed outside of request context"""
    with app.app_context():
        yield


@pytest.fixture(scope="function")
def fresh_db(connection, app_ctx, app):
    from api.models import db

    """
    Recreate tables at the start of every test.
    """

    db.drop_all()
    db.create_all()

    yield db


@pytest.fixture()
def client(app):
    return app.test_client()
