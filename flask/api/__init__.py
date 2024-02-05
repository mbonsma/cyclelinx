import logging

from api.settings import app_settings

LOG_LEVEL = logging.DEBUG if app_settings.APP_ENV == "local" else logging.INFO

# Initialize logger.
console_handler = logging.StreamHandler()
console_handler.setLevel(LOG_LEVEL)

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s: %(message)s",
    handlers=[console_handler],
)

#    Initialize debugger.
#    Note that hot reloading creates a new server process and will detach debugger if active.
#    Loading the app a second time while the server is running (e.g., alembic)
#    will call this line again and raise address conflict, which we swallow

if app_settings.FLASK_APP_DEBUG:
    import debugpy

    try:
        debugpy.listen(("0.0.0.0", 5678))
    except RuntimeError:
        pass
