from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
import chess
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = 'simchess-secret!'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store games in memory (for MVP)
games = {}

class SimChessGame:
    def __init__(self, game_id):
        self.game_id = game_id
        self.board = chess.Board()
        self.moves = {"white": None, "black": None}
        self.players = {"white": None, "black": None}
        self.ready_status = {"white": False, "black": False}
        self.turn_number = 1
        self.illegal_attempt = 0  # Track illegal move attempts within a turn
        self.game_over = False
        self.winner = None
        self.draw_reason = None
        # Deprecated: aggregate illegal moves (was used for draw on >=3). Kept for compatibility.
        self.illegal_move_counts = {"white": 0, "black": 0}
        # New counters per updated rules
        self.mutual_illegal_count = 0
        self.one_sided_illegal_counts = {"white": 0, "black": 0}
        self.one_sided_threshold = 3
        self.one_sided_penalty_seconds = 30
        # Simulated clocks (seconds remaining)
        self.clock_seconds = {"white": 600, "black": 600}
        self.last_illegal_moves = {"white": None, "black": None}
    
    def assign_player(self, player_id):
        if self.players["white"] is None:
            self.players["white"] = player_id
            return "white"
        elif self.players["black"] is None:
            self.players["black"] = player_id
            return "black"
        return None
    
    def submit_move(self, color, move_uci):
        self.moves[color] = move_uci
        self.ready_status[color] = True
        
        # Check if both players have submitted moves
        if self.ready_status["white"] and self.ready_status["black"]:
            return self.process_moves()
        return None
    
    def process_moves(self):
        logger.debug(f"Processing moves: white={self.moves['white']}, black={self.moves['black']}")
        
        # Initialize result structure with all moves valid by default
        result = {
            "valid_moves": {"white": True, "black": True},
            "processed": True,
            "illegal_reason": {"white": None, "black": None},
            "turn_complete": False
        }
        
        # Get the movesg
        white_move_str = self.moves["white"]
        black_move_str = self.moves["black"]
        
        # Early return if moves aren't provided
        if not white_move_str or not black_move_str:
            logger.debug("One or both moves not provided")
            if not white_move_str:
                result["valid_moves"]["white"] = False
            if not black_move_str:
                result["valid_moves"]["black"] = False
            return result
            
        try:
            # Parse moves
            white_move = chess.Move.from_uci(white_move_str)
            black_move = chess.Move.from_uci(black_move_str)
            
            logger.debug(f"Parsed moves: white={white_move}, black={black_move}")
            
            # Create boards for move validation
            white_board = chess.Board(self.board.fen())
            black_board = chess.Board(self.board.fen())
            
            # Always allow white to move first on their board copy
            if white_board.turn != chess.WHITE:
                white_fen = list(white_board.fen().split())
                white_fen[1] = 'w'
                white_board = chess.Board(' '.join(white_fen))
            
            # Always allow black to move first on their board copy
            if black_board.turn != chess.BLACK:
                black_fen = list(black_board.fen().split())
                black_fen[1] = 'b'
                black_board = chess.Board(' '.join(black_fen))
            
            # RULE 1: Check if moves are to the same target square (mutual illegality)
            if white_move.to_square == black_move.to_square:
                logger.debug(f"CONFLICT: Both players moving to same square {chess.square_name(white_move.to_square)}")
                result["valid_moves"]["white"] = False
                result["valid_moves"]["black"] = False
                reason = f"Conflict: both moving to {chess.square_name(white_move.to_square)}"
                result["illegal_reason"]["white"] = reason
                result["illegal_reason"]["black"] = reason
                # Count as mutual illegality only
                self.mutual_illegal_count += 1
                self.last_illegal_moves["white"] = white_move_str
                self.last_illegal_moves["black"] = black_move_str
                self.illegal_attempt += 1
                result["illegal_attempt"] = self.illegal_attempt
                result["illegality_type"] = "mutual"
                # Clear submissions so both must resubmit; include current FEN
                self.moves = {"white": None, "black": None}
                self.ready_status = {"white": False, "black": False}
                result["fen"] = self.board.fen()
                return result
                
            # RULE 2: Check for reciprocal captures (mutual illegality)
            if (white_move.to_square == black_move.from_square and 
                black_move.to_square == white_move.from_square):
                logger.debug("CONFLICT: Reciprocal captures")
                result["valid_moves"]["white"] = False
                result["valid_moves"]["black"] = False
                reason = "Conflict: reciprocal captures"
                result["illegal_reason"]["white"] = reason
                result["illegal_reason"]["black"] = reason
                # Count as mutual illegality only
                self.mutual_illegal_count += 1
                self.last_illegal_moves["white"] = white_move_str
                self.last_illegal_moves["black"] = black_move_str
                self.illegal_attempt += 1
                result["illegal_attempt"] = self.illegal_attempt
                result["illegality_type"] = "mutual"
                # Clear submissions so both must resubmit; include current FEN
                self.moves = {"white": None, "black": None}
                self.ready_status = {"white": False, "black": False}
                result["fen"] = self.board.fen()
                return result
                
            # RULE 3: Check if white move is valid
            if white_move not in white_board.legal_moves:
                logger.debug(f"White move {white_move} is not legal")
                result["valid_moves"]["white"] = False
                result["illegal_reason"]["white"] = "Not a legal chess move"
                # Do not count yet; classification happens below
                self.last_illegal_moves["white"] = white_move_str
            
            # RULE 4: Check if black move is valid
            if black_move not in black_board.legal_moves:
                logger.debug(f"Black move {black_move} is not legal")
                result["valid_moves"]["black"] = False
                result["illegal_reason"]["black"] = "Not a legal chess move"
                # Do not count yet; classification happens below
                self.last_illegal_moves["black"] = black_move_str
            
            # If any move was illegal, classify as mutual or one-sided and apply penalties if needed
            if not result["valid_moves"]["white"] or not result["valid_moves"]["black"]:
                self.illegal_attempt += 1
                result["illegal_attempt"] = self.illegal_attempt
                white_illegal = not result["valid_moves"]["white"]
                black_illegal = not result["valid_moves"]["black"]
                if white_illegal and black_illegal:
                    # Both are illegal: mutual illegality
                    self.mutual_illegal_count += 1
                    result["illegality_type"] = "mutual"
                else:
                    # Exactly one side is illegal
                    offender = "white" if white_illegal else "black"
                    self.one_sided_illegal_counts[offender] += 1
                    result["illegality_type"] = "one_sided"
                    # Optional: keep deprecated aggregate in sync with one-sided only
                    self.illegal_move_counts[offender] = self.one_sided_illegal_counts[offender]
                    # Apply penalty if threshold reached
                    if self.one_sided_illegal_counts[offender] >= self.one_sided_threshold:
                        self.clock_seconds[offender] = max(0, self.clock_seconds[offender] - self.one_sided_penalty_seconds)
                        self.one_sided_illegal_counts[offender] = 0
                        result["penalty_applied"] = {
                            "color": offender,
                            "seconds": self.one_sided_penalty_seconds
                        }
                # Clear submissions so both must resubmit; include current FEN
                self.moves = {"white": None, "black": None}
                self.ready_status = {"white": False, "black": False}
                result["fen"] = self.board.fen()
                return result
            
            # If we get here, both moves are valid, so apply them
            logger.debug("Both moves valid, applying to board")
            
            # Create a new board from the current position to apply moves
            new_board = chess.Board(self.board.fen())
            
            # Apply white's move (set turn if needed)
            if new_board.turn != chess.WHITE:
                white_fen = list(new_board.fen().split())
                white_fen[1] = 'w'
                new_board = chess.Board(' '.join(white_fen))
            
            # Push white's move
            new_board.push(white_move)
            
            # Apply black's move (set turn if needed)
            if new_board.turn != chess.BLACK:
                black_fen = list(new_board.fen().split())
                black_fen[1] = 'b'
                new_board = chess.Board(' '.join(black_fen))
            
            # Push black's move
            new_board.push(black_move)
            
            # Update game board with new position
            self.board = new_board
            
            # Reset illegal attempt counter and increment turn number
            self.illegal_attempt = 0
            self.turn_number += 1
            result["turn_complete"] = True
            
            # Check for checkmate
            if self.board.is_checkmate():
                self.game_over = True
                winner = "white" if self.board.turn == chess.BLACK else "black"
                self.winner = winner
                result["checkmate"] = True
                result["winner"] = winner
            
            # Check for stalemate
            if self.board.is_stalemate():
                self.game_over = True
                self.draw_reason = "stalemate"
                result["draw"] = True
                result["draw_reason"] = "stalemate"
            
            # Check for insufficient material
            if self.board.is_insufficient_material():
                self.game_over = True
                self.draw_reason = "insufficient material"
                result["draw"] = True
                result["draw_reason"] = "insufficient material"
                
        except Exception as e:
            # Log any exceptions
            logger.error(f"Error processing moves: {str(e)}")
            result["valid_moves"]["white"] = False
            result["valid_moves"]["black"] = False
            reason = f"Server error: {str(e)}"
            result["illegal_reason"]["white"] = reason
            result["illegal_reason"]["black"] = reason
        
        # No automatic draw on illegalities under new rules
        
        # Reset for next turn
        self.moves = {"white": None, "black": None}
        self.ready_status = {"white": False, "black": False}
        
        # Add FEN to result
        result["fen"] = self.board.fen()
        
        logger.debug(f"Move processing result: {result}")
        return result
    
    def get_state(self):
        return {
            "game_id": self.game_id,
            "fen": self.board.fen(),
            "turn_number": self.turn_number,
            "illegal_attempt": self.illegal_attempt,
            "white_ready": self.ready_status["white"],
            "black_ready": self.ready_status["black"],
            "game_over": self.game_over,
            "winner": self.winner,
            "draw_reason": self.draw_reason,
            "illegal_move_counts": self.illegal_move_counts,
            "last_illegal_moves": self.last_illegal_moves,
            # New state fields
            "mutual_illegal_count": self.mutual_illegal_count,
            "one_sided_illegal_counts": self.one_sided_illegal_counts,
            "one_sided_threshold": self.one_sided_threshold,
            "penalty_seconds": self.one_sided_penalty_seconds,
            "clock_seconds": self.clock_seconds
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/create_game', methods=['POST'])
def create_game():
    game_id = str(uuid.uuid4())
    games[game_id] = SimChessGame(game_id)
    return jsonify({"game_id": game_id})

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
        # Notify other player
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
    
    logger.debug(f"Received move: {color}={move} for game {game_id}")
    
    if game_id not in games:
        emit('error', {'message': 'Game not found'})
        return
    
    game = games[game_id]
    result = game.submit_move(color, move)
    
    # Update both players about the move submission
    emit('move_submitted', {
        'color': color,
        'game_state': game.get_state()
    }, room=game_id)
    
    # If both players have submitted, process the moves
    if result:
        emit('moves_processed', {
            'result': result,
            'game_state': game.get_state()
        }, room=game_id)

if __name__ == '__main__':
    socketio.run(app, debug=True)
