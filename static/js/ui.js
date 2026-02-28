// ── Walkthrough, modals, and move history ────────────────────────────────────
// Depends on: game.js (window.SimChess namespace)
$(function () {
    const SC       = SimChess;
    const WT_TOTAL = 5;

    // ── Walkthrough ───────────────────────────────────────────────────────────

    SC.gotoWtStep = function (n) {
        SC.currentWtStep = Math.max(1, Math.min(WT_TOTAL, n));
        $('.walkthrough-step').addClass('hidden');
        $('.walkthrough-step[data-step="' + SC.currentWtStep + '"]').removeClass('hidden');
        $('.step-dot').removeClass('active');
        $('.step-dot[data-dot="' + SC.currentWtStep + '"]').addClass('active');
        $('#wt-prev').prop('disabled', SC.currentWtStep === 1);
        if (SC.currentWtStep === WT_TOTAL) {
            $('#wt-next').text('Got it!');
        } else {
            $('#wt-next').html('Next &rarr;');
        }
    };

    SC.openHelpModal = function () {
        SC.gotoWtStep(1);
        $('#help-modal').removeClass('hidden');
    };

    $('#wt-prev').click(function () { SC.gotoWtStep(SC.currentWtStep - 1); });

    $('#wt-next').click(function () {
        if (SC.currentWtStep === WT_TOTAL) {
            localStorage.setItem('simchess-wt-seen', '1');
            $('#help-modal').addClass('hidden');
        } else {
            SC.gotoWtStep(SC.currentWtStep + 1);
        }
    });

    $(document).on('click', '.step-dot', function () {
        SC.gotoWtStep(parseInt($(this).data('dot')));
    });

    $('#help-button, #help-button-welcome').click(function () { SC.openHelpModal(); });

    $('#close-help-modal').click(function () {
        localStorage.setItem('simchess-wt-seen', '1');
        $('#help-modal').addClass('hidden');
    });

    $('#help-modal').click(function (e) {
        if (e.target === this) {
            localStorage.setItem('simchess-wt-seen', '1');
            $('#help-modal').addClass('hidden');
        }
    });

    // ── Game-over modal ───────────────────────────────────────────────────────

    SC.showGameOverModal = function (title, subtitle, isWin, turnNumber) {
        $('#game-over-title').text(title);
        $('#game-over-subtitle').text(subtitle);
        $('#game-over-turns').text(Math.max(0, (turnNumber || 1) - 1));

        const iconDiv = $('#game-over-icon > div');

        if (isWin) {
            $('#game-over-title')
                .removeClass('from-gray-400 via-gray-300 to-gray-400 from-red-400 via-red-300 to-red-400')
                .addClass('from-yellow-400 via-amber-300 to-yellow-400');
            iconDiv
                .removeClass('from-gray-400 to-gray-500 from-red-400 to-red-500')
                .addClass('from-yellow-400 to-amber-500');
            iconDiv.html('<svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3H5v2h14v-2z"/></svg>');
        } else if (title === 'Defeat') {
            $('#game-over-title')
                .removeClass('from-yellow-400 via-amber-300 to-yellow-400 from-gray-400 via-gray-300 to-gray-400')
                .addClass('from-red-400 via-red-300 to-red-400');
            iconDiv
                .removeClass('from-yellow-400 to-amber-500 from-gray-400 to-gray-500')
                .addClass('from-red-400 to-red-500');
            iconDiv.html('<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>');
        } else {
            $('#game-over-title')
                .removeClass('from-yellow-400 via-amber-300 to-yellow-400 from-red-400 via-red-300 to-red-400')
                .addClass('from-gray-400 via-gray-300 to-gray-400');
            iconDiv
                .removeClass('from-yellow-400 to-amber-500 from-red-400 to-red-500')
                .addClass('from-gray-400 to-gray-500');
            iconDiv.html('<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>');
        }

        setTimeout(function () { $('#game-over-modal').removeClass('hidden'); }, 300);
    };

    $('#game-over-new-game').click(function () { location.reload(); });
    $('#game-over-close').click(function () { $('#game-over-modal').addClass('hidden'); });

    // ── Move history ──────────────────────────────────────────────────────────

    SC.updateNavigationButtons = function () {
        $('#move-first').prop('disabled', SC.currentMoveIndex <= 0);
        $('#move-prev').prop('disabled',  SC.currentMoveIndex <= 0);
        $('#move-next').prop('disabled',  SC.currentMoveIndex >= SC.moveHistory.length - 1);
        $('#move-last').prop('disabled',  SC.currentMoveIndex >= SC.moveHistory.length - 1 || !SC.isViewingHistory);
    };

    SC.highlightMoveInList = function (index) {
        $('.move-item').removeClass('bg-blue-500/30');
        $('.move-item[data-index="' + index + '"]').addClass('bg-blue-500/30');
    };

    SC.viewHistoryMove = function (index) {
        if (index >= 0 && index < SC.moveHistory.length) {
            SC.isViewingHistory = true;
            SC.board.position(SC.moveHistory[index].fen);
            SC.updateNavigationButtons();
            SC.highlightMoveInList(index);
        }
    };

    SC.addMoveToHistory = function (moveData) {
        SC.moveHistory.push(moveData);
        SC.currentMoveIndex = SC.moveHistory.length - 1;
        SC.updateMoveList();
        SC.updateNavigationButtons();
    };

    SC.updateMoveList = function () {
        const visible = SC.moveHistory.filter(function (m) { return m.turn > 0; });

        if (visible.length === 0) {
            $('#move-list').html('<p class="text-blue-300/50 text-center py-4">No moves yet</p>');
            return;
        }

        const fmt = function (realized, intended) {
            if (!intended || intended === realized) {
                return '<span class="text-blue-100">' + realized + '</span>';
            }
            return '<span class="text-blue-100 border-b border-dotted border-blue-400/50 cursor-help" title="Intended: ' + intended + '">' + realized + '</span>';
        };

        const html = visible.map(function (move) {
            const idx = SC.moveHistory.indexOf(move);

            if (move.isIllegal) {
                const wi = (move.intended && move.intended.white) || move.white || '?';
                const bi = (move.intended && move.intended.black) || move.black || '?';
                return '<div class="move-item block text-xs text-red-300/80 hover:bg-red-900/20 py-1 px-2 border-b border-red-500/10 cursor-pointer" data-index="' + idx + '">' +
                       '<span class="mr-2">' + move.turn + '.</span>' +
                       '<span class="line-through opacity-70">' + wi + '</span>' +
                       '<span class="mx-1 text-gray-500">|</span>' +
                       '<span class="line-through opacity-70">' + bi + '</span>' +
                       '<span class="block text-[10px] text-red-400 mt-0.5">' + (move.reason || 'Illegal Attempt') + '</span>' +
                       '</div>';
            }

            const w = move.white || '';
            const b = move.black || '';
            let t = '<span class="text-blue-300/70">' + move.turn + '.</span> ';
            t += fmt(w, move.intended ? move.intended.white : null);
            if (b) t += ' ' + fmt(b, move.intended ? move.intended.black : null);
            return '<span class="move-item inline-block py-1 px-2 hover:bg-blue-500/20 rounded cursor-pointer mr-2" data-index="' + idx + '">' + t + '</span>';
        }).join('');

        $('#move-list').html(html);

        const el = document.getElementById('move-list');
        el.scrollTop = el.scrollHeight;

        $('.move-item').click(function () {
            const i = parseInt($(this).data('index'));
            SC.currentMoveIndex = i;
            SC.viewHistoryMove(i);
        });
    };

    $('#move-first').click(function () {
        if (SC.moveHistory.length > 0) { SC.currentMoveIndex = 0; SC.viewHistoryMove(0); }
    });
    $('#move-prev').click(function () {
        if (SC.currentMoveIndex > 0) { SC.currentMoveIndex--; SC.viewHistoryMove(SC.currentMoveIndex); }
    });
    $('#move-next').click(function () {
        if (SC.currentMoveIndex < SC.moveHistory.length - 1) { SC.currentMoveIndex++; SC.viewHistoryMove(SC.currentMoveIndex); }
    });
    $('#move-last').click(function () {
        if (SC.moveHistory.length > 0) {
            SC.currentMoveIndex = SC.moveHistory.length - 1;
            SC.viewHistoryMove(SC.currentMoveIndex);
            SC.isViewingHistory = false;
            SC.updateNavigationButtons();
        }
    });
});
