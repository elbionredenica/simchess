// ── Socket initialisation and real-time event handlers ───────────────────────
// Depends on: game.js (window.SimChess namespace), clocks.js, board.js, ui.js
$(function () {
    const SC = SimChess;

    SC.initializeSocket = function () {
        SC.socket = io();

        SC.socket.on('connect', function () {
            SC.socket.emit('join', { game_id: SC.gameId });
        });

        SC.socket.on('joined', function (data) {
            SC.playerColor = data.color;
            SC.updateGameState(data.game_state);

            $('#header-game-id-text').text(SC.gameId);
            $('#header-game-id').removeClass('hidden').css('display', 'flex');

            // Transition: hide welcome → show board (flicker-free opacity fade)
            $('#welcome-screen').addClass('hidden');
            $('#game-board-container').removeClass('hidden').css('opacity', '0');
            $('#player-color').text(SC.playerColor);

            setTimeout(function () {
                SC.initializeBoard(data.game_state.fen || 'start');
                SC.addMoveToHistory({
                    white: null,
                    black: null,
                    fen:   data.game_state.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                    turn:  0,
                });
                $('#game-board-container').css('opacity', '1');
            }, 100);

            SC.allowMoves = true;
        });

        SC.socket.on('player_joined', function (data) {
            SC.updateGameState(data.game_state);
            SC.allowMoves = true;
            SC.startBothClocks();
            SC.socket.emit('start_clocks', { game_id: SC.gameId });
        });

        SC.socket.on('clocks_started', function () {
            if (!SC.whiteClockRunning || !SC.blackClockRunning) {
                SC.startBothClocks();
            }
        });

        SC.socket.on('move_submitted', function (data) {
            SC.updateGameState(data.game_state);
            if (data.color !== SC.playerColor) {
                $('#waiting-message').html('<p class="text-sm text-cyan-100">Opponent has submitted. Waiting for you...</p>');
                $('#waiting-message').removeClass('hidden');
                SC.allowMoves = true;
            }
            if (data.color === 'white') SC.stopPlayerClock('white');
            else                        SC.stopPlayerClock('black');
        });

        SC.socket.on('moves_processed', function (data) {
            const result = data.result;
            const state  = data.game_state;

            if (result.penalty_applied && state.clock_seconds) {
                SC.syncClockFromServer(state.clock_seconds.white, state.clock_seconds.black);
            }

            // Rule-based game over (illegality draw / timeout penalty exhaustion)
            if (result.game_over || result.draw || result.winner) {
                SC.stopAllClocks();
                let title, sub, isWin = false;
                if (result.draw) {
                    title = 'Draw';
                    sub   = 'Game drawn by ' + result.draw_reason;
                    SC.showGameOverModal(title, sub, false, state.turn_number);
                } else if (result.winner) {
                    isWin = result.winner === SC.playerColor;
                    title = isWin ? 'Victory!' : 'Defeat';
                    sub   = result.winner.charAt(0).toUpperCase() + result.winner.slice(1) +
                            ' wins by ' + (result.win_reason || 'timeout');
                    SC.showGameOverModal(title, sub, isWin, state.turn_number);
                }
                $('#game-result').removeClass('hidden');
                $('#result-message').text(sub);
                SC.allowMoves = false;
                return;
            }

            if (result.turn_complete || SC.pendingPosition === null) {
                SC.updateGameState(state);
                SC.localChessGame = new Chess(state.fen);
                if (SC.board) SC.board.position(state.fen);

                if (result.turn_complete) {
                    const wSAN     = (result.moves_san && result.moves_san.white)     || (result.intended_moves && result.intended_moves.white);
                    const bSAN     = (result.moves_san && result.moves_san.black)     || (result.intended_moves && result.intended_moves.black);
                    const intended = result.intended_moves || {};
                    SC.addMoveToHistory({
                        white: wSAN, black: bSAN, fen: state.fen,
                        turn: state.turn_number - 1,
                        intended: intended, isIllegal: false,
                    });
                    SC.isViewingHistory = false;
                }
            } else {
                // Illegal attempt — revert board
                SC.board.position(SC.localChessGame.fen());
                SC.pendingPosition = null;
                SC.currentMove     = null;
                const intended = result.intended_moves || {};
                SC.addMoveToHistory({
                    white: null, black: null, fen: state.fen,
                    turn: state.turn_number, intended: intended, isIllegal: true,
                    reason: result.illegal_reason
                        ? (result.illegal_reason.white || result.illegal_reason.black)
                        : 'Mutual Illegality',
                });
                SC.updateGameState(state);
            }

            SC.currentMove     = null;
            SC.pendingPosition = null;
            $('#current-move').addClass('hidden');
            $('#turn-number').text(state.turn_number);
            SC.attemptNumber = state.illegal_attempt || 0;
            $('#attempt-number').text(SC.attemptNumber > 0 ? '.' + SC.attemptNumber : '');

            let statusHtml = '<h2>Turn ' + state.turn_number +
                             (SC.attemptNumber > 0 ? '.' + SC.attemptNumber : '') + '</h2>';

            if (result.valid_moves && result.valid_moves[SC.playerColor] === false) {
                SC.allowMoves = true;
                $('#waiting-message').addClass('hidden');
            }

            if (result.penalty_applied) {
                statusHtml += '<p>Penalty: -' + result.penalty_applied.seconds +
                              's applied to ' + result.penalty_applied.color +
                              ' for repeated one-sided illegality.</p>';
            }

            $('#mutual-illegal').text(state.mutual_illegal_count || 0);
            if (state.one_sided_illegal_counts) {
                $('#white-one-illegal').text(state.one_sided_illegal_counts.white || 0);
                $('#black-one-illegal').text(state.one_sided_illegal_counts.black || 0);
            }
            const threshold = state.one_sided_threshold || 3;
            $('#one-threshold').text(threshold);
            $('#one-threshold-2').text(threshold);

            if (state.game_over) {
                SC.stopAllClocks();
                let title, sub, isWin = false;
                if (state.winner) {
                    isWin = state.winner === SC.playerColor;
                    const winReason = state.win_reason ||
                                      (result.king_captured ? 'king capture' : 'checkmate');
                    title = isWin ? 'Victory!' : 'Defeat';
                    sub   = state.winner.charAt(0).toUpperCase() + state.winner.slice(1) +
                            ' wins by ' + winReason;
                    statusHtml += '<p><strong>' + (isWin ? 'You won!' : 'You lost!') +
                                  '</strong> Game ended by ' + winReason + '.</p>';
                    $('#result-message').text(sub);
                } else if (state.draw_reason) {
                    title      = 'Draw';
                    sub        = 'Game drawn by ' + state.draw_reason;
                    statusHtml += '<p><strong>Game drawn</strong> by ' + state.draw_reason + '.</p>';
                    $('#result-message').text(sub);
                }
                SC.showGameOverModal(title, sub, isWin, state.turn_number);
                $('#game-result').removeClass('hidden');
                $('#waiting-message').addClass('hidden');
            } else {
                SC.allowMoves = true;
                $('#waiting-message').addClass('hidden');
                SC.startBothClocks();
            }

            $('#game-status').html(statusHtml);
        });

        SC.socket.on('game_state_update', function (data) {
            const state = data.game_state;
            if (!state) return;
            SC.updateGameState(state);

            if (state.clock_seconds && (
                state.mutual_illegal_count > 0 ||
                state.one_sided_illegal_counts.white > 0 ||
                state.one_sided_illegal_counts.black > 0
            )) {
                SC.syncClockFromServer(state.clock_seconds.white, state.clock_seconds.black);
            }

            if (state.game_over && state.winner) {
                SC.stopAllClocks();
                const isWin      = state.winner === SC.playerColor;
                const winnerName = state.winner.charAt(0).toUpperCase() + state.winner.slice(1);
                const winReason  = state.win_reason || 'resignation';
                const title      = isWin ? 'Victory!' : 'Defeat';
                const sub        = winnerName + ' wins by ' + winReason;

                $('#game-status').html('<h2>Game Over</h2><p><strong>' +
                    (isWin ? 'You won!' : 'You lost!') +
                    '</strong> Game ended by ' + winReason + '.</p>');
                $('#result-message').text(sub);
                SC.showGameOverModal(title, sub, isWin, state.turn_number);
                $('#game-result').removeClass('hidden');
                $('#waiting-message').addClass('hidden');
                $('#submit-move').addClass('hidden');
                $('#reset-move').addClass('hidden');
                SC.allowMoves = false;
            }
        });

        SC.socket.on('error', function (data) {
            alert('Error: ' + data.message);
        });
    };
});
