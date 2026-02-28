import logging
import os

# eventlet monkey-patch must happen before any other network imports
try:
    import eventlet
    eventlet.monkey_patch()
    _async_mode = 'eventlet'
except ImportError:
    _async_mode = 'threading'

from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Extension objects created without app so create_app() can be called multiple
# times (e.g. tests) and by gunicorn via "app:create_app()".
socketio = SocketIO()

# In-memory game store (module-level so it survives across requests in the same
# worker process — fine for a single-worker eventlet deployment).
games = {}


def create_app():
    app = Flask(__name__, static_folder='static')
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'simchess-secret!')

    CORS(app)
    socketio.init_app(app, cors_allowed_origins='*', async_mode=_async_mode)

    from routes import register_routes
    from sockets import register_sockets
    register_routes(app, games, socketio)
    register_sockets(socketio, games)

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 10000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)
