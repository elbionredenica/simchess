// -- SimChess namespace -------------------------------------------------------
// Defined at module scope so all subsequently-loaded scripts can access it.
window.SimChess = {
    // Constants
    TIME_CONTROL:       600,
    ABORT_TIME:         30,
    ABORT_WARNING_TIME: 15,

    // Socket / board references
    socket: null,
    board:  null,

    // Session state
    playerColor:     null,
    gameId:          null,
    currentMove:     null,
    localChessGame:  null,
    allowMoves:      true,
    attemptNumber:   0,
    pendingPosition: null,

    // Move history
    moveHistory:      [],
    currentMoveIndex: -1,
    isViewingHistory: false,

    // Walkthrough
    currentWtStep: 1,

    // Clocks
    whiteTimeSeconds:   0,
    blackTimeSeconds:   0,
    whiteClockInterval: null,
    blackClockInterval: null,
    whiteClockRunning:  false,
    blackClockRunning:  false,

    // Abort timer
    abortTimer:    null,
    gameStartTime: null,
    firstMoveMade: false,
};

// -- Entry point --------------------------------------------------------------
$(function () {
    const SC = SimChess;

    SC.localChessGame   = new Chess();
    SC.whiteTimeSeconds = SC.TIME_CONTROL;
    SC.blackTimeSeconds = SC.TIME_CONTROL;

    // -- updateGameState (used by socket.js via SC.*) -------------------------
    SC.updateGameState = function (gameState, preservePosition) {
        preservePosition = preservePosition || false;
        $('#turn-number').text(gameState.turn_number);

        SC.attemptNumber = gameState.illegal_attempt || 0;
        if (SC.attemptNumber > 0) {
            $('#attempt-number').text('.' + SC.attemptNumber);
        } else {
            $('#attempt-number').text('');
        }

        if (gameState.fen && SC.board && !preservePosition && !SC.pendingPosition) {
            SC.localChessGame = new Chess(gameState.fen);
            SC.board.position(gameState.fen);
            SC.currentMove = null;
            $('#current-move').addClass('hidden');
        }

        if (gameState.white_ready && gameState.black_ready) {
            $('#waiting-message').addClass('hidden');
        } else if (
            (SC.playerColor === 'white' && gameState.white_ready) ||
            (SC.playerColor === 'black' && gameState.black_ready)
        ) {
            $('#waiting-message').html(
                '<p class="text-sm text-cyan-100">Waiting for opponent to submit move...</p>'
            );
            $('#waiting-message').removeClass('hidden');
            $('#submit-move').addClass('hidden');
            $('#reset-move').addClass('hidden');
        } else {
            $('#waiting-message').addClass('hidden');
            if (SC.currentMove) {
                $('#submit-move').removeClass('hidden');
                $('#reset-move').removeClass('hidden');
            } else {
                $('#submit-move').addClass('hidden');
                $('#reset-move').addClass('hidden');
            }
        }
    };

    // -- URL-based auto-join --------------------------------------------------
    (function () {
        var m = window.location.pathname.match(/^\/join\/(.+)$/);
        if (m) {
            var id = decodeURIComponent(m[1]).trim();
            $('#game-id-input').val(id);
            setTimeout(function () { $('#join-game').trigger('click'); }, 400);
        }
    })();

    // Auto-show walkthrough for first-time visitors
    if (!localStorage.getItem('simchess-wt-seen')) {
        setTimeout(function () { SC.openHelpModal(); }, 800);
    }

    // -- Clipboard helper -----------------------------------------------------
    function copyToClipboard(text, btn) {
        var originalHtml = btn.html();
        var checkIcon =
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';

        function onSuccess() {
            btn.html(checkIcon + (btn.attr('id') === 'copy-game-id' ? ' Copied!' : ''));
            setTimeout(function () { btn.html(originalHtml); }, 2000);
        }

        function fallback() {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-999999px';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); onSuccess(); }
            catch (e) { console.error('Copy failed', e); }
            document.body.removeChild(ta);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onSuccess).catch(fallback);
        } else {
            fallback();
        }
    }

    // -- Lobby handlers -------------------------------------------------------
    $('#create-game').click(function () {
        $.post('/api/create_game', function (data) {
            SC.gameId = data.game_id;
            SC.initializeSocket();
            var inviteUrl = window.location.origin + '/join/' + SC.gameId;
            $('#invite-link-text').text(inviteUrl);
            $('#game-id-display').removeClass('hidden');
            $('#create-game').addClass('hidden');
        });
    });

    $('#join-game').click(function () {
        var raw   = $('#game-id-input').val().trim();
        var m     = raw.match(/\/join\/(.+)$/);
        SC.gameId = m ? m[1].trim() : raw;
        if (SC.gameId) {
            SC.initializeSocket();
        } else {
            alert('Please enter a Game ID or invite link');
        }
    });

    $('#copy-game-id').click(function () {
        copyToClipboard(window.location.origin + '/join/' + SC.gameId, $(this));
    });

    $('#copy-game-id-header').click(function () {
        copyToClipboard(window.location.origin + '/join/' + SC.gameId, $(this));
    });

    // -- In-game action handlers ----------------------------------------------
    $('#submit-move').click(function () {
        if (SC.currentMove) {
            SC.firstMoveMade = true;
            SC.socket.emit('submit_move', {
                game_id:       SC.gameId,
                color:         SC.playerColor,
                move:          SC.currentMove,
                clock_seconds: {
                    white: SC.whiteTimeSeconds,
                    black: SC.blackTimeSeconds,
                },
            });
            SC.pendingPosition = SC.board.position();
            SC.stopPlayerClock(SC.playerColor);
            $('#submit-move').addClass('hidden');
            $('#reset-move').addClass('hidden');
            $('#waiting-message').removeClass('hidden');
            SC.allowMoves = false;
        } else {
            alert('Please make a move first');
        }
    });

    $('#reset-move').click(function () {
        SC.currentMove = null;
        $('#current-move').addClass('hidden');
        SC.board.position(SC.localChessGame.fen());
        $('#submit-move').addClass('hidden');
        $('#reset-move').addClass('hidden');
    });

    $('#new-game').click(function () { location.reload(); });

    $('#resign-game').click(function () {
        if (confirm('Are you sure you want to resign this game?')) {
            $.ajax({
                url:         '/api/resign_game',
                method:      'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    game_id:      SC.gameId,
                    player_color: SC.playerColor,
                }),
                success: function (response) {
                    if (!response.success) {
                        alert('Failed to resign: ' + response.message);
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Resignation error:', error);
                    alert('Error resigning game');
                },
            });
        }
    });
});
