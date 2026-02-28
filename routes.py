import uuid
import logging

from flask import request, jsonify, render_template
from engine.game import SimChessGame

logger = logging.getLogger(__name__)


def register_routes(app, games, socketio):
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/join/<game_id>')
    def join_game(game_id):
        # Render the same page; JS on the client will detect the path and auto-join
        return render_template('index.html')

    @app.route('/api/create_game', methods=['POST'])
    def create_game():
        game_id = str(uuid.uuid4())
        games[game_id] = SimChessGame(game_id)
        return jsonify({"game_id": game_id})

    @app.route('/api/resign_game', methods=['POST'])
    def resign_game():
        data = request.json
        game_id = data.get('game_id')
        player_color = data.get('player_color')

        if not game_id or not player_color:
            return jsonify({"success": False, "message": "Missing game_id or player_color"}), 400

        game = games.get(game_id)
        if not game:
            return jsonify({"success": False, "message": "Game not found"}), 404

        if game.game_over:
            return jsonify({"success": False, "message": "Game is already over"}), 400

        opponent = "black" if player_color == "white" else "white"
        game.game_over = True
        game.winner = opponent
        game.win_reason = "resignation"

        logger.info(f"Game {game_id} ended by resignation. Winner: {opponent}")

        socketio.emit('game_state_update', {'game_state': game.get_state()}, room=game_id)

        return jsonify({"success": True, "message": "Resignation accepted"})
