import chess


class SimChessBoard(chess.Board):
    """Custom Board class for SimChess that allows pseudo-legal moves (gambling)."""

    def is_legal(self, move):
        # Allow any pseudo-legal move (including moving pinned pieces or into check)
        return self.is_pseudo_legal(move)
