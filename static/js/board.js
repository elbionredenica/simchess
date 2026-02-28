// ── Board initialisation ──────────────────────────────────────────────────────
// Depends on: game.js (window.SimChess namespace)
$(function () {
    const SC = SimChess;

    SC.initializeBoard = function (initialPosition) {
        SC.localChessGame = new Chess(initialPosition);

        function onDragStart(source, piece) {
            if (!SC.allowMoves) return false;
            if ((SC.playerColor === 'white' && piece.search(/^b/) !== -1) ||
                (SC.playerColor === 'black' && piece.search(/^w/) !== -1)) {
                return false;
            }
            return true;
        }

        function onDrop(source, target) {
            if (target === 'offboard' || source === target) return 'snapback';

            SC.currentMove = source + target;

            // Auto-promote pawns to queen
            const piece = SC.localChessGame.get(source);
            if (piece && piece.type === 'p') {
                const rank    = target.charAt(1);
                const isWhite = piece.color === 'w';
                if ((isWhite && rank === '8') || (!isWhite && rank === '1')) {
                    SC.currentMove += 'q';
                }
            }

            $('#current-move-text').text(source + ' to ' + target);
            $('#current-move').removeClass('hidden');
            $('#submit-move').removeClass('hidden');
            $('#reset-move').removeClass('hidden');
            return true;
        }

        SC.board = Chessboard('game-board', {
            position:     initialPosition,
            orientation:  SC.playerColor === 'white' ? 'white' : 'black',
            showNotation: true,
            pieceTheme:   'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
            draggable:    true,
            onDragStart:  onDragStart,
            onDrop:       onDrop,
        });

        $(window).resize(function () { SC.board.resize(); });
    };
});
