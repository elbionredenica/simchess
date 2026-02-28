import logging

from flask import request
from flask_socketio import emit, join_room

logger = logging.getLogger(__name__)


def register_sockets(socketio, games):
    @socketio.on('join')
    def on_join(data):
        game_id = data['game_id']
        if game_id not in games:
            emit('error', {'message': 'Game not found'})
            return

        player_id = request.sid
        color = games[game_id].assign_player(player_id)

        if color:
            join_room(game_id)
            emit('joined', {
                'color': color,
                'game_state': games[game_id].get_state()
            })
            emit('player_joined', {
                'color': color,
                'game_state': games[game_id].get_state()
            }, room=game_id, include_self=False)
        else:
            emit('error', {'message': 'Game is full'})

    @socketio.on('submit_move')
    def on_submit_move(data):
        game_id = data['game_id']
        color = data['color']
        move = data['move']
        client_clocks = data.get('clock_seconds')

        logger.debug(f"Received move: {color}={move} for game {game_id}")

        if game_id not in games:
            emit('error', {'message': 'Game not found'})
            return

        game = games[game_id]

        if client_clocks:
            if client_clocks.get('white') is not None:
                game.clock_seconds['white'] = client_clocks['white']
            if client_clocks.get('black') is not None:
                game.clock_seconds['black'] = client_clocks['black']

        result = game.submit_move(color, move)

        emit('move_submitted', {
            'color': color,
            'game_state': game.get_state()
        }, room=game_id)

        if result:
            emit('moves_processed', {
                'result': result,
                'game_state': game.get_state()
            }, room=game_id)

    @socketio.on('start_clocks')
    def on_start_clocks(data):
        game_id = data['game_id']
        if game_id in games:
            emit('clocks_started', {}, room=game_id)

    @socketio.on('time_out')
    def on_time_out(data):
        game_id = data['game_id']
        color = data['color']

        if game_id not in games:
            return

        game = games[game_id]
        winner = 'black' if color == 'white' else 'white'
        game.game_over = True
        game.winner = winner
        game.win_reason = 'timeout'

        emit('game_state_update', {
            'game_state': game.get_state()
        }, room=game_id)
