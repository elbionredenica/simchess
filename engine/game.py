import chess
import logging

from engine.board import SimChessBoard

logger = logging.getLogger(__name__)


class SimChessGame:
    def __init__(self, game_id):
        self.game_id = game_id
        self.board = SimChessBoard()
        self.moves = {"white": None, "black": None}
        self.players = {"white": None, "black": None}
        self.ready_status = {"white": False, "black": False}
        self.turn_number = 1
        self.illegal_attempt = 0  # Track illegal move attempts within a turn
        self.game_over = False
        self.winner = None
        self.win_reason = None  # Added for resignation/timeout tracking
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
        # Position history for threefold repetition (only legal positions)
        self.position_history = [self._get_position_key()]

    def _handle_mutual_illegality(self, result, white_move_str, black_move_str, reason):
        """Handle mutual illegality: increment counter, check for draw, prepare result."""
        self.mutual_illegal_count += 1
        self.last_illegal_moves["white"] = white_move_str
        self.last_illegal_moves["black"] = black_move_str
        self.illegal_attempt += 1

        result["valid_moves"]["white"] = False
        result["valid_moves"]["black"] = False
        result["illegal_reason"]["white"] = reason
        result["illegal_reason"]["black"] = reason
        result["illegal_attempt"] = self.illegal_attempt
        result["illegality_type"] = "mutual"
        result["mutual_illegal_count"] = self.mutual_illegal_count

        # Check for draw on 3 mutual illegalities within the same turn
        if self.mutual_illegal_count >= 3:
            self.game_over = True
            self.draw_reason = "3 mutual illegalities"
            result["draw"] = True
            result["draw_reason"] = "3 mutual illegalities"
            result["game_over"] = True

        # Clear submissions so both must resubmit
        self.moves = {"white": None, "black": None}
        self.ready_status = {"white": False, "black": False}
        result["fen"] = self.board.fen()
        result["clock_seconds"] = self.clock_seconds
        return result

    def assign_player(self, player_id):
        if self.players["white"] is None:
            self.players["white"] = player_id
            return "white"
        elif self.players["black"] is None:
            self.players["black"] = player_id
            return "black"
        return None

    def _get_position_key(self):
        """Get a position key for threefold repetition comparison (pieces only)."""
        # Use just the piece placement part of FEN (first field)
        return self.board.fen().split()[0]

    def _get_sliding_path(self, from_sq, to_sq, piece_type):
        """Get intermediate squares for sliding pieces (Bishop, Rook, Queen).
        Returns empty list for non-sliding pieces or if not a sliding move."""
        if piece_type not in [chess.BISHOP, chess.ROOK, chess.QUEEN]:
            return []

        from_file, from_rank = chess.square_file(from_sq), chess.square_rank(from_sq)
        to_file, to_rank = chess.square_file(to_sq), chess.square_rank(to_sq)

        file_diff = to_file - from_file
        rank_diff = to_rank - from_rank

        # Determine direction
        file_step = 0 if file_diff == 0 else (1 if file_diff > 0 else -1)
        rank_step = 0 if rank_diff == 0 else (1 if rank_diff > 0 else -1)

        # Validate it's a valid sliding move
        is_diagonal = abs(file_diff) == abs(rank_diff) and file_diff != 0
        is_straight = (file_diff == 0 and rank_diff != 0) or (rank_diff == 0 and file_diff != 0)

        if piece_type == chess.BISHOP and not is_diagonal:
            return []
        if piece_type == chess.ROOK and not is_straight:
            return []
        if piece_type == chess.QUEEN and not (is_diagonal or is_straight):
            return []

        # Collect intermediate squares (not including from_sq or to_sq)
        path = []
        current_file, current_rank = from_file + file_step, from_rank + rank_step
        while (current_file, current_rank) != (to_file, to_rank):
            path.append(chess.square(current_file, current_rank))
            current_file += file_step
            current_rank += rank_step

        return path

    def submit_move(self, color, move_uci):
        self.moves[color] = move_uci
        self.ready_status[color] = True

        # Check if both players have submitted moves
        if self.ready_status["white"] and self.ready_status["black"]:
            return self.process_moves()
        return None

    def check_immediate_checkmate(self):
        """Check if either player has no legal moves (checkmate in SimChess context).
        Returns a result dict if game should end, None otherwise."""
        # Check White's legal moves (need to set turn to White)
        white_board = SimChessBoard(self.board.fen())
        if white_board.turn != chess.WHITE:
            white_fen = list(white_board.fen().split())
            white_fen[1] = 'w'
            white_board = SimChessBoard(' '.join(white_fen))
        white_has_moves = any(True for _ in white_board.legal_moves)

        # Check Black's legal moves (need to set turn to Black)
        black_board = SimChessBoard(self.board.fen())
        if black_board.turn != chess.BLACK:
            black_fen = list(black_board.fen().split())
            black_fen[1] = 'b'
            black_board = SimChessBoard(' '.join(black_fen))
        black_has_moves = any(True for _ in black_board.legal_moves)

        if not white_has_moves and not black_has_moves:
            # Both sides have no moves - draw (very rare)
            self.game_over = True
            self.draw_reason = "mutual immobility"
            return {
                "game_over": True,
                "draw": True,
                "draw_reason": "mutual immobility",
                "fen": self.board.fen()
            }
        elif not white_has_moves:
            # White has no legal moves - Black wins
            self.game_over = True
            self.winner = "black"
            return {
                "game_over": True,
                "checkmate": True,
                "winner": "black",
                "fen": self.board.fen()
            }
        elif not black_has_moves:
            # Black has no legal moves - White wins
            self.game_over = True
            self.winner = "white"
            return {
                "game_over": True,
                "checkmate": True,
                "winner": "white",
                "fen": self.board.fen()
            }

        return None  # Game continues

    def process_moves(self):
        logger.debug(f"Processing moves: white={self.moves['white']}, black={self.moves['black']}")

        # Check for immediate checkmate before processing moves
        checkmate_result = self.check_immediate_checkmate()
        if checkmate_result:
            logger.debug(f"Immediate checkmate detected: {checkmate_result}")
            return checkmate_result

        # Initialize result structure with all moves valid by default
        result = {
            "valid_moves": {"white": True, "black": True},
            "processed": True,
            "illegal_reason": {"white": None, "black": None},
            "turn_complete": False
        }

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

            # Capture intended moves (SAN if possible)
            try:
                white_san_intended = self.board.san(white_move)
            except Exception:
                white_san_intended = white_move_str

            try:
                black_san_intended = self.board.san(black_move)
            except Exception:
                black_san_intended = black_move_str

            result["intended_moves"] = {
                "white": white_san_intended,
                "black": black_san_intended
            }

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
                reason = f"Conflict: both moving to {chess.square_name(white_move.to_square)}"
                return self._handle_mutual_illegality(result, white_move_str, black_move_str, reason)

            # RULE 2: Check for reciprocal captures (mutual illegality)
            if (white_move.to_square == black_move.from_square and
                    black_move.to_square == white_move.from_square):
                logger.debug("CONFLICT: Reciprocal captures")
                reason = "Conflict: reciprocal captures"
                return self._handle_mutual_illegality(result, white_move_str, black_move_str, reason)

            # RULE 2.5: Check if capture target moves away (capture target escaped)
            # LOGIC UPDATE: Only PAWN captures fail if target escapes (because diagonal pawn move requires piece).
            # Other pieces (Knight, Bishop, etc.) can land on the square even if target is gone.

            white_is_capture = self.board.piece_at(white_move.to_square) is not None
            black_is_capture = self.board.piece_at(black_move.to_square) is not None

            # Helper to check if move is a pawn capture (requires target)
            def is_pawn_capture(board, move):
                piece = board.piece_at(move.from_square)
                if piece and piece.piece_type == chess.PAWN:
                    # Pawn capture if file changes
                    return chess.square_file(move.from_square) != chess.square_file(move.to_square)
                return False

            # White tries to capture on Black's from_square (target escapes)
            if white_is_capture and white_move.to_square == black_move.from_square:
                if is_pawn_capture(self.board, white_move):
                    logger.debug(f"CONFLICT: White's PAWN capture target on {chess.square_name(white_move.to_square)} escaped")
                    reason = f"Conflict: pawn capture target on {chess.square_name(white_move.to_square)} moved away"
                    return self._handle_mutual_illegality(result, white_move_str, black_move_str, reason)
                else:
                    logger.debug(f"Target escaped but White move {white_move} is piece move, allowing as non-capture")

            # Black tries to capture on White's from_square (target escapes)
            if black_is_capture and black_move.to_square == white_move.from_square:
                if is_pawn_capture(self.board, black_move):
                    logger.debug(f"CONFLICT: Black's PAWN capture target on {chess.square_name(black_move.to_square)} escaped")
                    reason = f"Conflict: pawn capture target on {chess.square_name(black_move.to_square)} moved away"
                    return self._handle_mutual_illegality(result, white_move_str, black_move_str, reason)
                else:
                    logger.debug(f"Target escaped but Black move {black_move} is piece move, allowing as non-capture")

            # RULE 3: Check for sliding piece path collisions (Path Integrity)
            white_piece = self.board.piece_at(white_move.from_square)
            black_piece = self.board.piece_at(black_move.from_square)

            if white_piece and black_piece:
                white_path = self._get_sliding_path(white_move.from_square, white_move.to_square, white_piece.piece_type)
                black_path = self._get_sliding_path(black_move.from_square, black_move.to_square, black_piece.piece_type)

                path_collision = False
                collision_reason = None

                if black_move.to_square in white_path:
                    path_collision = True
                    collision_reason = f"Path blocked: {chess.square_name(black_move.to_square)} obstructs sliding piece"
                elif white_move.to_square in black_path:
                    path_collision = True
                    collision_reason = f"Path blocked: {chess.square_name(white_move.to_square)} obstructs sliding piece"

                if path_collision:
                    logger.debug(f"CONFLICT: Path collision - {collision_reason}")
                    return self._handle_mutual_illegality(result, white_move_str, black_move_str, collision_reason)

            # RULE 4 & 5: Check move validity with PATH-OPENING support
            # In SimChess, we use PSEUDO-LEGAL moves - you CAN move into check (gambling)
            white_legal_now = white_move in white_board.pseudo_legal_moves
            black_legal_now = black_move in black_board.pseudo_legal_moves

            white_path_opened = False
            black_path_opened = False

            if not white_legal_now and white_piece:
                white_path = self._get_sliding_path(white_move.from_square, white_move.to_square, white_piece.piece_type)
                if black_move.from_square in white_path:
                    if black_move.to_square not in white_path and black_move.to_square != white_move.to_square:
                        path_clear_after = True
                        for sq in white_path:
                            if sq == black_move.from_square:
                                continue
                            piece_on_sq = self.board.piece_at(sq)
                            if piece_on_sq is not None:
                                path_clear_after = False
                                break
                        if path_clear_after:
                            target_piece = self.board.piece_at(white_move.to_square)
                            if target_piece is None or target_piece.color != chess.WHITE:
                                white_path_opened = True
                                logger.debug(f"PATH OPENED: Black moving from {chess.square_name(black_move.from_square)} opens path for White's {white_move}")

            if not black_legal_now and black_piece:
                black_path = self._get_sliding_path(black_move.from_square, black_move.to_square, black_piece.piece_type)
                if white_move.from_square in black_path:
                    if white_move.to_square not in black_path and white_move.to_square != black_move.to_square:
                        path_clear_after = True
                        for sq in black_path:
                            if sq == white_move.from_square:
                                continue
                            piece_on_sq = self.board.piece_at(sq)
                            if piece_on_sq is not None:
                                path_clear_after = False
                                break
                        if path_clear_after:
                            target_piece = self.board.piece_at(black_move.to_square)
                            if target_piece is None or target_piece.color != chess.BLACK:
                                black_path_opened = True
                                logger.debug(f"PATH OPENED: White moving from {chess.square_name(white_move.from_square)} opens path for Black's {black_move}")

            # Now determine final validity
            white_valid = white_legal_now or white_path_opened
            black_valid = black_legal_now or black_path_opened

            if not white_valid:
                logger.debug(f"White move {white_move} is not legal (path-opening checked)")
                result["valid_moves"]["white"] = False
                result["illegal_reason"]["white"] = "Not a legal chess move"
                self.last_illegal_moves["white"] = white_move_str

            if not black_valid:
                logger.debug(f"Black move {black_move} is not legal (path-opening checked)")
                result["valid_moves"]["black"] = False
                result["illegal_reason"]["black"] = "Not a legal chess move"
                self.last_illegal_moves["black"] = black_move_str

            # If any move was illegal, classify as mutual or one-sided and apply penalties if needed
            if not result["valid_moves"]["white"] or not result["valid_moves"]["black"]:
                white_illegal = not result["valid_moves"]["white"]
                black_illegal = not result["valid_moves"]["black"]
                if white_illegal and black_illegal:
                    reason = result["illegal_reason"]["white"] or result["illegal_reason"]["black"] or "Mutual illegality"
                    return self._handle_mutual_illegality(result, white_move_str, black_move_str, reason)
                else:
                    # Exactly one side is illegal
                    self.illegal_attempt += 1
                    result["illegal_attempt"] = self.illegal_attempt
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
                        # Check for time out due to penalty
                        if self.clock_seconds[offender] <= 0:
                            self.game_over = True
                            self.winner = "black" if offender == "white" else "white"
                            self.win_reason = "timeout"
                            result["game_over"] = True
                            result["winner"] = self.winner
                            result["win_reason"] = "timeout"
                # Clear submissions so both must resubmit; include current FEN
                self.moves = {"white": None, "black": None}
                self.ready_status = {"white": False, "black": False}
                result["fen"] = self.board.fen()
                result["clock_seconds"] = self.clock_seconds
                return result

            # If we get here, both moves are valid, so apply them
            logger.debug("Both moves valid, applying to board")

            new_board = SimChessBoard(self.board.fen())

            orig_white_piece = self.board.piece_at(white_move.from_square)
            orig_black_piece = self.board.piece_at(black_move.from_square)

            # 1. Apply white's move
            if new_board.turn != chess.WHITE:
                white_fen = list(new_board.fen().split())
                white_fen[1] = 'w'
                new_board = SimChessBoard(' '.join(white_fen))
            new_board.push(white_move)

            # 2. Apply black's move (with patching if needed)
            target_collision = (white_move.to_square == black_move.from_square)
            if target_collision:
                new_board.set_piece_at(black_move.from_square, orig_black_piece)

            if new_board.turn != chess.BLACK:
                black_fen = list(new_board.fen().split())
                black_fen[1] = 'b'
                new_board = SimChessBoard(' '.join(black_fen))
            new_board.push(black_move)

            # 3. Final Correction: restore White's piece if there was a collision
            if target_collision:
                w_piece_type = white_move.promotion if white_move.promotion else orig_white_piece.piece_type
                new_board.set_piece_at(white_move.to_square, chess.Piece(w_piece_type, chess.WHITE))

            self.board = new_board

            self.illegal_attempt = 0
            self.mutual_illegal_count = 0
            self.turn_number += 1
            result["turn_complete"] = True
            result["moves_san"] = result["intended_moves"]

            # Check for king capture (SimChess win condition)
            white_king_exists = self.board.king(chess.WHITE) is not None
            black_king_exists = self.board.king(chess.BLACK) is not None

            if not white_king_exists and not black_king_exists:
                self.game_over = True
                self.draw_reason = "mutual king capture"
                result["draw"] = True
                result["draw_reason"] = "mutual king capture"
            elif not black_king_exists:
                self.game_over = True
                self.winner = "white"
                result["king_captured"] = True
                result["winner"] = "white"
            elif not white_king_exists:
                self.game_over = True
                self.winner = "black"
                result["king_captured"] = True
                result["winner"] = "black"

            # Check for immediate checkmate
            if not self.game_over:
                checkmate_result = self.check_immediate_checkmate()
                if checkmate_result:
                    result.update(checkmate_result)
                    result["turn_complete"] = True

            # Check for insufficient material
            if not self.game_over and self.board.is_insufficient_material():
                self.game_over = True
                self.draw_reason = "insufficient material"
                result["draw"] = True
                result["draw_reason"] = "insufficient material"

            # Track position for threefold repetition
            if not self.game_over:
                position_key = self._get_position_key()
                self.position_history.append(position_key)

                if self.position_history.count(position_key) >= 3:
                    self.game_over = True
                    self.draw_reason = "threefold repetition"
                    result["draw"] = True
                    result["draw_reason"] = "threefold repetition"

        except Exception as e:
            logger.error(f"Error processing moves: {str(e)}")
            result["valid_moves"]["white"] = False
            result["valid_moves"]["black"] = False
            reason = f"Server error: {str(e)}"
            result["illegal_reason"]["white"] = reason
            result["illegal_reason"]["black"] = reason

        # Reset for next turn
        self.moves = {"white": None, "black": None}
        self.ready_status = {"white": False, "black": False}

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
            "win_reason": self.win_reason,
            "draw_reason": self.draw_reason,
            "illegal_move_counts": self.illegal_move_counts,
            "last_illegal_moves": self.last_illegal_moves,
            "mutual_illegal_count": self.mutual_illegal_count,
            "one_sided_illegal_counts": self.one_sided_illegal_counts,
            "one_sided_threshold": self.one_sided_threshold,
            "penalty_seconds": self.one_sided_penalty_seconds,
            "clock_seconds": self.clock_seconds
        }
