$(function () {
    // TIME CONTROL CONFIGURATION - Change this value to test different time formats
    // 600 = 10 minutes, 60 = 1 minute, 10 = 10 seconds, etc.
    const TIME_CONTROL = 600; // Change this to 10 for testing 10 second games
    const ABORT_TIME = 30; // Game aborts if no moves in first 60 seconds
    const ABORT_WARNING_TIME = 15; // Show warning at 50 seconds
    
    let socket;
    let board;
    let game;
    let playerColor;
    let gameId;
    let currentMove = null;
    let localChessGame = new Chess();
    let allowMoves = true;
    let attemptNumber = 0;
    let pendingPosition = null;
    let moveHistory = []; // Store legal moves history
    let currentMoveIndex = -1; // Current position in history
    let isViewingHistory = false; // Flag to track if we're viewing history

    // Clock variables
    let whiteTimeSeconds = TIME_CONTROL;
    let blackTimeSeconds = TIME_CONTROL;
    let whiteClockInterval = null;
    let blackClockInterval = null;
    let whiteClockRunning = false;
    let blackClockRunning = false;
    
    // Abort timer
    let abortTimer = null;
    let gameStartTime = null;
    let firstMoveMade = false;

    // Event handlers
    $('#create-game').click(function () {
        $.post('/api/create_game', function (data) {
            gameId = data.game_id;
            initializeSocket();
            $('#current-game-id').text(gameId);
            $('#game-id-display').removeClass('hidden');
            $('#game-status h2').html('Game Created!');
            $('#game-status p').html('Waiting for opponent to join...');
        });
    });

    $('#join-game').click(function () {
        gameId = $('#game-id-input').val().trim();
        if (gameId) {
            initializeSocket();
        } else {
            alert('Please enter a Game ID');
        }
    });

    $('#copy-game-id').click(function () {
        const gameIdText = $('#current-game-id').text().trim();
        const btn = $('#copy-game-id');
        const originalHtml = btn.html();
        
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(gameIdText).then(function () {
                btn.html('<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Copied!');
                setTimeout(function () {
                    btn.html(originalHtml);
                }, 2000);
            }).catch(function(err) {
                console.error('Clipboard API failed, trying fallback:', err);
                copyToClipboardFallback(gameIdText, btn, originalHtml);
            });
        } else {
            // Use fallback for older browsers
            copyToClipboardFallback(gameIdText, btn, originalHtml);
        }
    });

    $('#copy-game-id-header').click(function () {
        const gameIdText = $('#header-game-id-text').text().trim();
        const btn = $('#copy-game-id-header');
        const originalHtml = btn.html();
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(gameIdText).then(function () {
                btn.html('<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>');
                setTimeout(function () {
                    btn.html(originalHtml);
                }, 2000);
            }).catch(function(err) {
                console.error('Clipboard API failed, trying fallback:', err);
                copyToClipboardFallback(gameIdText, btn, originalHtml);
            });
        } else {
            copyToClipboardFallback(gameIdText, btn, originalHtml);
        }
    });
    
    // Clipboard fallback function
    function copyToClipboardFallback(text, btn, originalHtml) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            btn.html('<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Copied!');
            setTimeout(function () {
                btn.html(originalHtml);
            }, 2000);
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
    }

    // Help modal handlers
    $('#help-button').click(function () {
        $('#help-modal').removeClass('hidden');
    });

    $('#close-help-modal, #help-modal').click(function (e) {
        if (e.target === this) {
            $('#help-modal').addClass('hidden');
        }
    });

    // Game Over Modal function
    function showGameOverModal(title, subtitle, isWin, turnNumber) {
        // Update title and colors based on win/loss/draw
        $('#game-over-title').text(title);
        $('#game-over-subtitle').text(subtitle);
        $('#game-over-turns').text(turnNumber - 1);

        // Update styling based on outcome
        const iconDiv = $('#game-over-icon > div');
        if (isWin) {
            // Victory - gold crown
            $('#game-over-title').removeClass('from-gray-400 via-gray-300 to-gray-400 from-red-400 via-red-300 to-red-400')
                .addClass('from-yellow-400 via-amber-300 to-yellow-400');
            iconDiv.removeClass('from-gray-400 to-gray-500 from-red-400 to-red-500')
                .addClass('from-yellow-400 to-amber-500');
            iconDiv.html('<svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3H5v2h14v-2z"/></svg>');
        } else if (title === 'Defeat') {
            // Loss - red
            $('#game-over-title').removeClass('from-yellow-400 via-amber-300 to-yellow-400 from-gray-400 via-gray-300 to-gray-400')
                .addClass('from-red-400 via-red-300 to-red-400');
            iconDiv.removeClass('from-yellow-400 to-amber-500 from-gray-400 to-gray-500')
                .addClass('from-red-400 to-red-500');
            iconDiv.html('<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>');
        } else {
            // Draw - gray
            $('#game-over-title').removeClass('from-yellow-400 via-amber-300 to-yellow-400 from-red-400 via-red-300 to-red-400')
                .addClass('from-gray-400 via-gray-300 to-gray-400');
            iconDiv.removeClass('from-yellow-400 to-amber-500 from-red-400 to-red-500')
                .addClass('from-gray-400 to-gray-500');
            iconDiv.html('<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>');
        }

        // Show modal with slight delay for drama
        setTimeout(() => {
            $('#game-over-modal').removeClass('hidden');
        }, 300);
    }

    // Game Over Modal handlers
    $('#game-over-new-game').click(function () {
        location.reload();
    });

    $('#game-over-close').click(function () {
        $('#game-over-modal').addClass('hidden');
    });

    // Move navigation handlers
    $('#move-first').click(function () {
        if (moveHistory.length > 0) {
            currentMoveIndex = 0;
            viewHistoryMove(currentMoveIndex);
        }
    });

    $('#move-prev').click(function () {
        if (currentMoveIndex > 0) {
            currentMoveIndex--;
            viewHistoryMove(currentMoveIndex);
        }
    });

    $('#move-next').click(function () {
        if (currentMoveIndex < moveHistory.length - 1) {
            currentMoveIndex++;
            viewHistoryMove(currentMoveIndex);
        }
    });

    $('#move-last').click(function () {
        if (moveHistory.length > 0) {
            currentMoveIndex = moveHistory.length - 1;
            viewHistoryMove(currentMoveIndex);
            isViewingHistory = false;
            updateNavigationButtons();
        }
    });

    $('#resign-game').click(function () {
        if (confirm('Are you sure you want to resign this game?')) {
            $.ajax({
                url: '/api/resign_game',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    game_id: gameId,
                    player_color: playerColor
                }),
                success: function (response) {
                    if (!response.success) {
                        alert('Failed to resign: ' + response.message);
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Resignation error:', error);
                    alert('Error resigning game');
                }
            });
        }
    });

    function viewHistoryMove(index) {
        if (index >= 0 && index < moveHistory.length) {
            isViewingHistory = true;
            board.position(moveHistory[index].fen);
            updateNavigationButtons();
            highlightMoveInList(index);
        }
    }

    function updateNavigationButtons() {
        $('#move-first').prop('disabled', currentMoveIndex <= 0);
        $('#move-prev').prop('disabled', currentMoveIndex <= 0);
        $('#move-next').prop('disabled', currentMoveIndex >= moveHistory.length - 1);
        $('#move-last').prop('disabled', currentMoveIndex >= moveHistory.length - 1 || !isViewingHistory);
    }

    function addMoveToHistory(moveData) {
        // moveData: { white, black, fen, turn, intended, isIllegal, reason }
        moveHistory.push(moveData);
        currentMoveIndex = moveHistory.length - 1;
        updateMoveList();
        updateNavigationButtons();
    }

    function updateMoveList() {
        // Filter out move 0 (initial position)
        const visibleMoves = moveHistory.filter(move => move.turn > 0);

        if (visibleMoves.length === 0) {
            $('#move-list').html('<p class="text-blue-300/50 text-center py-4">No moves yet</p>');
            return;
        }

        const moveListHtml = visibleMoves.map((move, index) => {
            const actualIndex = moveHistory.indexOf(move);

            if (move.isIllegal) {
                const whiteIntended = (move.intended && move.intended.white) || move.white || '?';
                const blackIntended = (move.intended && move.intended.black) || move.black || '?';
                return `<div class="move-item block text-xs text-red-300/80 hover:bg-red-900/20 py-1 px-2 border-b border-red-500/10 cursor-pointer" data-index="${actualIndex}">
                    <span class="mr-2">${move.turn}.</span>
                    <span class="line-through opacity-70">${whiteIntended}</span>
                    <span class="mx-1 text-gray-500">|</span>
                    <span class="line-through opacity-70">${blackIntended}</span>
                    <span class="block text-[10px] text-red-400 mt-0.5">${move.reason || 'Illegal Attempt'}</span>
                </div>`;
            }

            const whiteMove = move.white || '';
            const blackMove = move.black || '';

            // Helper to format intended vs realized
            const formatMove = (realized, intended) => {
                if (!intended || intended === realized) return `<span class="text-blue-100">${realized}</span>`;
                // Show intended vs realized
                return `<span class="text-blue-100 border-b border-dotted border-blue-400/50 cursor-help" title="Intended: ${intended}">${realized}</span>`;
            };

            let moveText = `<span class="text-blue-300/70">${move.turn}.</span> `;
            moveText += formatMove(whiteMove, move.intended ? move.intended.white : null);

            if (blackMove) {
                moveText += ` ${formatMove(blackMove, move.intended ? move.intended.black : null)}`;
            }

            return `<span class="move-item inline-block py-1 px-2 hover:bg-blue-500/20 rounded cursor-pointer mr-2" data-index="${actualIndex}">${moveText}</span>`;
        }).join('');

        $('#move-list').html(moveListHtml);

        // Auto-scroll to bottom
        const moveList = document.getElementById('move-list');
        moveList.scrollTop = moveList.scrollHeight;

        // Add click handlers for move items
        $('.move-item').click(function () {
            const index = parseInt($(this).data('index'));
            currentMoveIndex = index;
            viewHistoryMove(index);
        });
    }

    function highlightMoveInList(index) {
        $('.move-item').removeClass('bg-blue-500/30');
        $(`.move-item[data-index="${index}"]`).addClass('bg-blue-500/30');
    }

    $('#submit-move').click(function () {
        if (currentMove) {
            firstMoveMade = true; // Mark that first move was made
            
            socket.emit('submit_move', {
                game_id: gameId,
                color: playerColor,
                move: currentMove,
                clock_seconds: {
                    white: whiteTimeSeconds,
                    black: blackTimeSeconds
                }
            });

            // Store the pending position so we don't revert immediately
            pendingPosition = board.position();

            // Stop the current player's clock when they submit
            stopPlayerClock(playerColor);

            // Disable controls until next turn
            $('#submit-move').addClass('hidden');
            $('#reset-move').addClass('hidden');
            $('#waiting-message').removeClass('hidden');
            allowMoves = false;
        } else {
            alert('Please make a move first');
        }
    });

    $('#reset-move').click(function () {
        // Reset the current move
        currentMove = null;
        $('#current-move').addClass('hidden');

        // Reset the board position to the server's state
        board.position(localChessGame.fen());
        $('#submit-move').addClass('hidden');
        $('#reset-move').addClass('hidden');
    });

    $('#new-game').click(function () {
        location.reload();
    });

    function initializeSocket() {
        socket = io();

        socket.on('connect', function () {
            socket.emit('join', { game_id: gameId });
        });

        socket.on('joined', function (data) {
            playerColor = data.color;
            updateGameState(data.game_state);

            // Show game ID in header
            $('#header-game-id-text').text(gameId);
            $('#header-game-id').removeClass('hidden');

            $('#welcome-screen').addClass('hidden');
            $('#game-board-container').removeClass('hidden');
            $('#player-color').text(playerColor);

            // Don't initialize clocks from server - use local TIME_CONTROL
            // Clocks are already set to TIME_CONTROL at initialization

            // Initialize board after container is visible
            setTimeout(function () {
                initializeBoard(data.game_state.fen || 'start');
                // Add initial position to history
                // Add initial position to history
                addMoveToHistory({
                    white: null,
                    black: null,
                    fen: data.game_state.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                    turn: 0
                });
            }, 100);

            allowMoves = true;
        });

        socket.on('player_joined', function (data) {
            updateGameState(data.game_state);
            // Don't overwrite game-status here - let abort timer handle it
            allowMoves = true;

            // Don't sync clocks from server - we're using local TIME_CONTROL
            // Both clients have their own TIME_CONTROL value

            // Start both clocks for simultaneous play
            startBothClocks();
            
            // Emit to other player to also start clocks
            socket.emit('start_clocks', { game_id: gameId });
        });
        
        socket.on('clocks_started', function (data) {
            // Both players should have their clocks running
            if (!whiteClockRunning || !blackClockRunning) {
                startBothClocks();
            }
        });

        socket.on('move_submitted', function (data) {
            updateGameState(data.game_state);

            if (data.color !== playerColor) {
                $('#waiting-message').html('<p class="text-sm text-cyan-100">Opponent has submitted their move. Waiting for you...</p>');
                $('#waiting-message').removeClass('hidden');
                allowMoves = true;
            }
            
            // Sync: if opponent submitted, their clock should be stopped
            // This syncs the visual state across both clients
            if (data.color === 'white') {
                stopPlayerClock('white');
            } else if (data.color === 'black') {
                stopPlayerClock('black');
            }
        });

        socket.on('moves_processed', function (data) {
            const result = data.result;
            const state = data.game_state;

            // Sync clocks if penalty was applied or if server sends clock data
            if (result.penalty_applied && state.clock_seconds) {
                syncClockFromServer(state.clock_seconds.white, state.clock_seconds.black);
            }
            
            // Check for game over from illegality rules (draw by 3 mutual or timeout from penalty)
            if (result.game_over || result.draw || result.winner) {
                stopAllClocks();
                let title, subtitle, isWin = false;
                
                if (result.draw) {
                    title = 'Draw';
                    subtitle = `Game drawn by ${result.draw_reason}`;
                    showGameOverModal(title, subtitle, false, state.turn_number);
                } else if (result.winner) {
                    isWin = result.winner === playerColor;
                    title = isWin ? 'Victory!' : 'Defeat';
                    subtitle = `${result.winner.charAt(0).toUpperCase() + result.winner.slice(1)} wins by ${result.win_reason || 'timeout'}`;
                    showGameOverModal(title, subtitle, isWin, state.turn_number);
                }
                
                $('#game-result').removeClass('hidden');
                $('#result-message').text(subtitle);
                allowMoves = false;
                return;
            }

            // Only update the game state if both players made valid moves
            // or we're starting a completely new turn
            if (result.turn_complete || pendingPosition === null) {
                updateGameState(data.game_state);

                // Update the local chess game with the new FEN
                localChessGame = new Chess(data.game_state.fen);

                // Update board with new position
                if (board) {
                    board.position(data.game_state.fen);
                }

                // Add legal move to history (only if turn is complete)
                if (result.turn_complete) {
                    const whiteMoveSAN = (result.moves_san && result.moves_san.white) || (result.intended_moves && result.intended_moves.white);
                    const blackMoveSAN = (result.moves_san && result.moves_san.black) || (result.intended_moves && result.intended_moves.black);
                    const intended = result.intended_moves || {};

                    // The turn_number has already been incremented on the server
                    const moveNumber = data.game_state.turn_number - 1;

                    addMoveToHistory({
                        white: whiteMoveSAN,
                        black: blackMoveSAN,
                        fen: data.game_state.fen,
                        turn: moveNumber,
                        intended: intended,
                        isIllegal: false
                    });
                    isViewingHistory = false;
                }
            } else {
                // Illegality (mutual or one-sided): both clients revert to last legal state
                board.position(localChessGame.fen());
                pendingPosition = null;
                currentMove = null;

                // Log illegal attempt
                const intended = result.intended_moves || {};
                addMoveToHistory({
                    white: null,
                    black: null,
                    fen: data.game_state.fen,
                    turn: data.game_state.turn_number,
                    intended: intended,
                    isIllegal: true,
                    reason: result.illegal_reason ? (result.illegal_reason.white || result.illegal_reason.black) : 'Mutual Illegality'
                });

                // Update UI state from server
                updateGameState(data.game_state);
            }

            // Reset current move
            currentMove = null;
            pendingPosition = null;
            $('#current-move').addClass('hidden');

            // Check if this was an illegal move attempt
            const turnNumberDisplay = data.game_state.turn_number;
            $('#turn-number').text(turnNumberDisplay);

            // Update attempt number if there are illegal moves
            attemptNumber = data.game_state.illegal_attempt || 0;
            if (attemptNumber > 0) {
                $('#attempt-number').text('.' + attemptNumber);
            } else {
                $('#attempt-number').text('');
            }

            // Show move results
            let statusHtml = `<h2>Turn ${turnNumberDisplay}${attemptNumber > 0 ? '.' + attemptNumber : ''}</h2>`;

            if (result.valid_moves && result.valid_moves[playerColor] === false) {
                // Enable move controls for the player to try again
                allowMoves = true;
                $('#waiting-message').addClass('hidden');
            }

            // Penalty feedback
            if (result.penalty_applied) {
                const penalized = result.penalty_applied.color;
                const secs = result.penalty_applied.seconds;
                statusHtml += `<p>Penalty: -${secs}s applied to ${penalized} for repeated one-sided illegality.</p>`;
            }

            // Update new illegality counters
            $('#mutual-illegal').text(state.mutual_illegal_count || 0);
            if (state.one_sided_illegal_counts) {
                $('#white-one-illegal').text(state.one_sided_illegal_counts.white || 0);
                $('#black-one-illegal').text(state.one_sided_illegal_counts.black || 0);
            }
            const threshold = state.one_sided_threshold || 3;
            $('#one-threshold').text(threshold);
            $('#one-threshold-2').text(threshold);

            // Check for game end before resuming clock
            if (data.game_state.game_over) {
                let title, subtitle, isWin = false;

                // Stop all clocks on game over
                stopAllClocks();

                if (data.game_state.winner) {
                    isWin = data.game_state.winner === playerColor;
                    // Determine win reason
                    let winReason = data.game_state.win_reason || 'checkmate';
                    if (!data.game_state.win_reason && result.king_captured) {
                        winReason = 'king capture';
                    }
                    title = isWin ? 'Victory!' : 'Defeat';
                    subtitle = `${data.game_state.winner.charAt(0).toUpperCase() + data.game_state.winner.slice(1)} wins by ${winReason}`;
                    statusHtml += `<p><strong>${isWin ? 'You won!' : 'You lost!'}</strong> Game ended by ${winReason}.</p>`;
                    $('#result-message').text(subtitle);
                } else if (data.game_state.draw_reason) {
                    title = 'Draw';
                    subtitle = `Game drawn by ${data.game_state.draw_reason}`;
                    statusHtml += `<p><strong>Game drawn</strong> by ${data.game_state.draw_reason}.</p>`;
                    $('#result-message').text(subtitle);
                }

                // Show dramatic modal
                showGameOverModal(title, subtitle, isWin, data.game_state.turn_number);

                $('#game-result').removeClass('hidden');
                $('#waiting-message').addClass('hidden');
            } else {
                // Reset for next turn
                allowMoves = true;
                $('#waiting-message').addClass('hidden');

                // Restart both clocks for simultaneous play
                startBothClocks();
            }

            $('#game-status').html(statusHtml);
        });

        socket.on('game_state_update', function (data) {
            const gameState = data.game_state;
            if (!gameState) return;

            updateGameState(gameState);

            // Only sync clocks if there's a penalty or game is starting
            if (gameState.clock_seconds && (gameState.mutual_illegal_count > 0 || gameState.one_sided_illegal_counts.white > 0 || gameState.one_sided_illegal_counts.black > 0)) {
                syncClockFromServer(gameState.clock_seconds.white, gameState.clock_seconds.black);
            }

            if (gameState.game_over) {
                let title, subtitle, isWin = false;

                // Stop all clocks on game over
                stopAllClocks();

                // Handle formatting of winner name
                const winner = gameState.winner || 'Unknown';
                const winnerName = winner.charAt(0).toUpperCase() + winner.slice(1);

                if (gameState.winner) {
                    isWin = gameState.winner === playerColor;
                    let winReason = gameState.win_reason || 'resignation';

                    title = isWin ? 'Victory!' : 'Defeat';
                    subtitle = `${winnerName} wins by ${winReason}`;

                    // Update Status panel text
                    let statusHtml = `<h2>Game Over</h2><p><strong>${isWin ? 'You won!' : 'You lost!'}</strong> Game ended by ${winReason}.</p>`;
                    $('#game-status').html(statusHtml);
                    $('#result-message').text(subtitle);

                    showGameOverModal(title, subtitle, isWin, gameState.turn_number);
                    $('#game-result').removeClass('hidden');
                    $('#waiting-message').addClass('hidden');
                    $('#submit-move').addClass('hidden');
                    $('#reset-move').addClass('hidden');

                    // Disable moves
                    allowMoves = false;
                }
            }
        });

        socket.on('error', function (data) {
            alert('Error: ' + data.message);
        });
    }

    function initializeBoard(initialPosition) {
        // Initialize the chess game object
        localChessGame = new Chess(initialPosition);

        function onDragStart(source, piece) {
            // Allow dragging only when moves are allowed
            if (!allowMoves) return false;

            // Only allow players to move their own pieces
            if ((playerColor === 'white' && piece.search(/^b/) !== -1) ||
                (playerColor === 'black' && piece.search(/^w/) !== -1)) {
                return false;
            }

            return true; // Allow the drag
        }

        function onDrop(source, target) {
            // Prevent offboard or same-square moves
            if (target === 'offboard' || source === target) {
                return 'snapback';
            }

            // Accept the intention without strict legality checks (simultaneous rules)
            // Build UCI string
            currentMove = source + target;

            // Add promotion only if the moving piece is a pawn reaching last rank
            const pieceAtSource = localChessGame.get(source);
            if (pieceAtSource && pieceAtSource.type === 'p') {
                const rank = target.charAt(1);
                const isWhite = pieceAtSource.color === 'w';
                const isPromotionRank = (isWhite && rank === '8') || (!isWhite && rank === '1');
                if (isPromotionRank) {
                    currentMove += 'q';
                }
            }

            // Show the move in the UI
            $('#current-move-text').text(`${source} to ${target}`);
            $('#current-move').removeClass('hidden');

            // Show submission controls
            $('#submit-move').removeClass('hidden');
            $('#reset-move').removeClass('hidden');

            // Don't snap back - leave the piece where it was dropped
            return true;
        }

        // Configuration for the chessboard
        const config = {
            position: initialPosition,
            orientation: playerColor === 'white' ? 'white' : 'black',
            showNotation: true,
            pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
            draggable: true,
            onDragStart: onDragStart,
            onDrop: onDrop
        };

        // Initialize the board
        board = Chessboard('game-board', config);

        // Make the board responsive
        $(window).resize(function () {
            board.resize();
        });
    }

    function updateGameState(gameState, preservePosition = false) {
        $('#turn-number').text(gameState.turn_number);

        // Update attempt number if there are illegal moves
        attemptNumber = gameState.illegal_attempt || 0;
        if (attemptNumber > 0) {
            $('#attempt-number').text('.' + attemptNumber);
        } else {
            $('#attempt-number').text('');
        }

        // Update the board position only if we receive a new FEN state
        // and we're not preserving the current position for visual feedback
        if (gameState.fen && board && !preservePosition && !pendingPosition) {
            // Update the local chess game with the server's FEN
            localChessGame = new Chess(gameState.fen);
            // Update the board to the server's state
            board.position(gameState.fen);
            // Clear the current move since we've updated to the server state
            currentMove = null;
            $('#current-move').addClass('hidden');
        }

        // Handle UI state based on move submission status
        if (gameState.white_ready && gameState.black_ready) {
            // Both players have moved, hide waiting message
            $('#waiting-message').addClass('hidden');
        } else if ((playerColor === 'white' && gameState.white_ready) ||
            (playerColor === 'black' && gameState.black_ready)) {
            // This player has submitted their move, waiting for opponent
            $('#waiting-message').html('<p class="text-sm text-cyan-100">Waiting for opponent to submit move...</p>');
            $('#waiting-message').removeClass('hidden');
            $('#submit-move').addClass('hidden');
            $('#reset-move').addClass('hidden');
        } else {
            // This player needs to submit a move
            $('#waiting-message').addClass('hidden');

            // Only show submit/reset buttons if the player has made a move
            if (currentMove) {
                $('#submit-move').removeClass('hidden');
                $('#reset-move').removeClass('hidden');
            } else {
                $('#submit-move').addClass('hidden');
                $('#reset-move').addClass('hidden');
            }
        }
    }

    function formatSeconds(totalSeconds) {
        const s = Math.max(0, parseInt(totalSeconds || 0, 10));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    // Clock management functions
    function startBothClocks() {
        // Start both clocks for simultaneous play
        startPlayerClock('white');
        startPlayerClock('black');
        
        // Start abort timer if this is the start of the game
        if (!gameStartTime && moveHistory.length <= 1) {
            gameStartTime = Date.now();
            startAbortTimer();
        }
    }
    
    function startAbortTimer() {
        // Check for abort every second
        abortTimer = setInterval(function() {
            if (firstMoveMade) {
                clearInterval(abortTimer);
                abortTimer = null;
                // Hide all abort toasts
                $('#abort-warning-toast').addClass('hidden');
                $('#abort-urgent-toast').addClass('hidden');
                return;
            }
            
            const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
            const remaining = ABORT_TIME - elapsed;
            
            console.log(`Abort timer - elapsed: ${elapsed}s, remaining: ${remaining}s`);
            
            if (remaining <= 0) {
                // Abort the game
                clearInterval(abortTimer);
                abortTimer = null;
                stopAllClocks();
                // Hide toasts
                $('#abort-warning-toast').addClass('hidden');
                $('#abort-urgent-toast').addClass('hidden');
                showGameOverModal('Game Aborted', 'No moves made', false, 0);
                allowMoves = false;
            } else if (remaining <= 10) {
                // Show urgent toast in last 10 seconds
                $('#abort-warning-toast').addClass('hidden');
                $('#abort-urgent-toast').removeClass('hidden');
                $('#abort-urgent-countdown').text(Math.ceil(remaining));
            } else if (elapsed >= ABORT_WARNING_TIME) {
                // Show warning toast after ABORT_WARNING_TIME seconds have elapsed
                $('#abort-urgent-toast').addClass('hidden');
                $('#abort-warning-toast').removeClass('hidden');
                $('#abort-countdown').text(Math.ceil(remaining) + 's');
            }
        }, 1000);
    }

    function startPlayerClock(color) {
        if (color === 'white' && !whiteClockRunning) {
            whiteClockRunning = true;
            $('#white-clock-container').addClass('active');
            $('#white-clock-status').removeClass('hidden');
            
            whiteClockInterval = setInterval(function() {
                whiteTimeSeconds = Math.max(0, whiteTimeSeconds - 1);
                updateClockDisplay('white', whiteTimeSeconds);

                if (whiteTimeSeconds <= 0) {
                    stopPlayerClock('white');
                    handleTimeOut('white');
                }
            }, 1000);
        } else if (color === 'black' && !blackClockRunning) {
            blackClockRunning = true;
            $('#black-clock-container').addClass('active');
            $('#black-clock-status').removeClass('hidden');
            
            blackClockInterval = setInterval(function() {
                blackTimeSeconds = Math.max(0, blackTimeSeconds - 1);
                updateClockDisplay('black', blackTimeSeconds);

                if (blackTimeSeconds <= 0) {
                    stopPlayerClock('black');
                    handleTimeOut('black');
                }
            }, 1000);
        }
    }

    function stopPlayerClock(color) {
        if (color === 'white') {
            if (whiteClockInterval) {
                clearInterval(whiteClockInterval);
                whiteClockInterval = null;
            }
            whiteClockRunning = false;
            $('#white-clock-container').removeClass('active');
            $('#white-clock-status').addClass('hidden');
        } else if (color === 'black') {
            if (blackClockInterval) {
                clearInterval(blackClockInterval);
                blackClockInterval = null;
            }
            blackClockRunning = false;
            $('#black-clock-container').removeClass('active');
            $('#black-clock-status').addClass('hidden');
        }
    }

    function stopAllClocks() {
        stopPlayerClock('white');
        stopPlayerClock('black');
    }

    function updateClockDisplay(color, seconds) {
        const timeStr = formatSeconds(seconds);
        $(`#${color}-clock`).text(timeStr);

        // Add warning animation if time is low (under 60 seconds)
        if (seconds <= 60 && seconds > 0) {
            $(`#${color}-clock`).addClass('clock-warning');
        } else {
            $(`#${color}-clock`).removeClass('clock-warning');
        }
    }

    function syncClockFromServer(whiteSeconds, blackSeconds) {
        // Initialize clocks from server (only on first join or significant changes like penalties)
        const whiteChanged = Math.abs(whiteTimeSeconds - whiteSeconds) > 2;
        const blackChanged = Math.abs(blackTimeSeconds - blackSeconds) > 2;
        
        if (whiteChanged) {
            whiteTimeSeconds = whiteSeconds;
            updateClockDisplay('white', whiteTimeSeconds);
        }
        if (blackChanged) {
            blackTimeSeconds = blackSeconds;
            updateClockDisplay('black', blackTimeSeconds);
        }
    }

    function initClockFromServer(whiteSeconds, blackSeconds) {
        // Force set clocks on initial join (before game starts)
        whiteTimeSeconds = whiteSeconds;
        blackTimeSeconds = blackSeconds;
        updateClockDisplay('white', whiteTimeSeconds);
        updateClockDisplay('black', blackTimeSeconds);
    }

    function handleTimeOut(color) {
        // Stop all clocks
        stopAllClocks();
        
        // Determine winner (opponent of player who timed out)
        const winner = color === 'white' ? 'black' : 'white';
        const isWin = winner === playerColor;
        
        const title = isWin ? 'Victory!' : 'Defeat';
        const subtitle = `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins on time`;
        
        // Show game over modal
        showGameOverModal(title, subtitle, isWin, moveHistory.length);
        
        // Update game status
        $('#game-status').html(`<h2>Game Over</h2><p><strong>${color.charAt(0).toUpperCase() + color.slice(1)} ran out of time!</strong></p>`);
        $('#result-message').text(subtitle);
        $('#game-result').removeClass('hidden');
        allowMoves = false;
        
        // Emit time out event to server
        if (socket) {
            socket.emit('time_out', {
                game_id: gameId,
                color: color
            });
        }
    }
});
