// ── Clock management ─────────────────────────────────────────────────────────
// Depends on: game.js (window.SimChess namespace)
$(function () {
    const SC = SimChess;

    SC.formatSeconds = function (totalSeconds) {
        const s   = Math.max(0, parseInt(totalSeconds || 0, 10));
        const m   = Math.floor(s / 60);
        const sec = s % 60;
        return m + ':' + String(sec).padStart(2, '0');
    };

    SC.updateClockDisplay = function (color, seconds) {
        $('#' + color + '-clock').text(SC.formatSeconds(seconds));
        if (seconds <= 60 && seconds > 0) {
            $('#' + color + '-clock').addClass('clock-warning');
        } else {
            $('#' + color + '-clock').removeClass('clock-warning');
        }
    };

    SC.startPlayerClock = function (color) {
        if (color === 'white' && !SC.whiteClockRunning) {
            SC.whiteClockRunning = true;
            $('#white-clock-container').addClass('active');
            $('#white-clock-status').removeClass('hidden');
            SC.whiteClockInterval = setInterval(function () {
                SC.whiteTimeSeconds = Math.max(0, SC.whiteTimeSeconds - 1);
                SC.updateClockDisplay('white', SC.whiteTimeSeconds);
                if (SC.whiteTimeSeconds <= 0) {
                    SC.stopPlayerClock('white');
                    SC.handleTimeOut('white');
                }
            }, 1000);
        } else if (color === 'black' && !SC.blackClockRunning) {
            SC.blackClockRunning = true;
            $('#black-clock-container').addClass('active');
            $('#black-clock-status').removeClass('hidden');
            SC.blackClockInterval = setInterval(function () {
                SC.blackTimeSeconds = Math.max(0, SC.blackTimeSeconds - 1);
                SC.updateClockDisplay('black', SC.blackTimeSeconds);
                if (SC.blackTimeSeconds <= 0) {
                    SC.stopPlayerClock('black');
                    SC.handleTimeOut('black');
                }
            }, 1000);
        }
    };

    SC.stopPlayerClock = function (color) {
        if (color === 'white') {
            if (SC.whiteClockInterval) { clearInterval(SC.whiteClockInterval); SC.whiteClockInterval = null; }
            SC.whiteClockRunning = false;
            $('#white-clock-container').removeClass('active');
            $('#white-clock-status').addClass('hidden');
        } else if (color === 'black') {
            if (SC.blackClockInterval) { clearInterval(SC.blackClockInterval); SC.blackClockInterval = null; }
            SC.blackClockRunning = false;
            $('#black-clock-container').removeClass('active');
            $('#black-clock-status').addClass('hidden');
        }
    };

    SC.stopAllClocks = function () {
        SC.stopPlayerClock('white');
        SC.stopPlayerClock('black');
    };

    SC.syncClockFromServer = function (whiteSeconds, blackSeconds) {
        if (Math.abs(SC.whiteTimeSeconds - whiteSeconds) > 2) {
            SC.whiteTimeSeconds = whiteSeconds;
            SC.updateClockDisplay('white', SC.whiteTimeSeconds);
        }
        if (Math.abs(SC.blackTimeSeconds - blackSeconds) > 2) {
            SC.blackTimeSeconds = blackSeconds;
            SC.updateClockDisplay('black', SC.blackTimeSeconds);
        }
    };

    SC.initClockFromServer = function (whiteSeconds, blackSeconds) {
        SC.whiteTimeSeconds = whiteSeconds;
        SC.blackTimeSeconds = blackSeconds;
        SC.updateClockDisplay('white', SC.whiteTimeSeconds);
        SC.updateClockDisplay('black', SC.blackTimeSeconds);
    };

    SC.startAbortTimer = function () {
        SC.abortTimer = setInterval(function () {
            if (SC.firstMoveMade) {
                clearInterval(SC.abortTimer);
                SC.abortTimer = null;
                $('#abort-warning-toast').addClass('hidden');
                $('#abort-urgent-toast').addClass('hidden');
                return;
            }
            const elapsed   = Math.floor((Date.now() - SC.gameStartTime) / 1000);
            const remaining = SC.ABORT_TIME - elapsed;
            if (remaining <= 0) {
                clearInterval(SC.abortTimer);
                SC.abortTimer = null;
                SC.stopAllClocks();
                $('#abort-warning-toast').addClass('hidden');
                $('#abort-urgent-toast').addClass('hidden');
                SC.showGameOverModal('Game Aborted', 'No moves made', false, 0);
                SC.allowMoves = false;
            } else if (remaining <= 10) {
                $('#abort-warning-toast').addClass('hidden');
                $('#abort-urgent-toast').removeClass('hidden');
                $('#abort-urgent-countdown').text(Math.ceil(remaining));
            } else if (elapsed >= SC.ABORT_WARNING_TIME) {
                $('#abort-urgent-toast').addClass('hidden');
                $('#abort-warning-toast').removeClass('hidden');
                $('#abort-countdown').text(Math.ceil(remaining) + 's');
            }
        }, 1000);
    };

    SC.startBothClocks = function () {
        SC.startPlayerClock('white');
        SC.startPlayerClock('black');
        if (!SC.gameStartTime && SC.moveHistory.length <= 1) {
            SC.gameStartTime = Date.now();
            SC.startAbortTimer();
        }
    };

    SC.handleTimeOut = function (color) {
        SC.stopAllClocks();
        const winner = color === 'white' ? 'black' : 'white';
        const isWin  = winner === SC.playerColor;
        const title  = isWin ? 'Victory!' : 'Defeat';
        const sub    = winner.charAt(0).toUpperCase() + winner.slice(1) + ' wins on time';
        SC.showGameOverModal(title, sub, isWin, SC.moveHistory.length);
        $('#game-status').html('<h2>Game Over</h2><p><strong>' +
            color.charAt(0).toUpperCase() + color.slice(1) + ' ran out of time!</strong></p>');
        $('#result-message').text(sub);
        $('#game-result').removeClass('hidden');
        SC.allowMoves = false;
        if (SC.socket) {
            SC.socket.emit('time_out', { game_id: SC.gameId, color: color });
        }
    };
});
