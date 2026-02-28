> **Note on this document:** This is the Revised Full Draft (Week 7) for CP193/CP194. It supersedes the Full Draft submitted on December 13, 2025. All material carries forward unless explicitly updated. New or substantially revised content is noted with **[NEW]** or **[UPDATED]** in section headings.
>
> **Suggested figures to add before final submission:**
> - Figure replacing old Figure 5 (Render screenshot) → replace with DigitalOcean droplet/domain screenshot showing `simchess.tech` live with 100% uptime
> - Figure in HC/LO section showing the Huly tracker updated with Spring tasks
> - Any new UI screenshot showing the walkthrough modal and polished design

---

# Cover Sheet

**Name:** Elbion Redenica
**Current assignment:** Revised Full Draft
**Capstone title:** SimChess
**Submission date:** February 27, 2026

**Abstract:** This project introduces SimChess, a novel chess variant centered on simultaneous move submission, fostering gameplay rich in prediction, uncertainty, and psychological depth beyond traditional sequential chess. Core to SimChess are unique rules designed for automated arbitration, specifically addressing conflicting move intentions and expanding victory conditions to include immediate King capture mechanics alongside traditional checkmate. The scope of this Capstone focuses on two key stages: (1) the rigorous definition of the SimChess ruleset, including novel high-entropy mechanics; and (2) the engineering of a functional online platform enabling human-vs-human play with automated enforcement of these rules. This web-based ecosystem features a custom dual-clock timing system and an "intended vs. realized" move history log to audit the complex state management of simultaneous play. Stages 3 and 4 (computational engine and ML assistant) have been formally scoped out as capstone-scale projects in their own right; this Capstone delivers a complete, professional-grade platform for Stages 1 and 2.

**Confirmations:**
- E.R. I have read the Capstone Handbook.
- E.R. I have updated my Capstone information in this sheet using this form.
- E.R. I understand the systems/processes that my group will be using.

---

## Links to working files

| Resource | Link |
|---|---|
| Main folder(s) | Elbion |
| Paper/writeup | [Capstone: YACV: Simultaneous Chess — Live Doc] |
| Slides, images | Please check the slides in the main folder |
| GitHub | https://github.com/elbionredenica/simchess |
| Planning & progress tracking workspace | https://huly.app/workbench/simchess/ |
| **[UPDATED] Deployed web-app** | **https://simchess.tech** |

---

## [UPDATED] Since the last assignment was submitted

### Summary of all changes and progress

Since the Full Draft submission (December 13, 2025), the primary focus has been on infrastructure reliability, codebase quality, and external validation.

- **[NEW] Infrastructure migration** | Migrated from Render's free PaaS tier (subject to 15-minute inactivity sleep) to a Virtual Private Server (VPS) on DigitalOcean, secured through the GitHub Student Developer Pack. The platform now runs at a custom domain, `simchess.tech`, with 24/7 persistent uptime. This eliminates the cold-start latency that was previously described as "unacceptable for a real-time game."
- **[NEW] Custom domain** | Registered and configured `simchess.tech` via Namecheap, also through the GitHub Student Developer Pack. DNS is pointed to the DigitalOcean droplet. HTTPS is enforced via Nginx + Let's Encrypt.
- **[NEW] Codebase modularization (continued)** | Completed the modularization effort described as "still room for more" in the Full Draft. The monolithic `game_engine.py` (legacy, 603 lines) was deleted. The frontend JavaScript was refactored from a single 1,016-line closure into five focused modules (`game.js`, `clocks.js`, `board.js`, `ui.js`, `socket.js`) using a shared `window.SimChess` namespace. The Python backend now uses a proper `create_app()` factory pattern. This directly addresses `#cs162-separationofconcerns`.
- **[NEW] UI polish** | Added an interactive walkthrough modal that auto-shows on first visit, URL-based game sharing (`simchess.tech/join/<game_id>`), and several UX fixes (header game ID display, flicker-free board transitions, responsive copy buttons).
- **[NEW] External expert consultation** | Met with my former chess coach (external expert) for a 30-minute session. He reviewed the finalized ruleset, expressed no issues with the mechanics, and we played a short demonstration game together. He confirmed the rules are coherent and the platform behaves as designed.
- **[UPDATED] Formal scoping of Stages 3 & 4** | After researching what a computational SimChess engine and ML assistant would realistically require (see "Scoping for Quality" below), I have formally concluded these are out-of-scope for this Capstone. The deliverable is a complete, professionally deployed platform for Stages 1 and 2.

### Brief reflection on progress and process

The Spring phase has been defined by two themes: eliminating friction and formalizing decisions. The infrastructure migration from Render to DigitalOcean removed the largest remaining practical barrier to testing — you can now open `simchess.tech` and immediately play. It is a small operational change with an outsized psychological effect: it transforms the project from "a prototype you have to coax into waking up" into "a real thing." The codebase modularization, similarly, was not about adding features but about making the existing system trustworthy. When you can read `socket.js` and understand that it only handles real-time events, you gain confidence that a change there cannot corrupt clock logic in `clocks.js`.

The external expert session was validating in a different way. It confirmed that the ruleset, which I have iterated on for over a year, is comprehensible and interesting to a high-level chess player encountering it for the first time. The fact that he found no gaps or contradictions in a 30-minute session is meaningful evidence of ruleset completeness.

On scoping: I have resisted the urge to treat the formal scope-out of Stages 3 and 4 as a failure. The research I conducted (documented in "Scoping for Quality") revealed that each stage is a serious research contribution in its own right. Delivering two rigorous, well-implemented stages well exceeds the original minimum viable scope.

### Feedback implemented

- **Emoji removal** | Removed the 😭 emoji from the engineering challenges section and the section title has been revised to better reflect academic tone.
- **Rule 2.5 naming** | Reconsidered the "Rule 2.5" nomenclature. The rule has been re-presented as Section 3.2 ("Target Escaped") throughout, eliminating the awkward half-integer label.
- **"Cyclic" clarification** | The one-sided illegality penalty description now explicitly states that the counter resets to zero after each penalty is applied, and penalties can accumulate across the game without a ceiling.
- **Stalemate clarification** | Added a note acknowledging the "mating net preservation" tactic raised in feedback.
- **Piece capture clarification** | Added explicit language clarifying that in a "target escaped" scenario, both pieces successfully complete their moves — the capturing piece lands on the vacated square and the escaping piece lands on its intended square.
- **HC/LO elaboration** | Each HC/LO entry has been expanded to several paragraphs. The list has been restructured into Completed, In-progress, and Planned subsections.
- **#utility and #probability dropped** | Removed from the active HC list; moved to the backup list alongside other Stage 3/4 dependent items.
- **#modeling updated** | Reframed as applying to the ruleset formalization itself, not just Stage 3/4.
- **#descriptivestats** | Dropped from the active list. Addressed in the scoping section.

### Request for feedback on specific areas

- **External outreach plan** | My external expert and I sketched a next step: begin reaching out to the chess community (Reddit, chess.com forums, chess-specific Discord servers) to gauge interest and solicit test players for the final submission period. I would value your perspective on how to frame and prioritize this.
- **Formal stage scoping** | The research-backed justification for dropping Stages 3 and 4 is new material. Please let me know whether the level of detail is sufficient, or if a deeper technical analysis would strengthen the scoping argument.
- **HC/LO depth** | I have substantially expanded the HC/LO section per feedback. I would value confirmation that the new depth level meets the expectation.

### [UPDATED] AI Statement

- I used GitHub Copilot (VS Code) extensively during the infrastructure migration and codebase modularization phases. The agent assisted with code restructuring, debugging Socket.IO event handlers, and writing boilerplate for the new module pattern. All architectural decisions and design choices remain my own; Copilot contributed at the implementation level.
- I used Gemini to help organize early sections of process documentation, consistent with prior disclosure.
- I have not used any LLM to generate the written narrative of this document. All text reflects my own analysis, experience, and reflection.

---

# SimChess: Engineering an Automated Arbitration Engine for Simultaneous Games

**Elbion Redenica**
Minerva University | Capstone Project
Advisor: Prof. Tambasco | Second Reader: Prof. Levitt
Revised Full Draft — February 27, 2026

---

## Table of Contents

1. Executive Summary
2. Academic Abstract
3. Capstone Work Product
   - A. The SimChess Ruleset (v1.0) & Technical Specification
   - B. Technical Implementation
4. Process Documentation
5. Management & Tracking
6. (No)AI
7. Scoping for Quality
8. HC/LO

---

## Executive Summary

### The problem

For centuries, chess has been a conversation: White speaks, Black replies. While this sequential structure is classic, it suffers from two inherent flaws. First, White holds a statistical "first-move advantage." Second, in the modern era of super-computers, the early game has become a test of memorization rather than creativity. Players often recite "book moves" for the first 15 turns before the real game begins.

### The solution

SimChess removes the turns. It is a new chess variant where both players submit their moves simultaneously. The board state is revealed only after both players have committed, introducing uncertainty and lack-of-information elements to the strategy. You know the board as it is now, but you must predict where your opponent intends to be. This shifts the skill set from pure calculation to psychological prediction and risk management.

### SimChess

This Capstone documents the process of defining and engineering a fully playable, web-based platform with specific mechanics to handle the chaos of simultaneous play. Unlike standard chess apps that simply record turns, SimChess required the development of a custom automated arbitration engine. This system instantly detects and resolves conflicting move intentions — e.g., two pieces claiming the same square — ensuring that the game produces fair, consistent results even when players' plans collide. The project evolved into a comprehensive digital ecosystem, featuring a specialized dual-clock timing system and a responsive interface that tracks the divergence between a player's intended moves and the realized outcome on the board. This infrastructure transforms a theoretically complex variant into a seamless, competitive online experience.

### [UPDATED] Status

The SimChess platform is live and permanently deployed at **simchess.tech**. It features a complete rules engine, a responsive and user-friendly interface, and a novel "Move History" log that tracks the difference between what a player intended to do versus what actually happened on the board. The platform runs on a Virtual Private Server (DigitalOcean), with no sleep/wake cycle — it is available 24/7. The ruleset is finalized (v1.0). The platform has been validated in live play with the external expert.

### [UPDATED] Final thoughts & next steps

SimChess is a re-imagining of board game physics. By converting a sequential game into a simultaneous one, the advantage of memorization is stripped away, returning the game to a battle of raw intuition and psychological strategy. The immediate next phase is community outreach: reaching out to chess communities on Reddit (r/chess, r/chessvariant), chess.com forums, and chess Discord servers to recruit players for real-world testing. This will generate qualitative feedback on the gameplay experience and surface any remaining edge cases, feeding directly into the final submission.

---

## Academic Abstract

This project introduces SimChess, a novel chess variant centered on simultaneous move submission, fostering gameplay rich in prediction, uncertainty, and psychological depth beyond traditional sequential chess. Core to SimChess are unique rules designed for automated arbitration, specifically addressing conflicting move intentions and expanding victory conditions to include immediate King capture mechanics alongside traditional checkmate. The scope of this Capstone focuses on two key stages: (1) the rigorous definition of the SimChess ruleset, including novel high-entropy mechanics; and (2) the engineering of a functional online platform enabling human-vs-human play with automated enforcement of these rules. This web-based ecosystem features a custom dual-clock timing system and an "intended vs. realized" move history log to audit the complex state management of simultaneous play. Stages 3 and 4 (computational analysis engine and ML assistant) have been formally scoped out as independent research projects; they are documented in the scoping section but are not deliverables of this Capstone.

**Keywords:** chess, asynchronous state resolution, pseudo-legal move validation, game theory (simultaneous games), client-server synchronization.

---

## Capstone Work Product

### A. The SimChess Ruleset (v1.0) & Technical Specification

*Note to reader: The ruleset described here is finalized. All mechanics have been implemented and validated in the live platform. The following specification assumes proficiency in orthodox chess — piece movements, notation, and standard terms (check, checkmate, stalemate) are not re-explained.*

#### 1. Core philosophy

SimChess is a simultaneous information game derived from orthodox chess. Unlike the sequential nature of traditional play (Turn A → Turn B), SimChess utilizes a **synchronized resolution cycle**. Both players submit intentions without knowledge of the opponent's pending action. The game state advances only after both intentions are revealed and arbitrated simultaneously.

This structure necessitates a shift from strict legality (preventing illegal states before they happen) to **pseudo-legality** (allowing dangerous states to occur, then resolving the consequences).

*Please check Table 1 in the Appendix for an extended glossary.*

#### 2. The game loop

A single "turn" in SimChess differs structurally from orthodox chess. It is defined by the **atomic resolution protocol**:

1. **Intention phase** | Both players inspect the current board state $S_0$.
2. **Submission** | White submits intention $I_w$; Black submits intention $I_b$. These are hidden from the opponent.
3. **Arbitration** | The engine validates $I_w$ and $I_b$ against $S_0$.
   - *Conflict check* | Do the moves target the same square? Do paths cross?
   - *Legality check* | Are the moves pseudo-legal?
4. **Resolution**
   - *Valid* | The board updates to state $S_1$.
   - *Invalid* | The board reverts to $S_0$, and respective illegality counters are incremented.

*Please check Figure 3 in the Appendix for a comprehensive diagram flow.*

#### 3. Movement & capture mechanics

##### 3.1. Pseudo-legality & The high-entropy ("gambling") rule

In orthodox chess, a move that exposes the King to check is strictly illegal and cannot be played. In SimChess, players are permitted to make **pseudo-legal moves**:

- A player may move a pinned piece.
- A player may move their King into an attacked square.

**Rationale:** This enables "bluffing." A player may gamble that the opponent will not capitalize on the exposure. If the gamble fails (the opponent does capture the King), the game ends immediately (see victory conditions). If the gamble succeeds — the opponent does not attack the exposed King — then the player's dangerous move stands and both players' moves resolve normally.

##### [UPDATED] 3.2. Target escaped

A unique physics problem arises when a piece attacks a square that the target simultaneously vacates.

- **Piece captures (Knight, Rook, Bishop, Queen, King)** | If a piece intends to capture at square $X$, but the target at square $X$ moves to square $Y$, the capturing piece successfully lands on the now-empty square $X$. Simultaneously, the target piece successfully lands on its intended square $Y$ — both moves resolve. Neither piece is captured.

- **Pawn captures** | If a Pawn intends to capture diagonally at square $X$, but the target moves away, the move fails (results in a mutual illegality). The Pawn capture is void for this turn.

**Rationale:** Pawns physically require a target to move diagonally. Without the target, the diagonal advance is invalid. Standard piece jumps, by contrast, are committed to their destination square regardless of whether the captured piece remains.

#### 4. Arbitration

##### 4.1. Mutual illegality

Defined as an event where both players' intentions conflict or fail simultaneously (Figure 2).

- **Scenario** | Both pieces move to the same square; sliding pieces cross paths; or reciprocal capture (Scandinavian paradox); or a Pawn attempts a target-escaped diagonal.
- **Consequence** | The game state rolls back to the start of the turn. The mutual illegality counter increments by 1.
- **Draw condition** | If the mutual illegality counter reaches 3 within a single turn, the game ends in a draw.

##### [UPDATED] 4.2. One-sided illegality

Defined as an event where Player A submits a legal intention, but Player B submits an illegal one (e.g., a Pawn capturing an empty diagonal square when no target is present).

- **Consequence** | The game state rolls back. Player B's one-sided illegality counter increments.
- **Penalty** | If the counter reaches 3 at any point during the game, Player B suffers a 30-second time penalty and the counter **resets to zero**. This cycle repeats without a ceiling — a player who accumulates 6 one-sided illegalities across the game incurs two separate 30-second penalties. The mechanism is intentionally cyclic: it functions as a recurring cost for repeated exploitation, not a once-per-game deterrent.

#### 5. Victory conditions

##### 5.1. Checkmate / King capture

Achieved through either a definitive checkmate or the physical capture of the King.

- **Checkmate** | If, following the resolution phase, a player's King is in check and no pseudo-legal escape moves exist (orthodox-style checkmate applied to the resolved position), the game ends immediately in a win for the attacker.
- **King capture** | Due to the allowance of pseudo-legal moves (see Section 3.1), a player may expose their King to capture by moving a pinned piece or failing to anticipate an attack. If a player's intention results in their King being captured during resolution, the capturing player wins immediately.

##### 5.2. Time out

SimChess utilizes a dual-interval clock. Both players' times decrease simultaneously during the intention phase and stop decreasing individually upon move submission within a turn. If a player's clock reaches 0:00, they lose immediately.

##### [UPDATED] 5.3. Stalemate

Because SimChess allows pseudo-legal moves (i.e., "suicide"), traditional stalemate (no legal moves but safe) is virtually impossible. A player in a stalemated position in orthodox chess almost always has the option in SimChess to move their King into an attacked square, which results in a loss rather than a draw.

A related tactical observation: in positions approaching a mating net, the attacking side can often sustain the winning position without requiring the defender to cooperate. Because the defender's King must move each turn — and has no available escape square that is not attacked — the attacker simply needs to maintain the net rather than force a specific sequence. The defending player effectively "walks into" the checkmate through their own available moves. This makes SimChess checkmates somewhat easier to achieve than in orthodox chess once the mating net is established, a consequence of the high-entropy environment.

---

### Appendix

*(Figures 2, 3, and Table 1 carried forward from Full Draft — see original PDF for visual assets.)*

**Table 1. Glossary of Terms** — see original document; no changes.

---

### B. Technical Implementation

[UPDATED] The SimChess platform is currently live and accessible at **https://simchess.tech**.

#### 1. High-level architecture

SimChess operates on a **client-server model** where the server acts as the authoritative game master. The clients act as input terminals for intentions:

- **The client (browser)** | Handles user interaction, board rendering, and local move validation. It sends intentions to the server via WebSockets.
- **The server (Flask)** | Maintains the true state of the game. It waits for both intentions, resolves them simultaneously according to the SimChess ruleset (arbitration), and broadcasts the resulting state back to both clients.

#### 2. [UPDATED] Technology stack

| Component | Technology choice |
|---|---|
| Frontend framework | Plain HTML/JS (with jQuery for DOM manipulation & Tailwind CSS) |
| Backend server | Python (Flask) with `create_app()` factory pattern |
| Real-time communication | Socket.IO (Flask-SocketIO on server, socket.io-client on browser) |
| Chess logic | `python-chess` (backend) & `chess.js` (frontend) |
| UI component | chessboard.js (visual board rendering) |
| **[UPDATED] Hosting** | **DigitalOcean VPS (Droplet) — persistent 24/7 uptime** |
| **[NEW] Domain** | **simchess.tech (via Namecheap, GitHub Student Developer Pack)** |
| **[NEW] Web server** | **Nginx (reverse proxy) + Gunicorn (WSGI) + Certbot (HTTPS)** |
| Storage | In-memory (Python dictionary for active game states) |

#### 3. [UPDATED] Implementation details

**State management & authority**

The server holds the `SimChessGame` object, which generates the true state (FEN string). The server stores pending moves in a temporary `moves` dictionary. These are never sent to the opponent until the arbitration phase is complete.

**The Socket protocol**

An event sent by the client when a player acts is captured by `intention_submit`. The server validates that it is a properly formatted move string but does not apply it to the board yet. It replies with a "waiting for opponent" status. Then, `game_update` is broadcast by the server only after both intentions are received and resolved. This payload contains the new FEN, the last moves played (for UI highlighting), and updated clock times.

**Library integration**

For the backend (`SimChessBoard`), the standard `python-chess` library was extended by creating a custom subclass. The `is_legal()` method was overridden to call `is_pseudo_legal()` instead. This allows the engine to accept moves that orthodox chess would reject.

**[NEW] Backend modularization**

The backend has been restructured with a proper Flask application factory. `app.py` exposes a `create_app()` function; socket logic lives in `sockets.py`; routing logic lives in `routes.py`; the game engine lives in the `engine/` package. This allows clean deployment via Gunicorn (`app:create_app()`) and eliminates circular import issues. The legacy monolithic `game_engine.py` has been deleted.

**[NEW] Frontend modularization**

The frontend JavaScript was refactored from a single 1,016-line closure into five focused modules using a shared `window.SimChess` namespace:

| Module | Responsibility |
|---|---|
| `game.js` | Namespace definition, entry point, lobby + game-action handlers |
| `clocks.js` | All clock/timer logic, abort timer, timeout handling |
| `board.js` | Chessboard initialization, drag-drop, auto-promotion |
| `ui.js` | Walkthrough modal, game-over modal, move history panel |
| `socket.js` | WebSocket connection, all real-time event handlers |

---

## Process Documentation

*This documentation is organized thematically, following the structure proposed in the Capstone Handbook. It documents all effort that went into producing the work product.*

### The design phase: defining "simultaneous"

*(Carried forward unchanged from Full Draft — covers the origin of the idea in SS144, consultation with Prof. Morgan, and the formation of the advising team.)*

---

### Gap analysis: Parrow's chess and alternatives

*(Carried forward unchanged from Full Draft — covers Parrow's Chess, the "controlled squares" and "frozen piece" rules, the Rich Hutnik forum post, the academic literature gap, and the external expert validation.)*

---

### The ruleset engineering (iterative design)

*(Episodes 1–4 carried forward unchanged from Full Draft — covers the Scandinavian Paradox, one-sided illegality discovery, the checkmate/stalemate setback, and the consolidation phase.)*

---

### [UPDATED] Engineering challenges

The transition from designing rules to coding them was not a simple translation task. It required fighting against the very tools designed to build chess games, as most libraries are built with the assumption that turns are sequential and moves are strictly legal. This section details the significant technical hurdles encountered and the architectural decisions made to resolve them.

#### The strict legality constraint

One of the earliest and most fundamental roadblocks was fighting the backend library itself. I utilized `python-chess` for the server-side logic — an incredibly robust library for standard chess that provides move generation, validation, FEN parsing, and board state management. However, its robustness became the biggest problem, because it is designed to prevent illegal moves at all costs. The library will crash or raise fatal errors if a player attempts to move a pinned piece or leave their King in check. In orthodox chess, this is a feature; in SimChess, it is a game-breaking constraint.

My entire game design relies on the high-entropy philosophy where players must be able to make these "bad" moves to enable the bluffing mechanic. If the engine prevents you from moving a pinned Knight, the opponent immediately knows your Knight is pinned, and the element of uncertainty vanishes. The moment GitHub Copilot's suggestions stopped working because the library itself was rejecting the proposed state transitions, I realized the problem ran deeper than a code fix — it was an architectural mismatch.

To solve this, I had to effectively reverse-engineer the validation logic of the library. I could not use the standard `board.push()` method. Instead, I subclassed the board object and overrode the standard `is_legal()` method to point to `is_pseudo_legal()` instead. This was a significant architectural change because it bypassed all the built-in safety checks that prevent the game state from becoming corrupt. I had to manually write new safety layers to handle the "death" logic during the arbitration phase, ensuring that while the engine accepts a suicidal move without crashing, it correctly identifies the consequences during resolution.

#### The geometry of collision

Another unique challenge was teaching a computer what "collision" means. Standard chess libraries operate on a simple "start square" to "end square" logic. They do not calculate "transit" because, in sequential chess, pieces never move at the same time. The library had no way of knowing if a Bishop starting at a1 and a Rook starting at h8 would "crash" into each other on square d4. When I first ran the simultaneous resolution, pieces would simply phase through each other like ghosts, landing on their destination squares as if the opponent didn't exist. This broke the physics of the game entirely, particularly where a Pawn's ability to capture is physically dependent on the target staying still.

I had to implement a custom physics layer on top of the existing chess logic. This involved writing a geometric algorithm that calculates the full coordinate path of every sliding piece before a move is finalized. Before the server resolves a turn, the arbitration engine generates the coordinate arrays for both intended moves and compares them index by index. If the arrays intersect at the same square, or if they "cross over" in a way that implies a collision, the engine flags a "mutual illegality" and triggers a rollback. This was not just a coding challenge but a mathematical one, requiring an explicit definition of every square's coordinates to detect intersections that the standard library completely ignored.

#### [UPDATED] Deployment: from Render to DigitalOcean

The deployment of the application exposed the fragility of the PaaS hosting architecture. Render's free tier imposed a 15-minute inactivity sleep that made real-time gameplay effectively impossible for casual users who arrived at a sleeping instance — wait times of up to 2 minutes before a WebSocket game can start.

The resolution came through the GitHub Student Developer Pack: DigitalOcean provides $200 in student credits, and Namecheap provides a free domain registration. Together, these allowed a full production-grade deployment:

1. **DigitalOcean Droplet (VPS)** — a 1GB RAM Ubuntu 24.04 server running 24/7. The instance never sleeps.
2. **Gunicorn + eventlet** — the WSGI server runs the Flask application with eventlet for async WebSocket support.
3. **Nginx** — serves as a reverse proxy, forwarding HTTP/WebSocket traffic to the Gunicorn process, and handles SSL termination.
4. **Certbot (Let's Encrypt)** — provisions a free TLS certificate, so the app is served over HTTPS at `https://simchess.tech`.

The migration removed the last major friction point between a user and a live game of SimChess. The platform is now meaningfully "production-ready" for the purposes of community testing.

*[FIGURE: Add a screenshot here showing simchess.tech in a browser with the DigitalOcean droplet console confirming uptime, or simply the live platform at the domain. This replaces the old Figure 5 (Render screenshot.)]*

#### [NEW] External expert validation session

Following the deployment migration, I held a 30-minute session with my former chess coach (external expert) via video call. The session served two purposes: a ruleset review and a live demonstration. We walked through the finalized rules document together, and he raised no objections to any mechanics. The one point he found interesting was the stalemate ruling — he observed (consistent with the advisor's note) that in near-checkmate positions, the attacker simply needs to maintain the mating net rather than plan a specific sequence, because the defender is forced to walk into it. We played a short game on the live platform; both players could submit moves and see the simultaneous resolution working in real time. His overall assessment was that the platform functions as designed and the rules are coherent.

For next steps, we discussed reaching out to chess communities online — specifically r/chess, r/chessvariant, chess.com's "Chess Variants" forum, and chess-focused Discord servers — to recruit players willing to test the variant and provide feedback. This outreach is planned for the final submission period.

---

### Management & Tracking

*(Carried forward from Full Draft — covers the transition from physical journaling to Huly.io, the use of Documents and Tracker modules, and the Sprint-style task management.)*

The Huly workspace has been updated with a new Spring milestone, tracking the DigitalOcean migration, codebase modularization, and external expert session as completed tasks, and community outreach as the active milestone.

---

### (No)AI

*(Carried forward from Full Draft with the following update.)*

The AI tooling landscape for this project has stabilized. GitHub Copilot on VS Code has continued to be the primary coding assistant, contributing meaningfully especially during the infrastructure configuration phase (nginx configuration, Gunicorn deployment scripts, SSL setup) and the JS modularization. The tool works well for implementation tasks where the architecture is already decided; it is less useful for the design-level thinking that defines this project.

The abandoned ChatGPT dedicated account approach described in the Full Draft has not been revisited. Gemini Pro was used for early-semester documentation organization. I have not found an LLM tool that handles the domain-specific nuance of SimChess well enough to trust for anything beyond light editing or code generation.

An MCP server for the Capstone remains a "nice to have" side quest that has not been prioritized, consistent with the earlier note in the Full Draft.

---

## [UPDATED] Scoping for Quality

Per the feedback principle of "great Stages 1 and 2 versus mediocre Stages 1, 2, 3, and 4," the decision to scope out Stages 3 and 4 is now formalized and supported by substantive research. This section documents what those stages would actually require and why they are outside the reasonable scope of a single undergraduate Capstone.

### Stage 3: Computational Analysis Engine

A SimChess engine would need to evaluate board positions and suggest optimal moves in a simultaneous-move game. This is a fundamentally harder problem than orthodox chess engines, for the following reasons:

**Game-theoretic structure.** In sequential chess, each position is a single-agent decision tree: you know whose turn it is, and you search for the best move. In SimChess, each "node" in the search tree is a **bimatrix game** — both players choose simultaneously, and the "optimal" strategy is not a single best move but a mixed-strategy Nash equilibrium. Existing chess engines (Stockfish, Leela) cannot be adapted for this; you would need to implement algorithms from simultaneous-game theory, such as the double-oracle algorithm or counterfactual regret minimization.

**Evaluation function design.** Standard chess evaluation functions rely on decades of human grandmaster intuition encoded into piece-square tables, pawn structure bonuses, and king safety penalties. None of those heuristics transfer directly to SimChess, where king safety calculations change fundamentally because the opponent's move is unknown. Designing a meaningful evaluation function for SimChess positions would require either: (a) a significant number of recorded SimChess games to learn from, which don't yet exist in meaningful volume, or (b) a theoretical framework for quantifying positional advantage under simultaneous uncertainty, which would itself be a research paper.

**Implementation scope.** An orthodox chess engine in Python from scratch is a common advanced undergraduate project — it takes a semester. A SimChess engine is not a linear extension of that; the search tree structure is qualitatively different. Conservatively, this would require 6–12 months of focused development by someone familiar with both game tree search and simultaneous game theory. It is a Master's thesis candidate.

### Stage 4: Personalized ML Assistant

A personalized opponent-modeling assistant would predict an individual opponent's likely move given their history. This would require:

**Dataset.** A minimum viable dataset for training an opponent model would require thousands of recorded SimChess games per opponent, or at the very least, hundreds of games with labeled move intentions to learn from. This dataset does not exist. SimChess has not been played at scale anywhere.

**Modeling approach.** The most reasonable approach would be a Bayesian inference model that maintains a prior over the opponent's "style" (aggressive, conservative, bluffing-prone) and updates it after each turn. Alternatively, a recurrent neural network could encode the game sequence and predict the next move. Either approach requires substantial ML engineering — feature engineering for SimChess-specific board states, model training and validation pipelines, and a serving infrastructure integrated with the web app.

**Chicken-and-egg problem.** The assistant requires game data; game data requires a player community; a player community requires the platform to be established and used for an extended period. The ML assistant cannot be meaningfully built before the community testing phase produces a corpus of games. It is entirely dependent on the success of Stage 2, and that dependency makes it a follow-on project, not a parallel one.

### Conclusion on Scope

Stages 1 and 2 deliver: a formally specified, complete ruleset and a permanently deployed, professionally engineered platform for human-vs-human play. That is a coherent, complete contribution. Stages 3 and 4 are each graduate-level research projects that benefit from — and are blocked by — the success of the first two stages. The appropriate framing is that this Capstone creates the foundation that makes Stages 3 and 4 possible in the future, not that it intends to build them itself.

The immediate next deliverable for the Capstone is community outreach: making `simchess.tech` known to the chess variant community, gathering player feedback, and documenting any remaining edge cases discovered through real-world play.

---

## HC/LO

### Reflection

Reflecting on the project as a whole, the most significant intellectual shift has been from treating SimChess as a creative design exercise to treating it as a systems engineering challenge. Early on, the ruleset felt like inspired game design, a set of clever ideas. The engineering reality forced a different discipline. Every "clever idea" had to be specified precisely enough to become an algorithm, and every algorithm had to be tested against adversarial inputs.

The infrastructure migration this semester illustrated the same principle at the DevOps level. "Deploy on Render" was a clever quick fix in November. "Migrate to a VPS with Nginx, Gunicorn, Certbot, and a custom domain" is an engineering solution—more work, but it produces a system that behaves predictably. The pattern across this project has been consistent: initial clever ideas get replaced by rigorous systems. That is the core intellectual lesson.

---

### List

HC/LO justifications are now more detailed and targeted. I'm still keeping the narrowed down top 5 LOs from the previous submission. Applications dependent only on the now-formally-scoped-out Stages 3 and 4 have been removed.

---

#### HCs

**#rightproblem**

This HC was applied at the foundational level during the initial framing of SimChess. The problem statement (that sequential chess suffers from first-move advantage and book-move staleness) was not invented post-hoc to justify a technical exercise. It emerged from the SS144 game theory session that sparked the project idea: the observation that classical game theory models simultaneous strategic interactions, and that chess, while defined as sequential, could become simultaneous.

This is most visible in the Executive Summary and the gap analysis section. When Prof. Levitt introduced Parrow's Chess as an existing simultaneous variant, the #rightproblem framing became the test: does Parrow's Chess solve the same problem I identified? The answer was "partially but not in the way I care about." Parrow's mechanics (frozen pieces, controlled squares) reduce the chaotic state space, but at the cost of the bluffing mechanic that is core to my vision. Solving the "right problem" here meant committing to high-entropy mechanics even when they made the engineering harder.

The published ruleset and the live platform address the specific problem: both players are on equal footing at move one, book knowledge provides no advantage, and the game rewards psychological prediction over memorization.

---

**#gapanalysis**

The academic literature on simultaneous chess variants is nearly nonexistent—no peer-reviewed papers, no textbooks, no established frameworks. The gap analysis for SimChess had to be constructed from first principles.

The gap analysis proceeded in two layers. The first layer was a comparison with existing variants: Parrow's Chess (analyzed in depth) and the Hutnik forum post (quickly ruled out). The analysis identified two specific mechanical gaps, (1) the "bluffing mechanic" (which Parrow's frozen-piece rule eliminates) and (2) the "accessible arbitration" (which the token-initiative approach makes too random). The second layer was the expert consultation. Because I could not cite a source saying "Parrow's rules reduce engagement," I had to generate that evidence myself through my former chess coach sessions.

The gap analysis is documented in the Process Documentation (Gap Analysis section). The direct result of the analysis is the #gapanalysis → design decision pipeline: bluffing requires pseudo-legality, which required overriding `is_legal()`, which required the custom `SimChessBoard` subclass.

---

**#breakitdown**

The complexity management of this project has relied fundamentally on decomposition, breaking down an abstract system into implementable components, and breaking down bugs into isolated logical failures.

The clearest illustration is Episode 4 in the process documentation (The Consolidation). The simultaneous checkmate problem appeared as a single crisis, but solving it required breaking it into four separate questions: (a) what does checkmate mean in a simultaneous context (definition); (b) what is the order of operations during resolution (sequence); (c) what does the engine do when a player has zero pseudo-legal moves (infinite loop prevention); and (d) what happens when both players are simultaneously checkmated (edge case). Each sub-question had an independent answer, and the combined solution was the sum of four independent design decisions rather than one clever fix.

At the engineering level, the JS modularization this semester applied the same principle: the 1,016-line `game.js` monolith was broken into five modules along clean functional boundaries. Debugging real-time synchronization bugs became tractable once clock logic lived only in `clocks.js` and socket events lived only in `socket.js`.

The decomposed arbitration engine handles at least a dozen distinct conflict scenarios (same-square collision, path crossing, reciprocal capture, pawn diagonal void, etc.) through a unified "mutual illegality" funnel. The modular codebase reduces the surface area of any single bug.

---

**#algorithms**

The arbitration engine is an algorithm. The collision detection system is an algorithm. The simultaneous clock system is an algorithm. This HC applies at the fundamental implementation level throughout the project.

The most complex algorithmic contribution is the path-intersection detection for sliding pieces. The algorithm works as follows: for each move involving a sliding piece (Bishop, Rook, Queen), the engine computes an ordered coordinate array representing the full transit path from source to destination. Before resolution, the arbitration engine computes both players' paths and checks for intersection in two ways: (1) endpoint overlap (both pieces intending the same destination square) and (2) path crossing (paths that share an intermediate square with index pairings that imply simultaneous presence). The latter case, where piece A is at coordinate i of its path and piece B is at coordinate j of its path when i=j and the squares match, was the more subtle mathematical problem.

A secondary algorithmic contribution is the transactional move resolution. Before the "cannibal queen" bug was fixed, moves were applied sequentially to a mutable board state. The fix implemented a snapshot-based approach: all consequences (captures, destination squares, path blockers) are calculated against the *immutable* board state at T=0, and only then are all effects applied atomically to produce $S_1$.

The arbitration engine passes all manually designed test cases including: Scandinavian paradox, pawn diagonal void, crossing Rooks from corners, path-crossing with mutual occupation, King capture during bluff, and checkmate at T=0.

---

**#constraints**

This project has operated under layered constraints: technical (chess libraries designed for sequential play), temporal (Capstone deadline, weekly deliverables), resource (no budget, free-tier tooling), and scope (four ambitious stages, one developer, one year).

The most consequential constraint was the `python-chess` library's strict legality enforcement. Rather than abandoning the library (which would have required re-implementing move generation, FEN parsing, and board state management from scratch), the solution respected the constraint but worked around it via subclassing. This is a general engineering principle: constraints are cheaper to circumvent than to remove, when circumvention preserves the benefits of the constrained system.

The scope constraint shaped every major decision. The decision to drop Stages 3 and 4 is the most recent application: having researched what each stage would require (several hundred hours of focused work per stage, dataset prerequisites that don't yet exist), continuing to plan for them under the current timeline would violate the constraint of "what one person can do well in a year."

---

**#designthinking**

The ruleset design process followed a design thinking cycle: ideation (brainstorming game mechanics), empathization (consulting the chess coach for player perspective), prototyping (the MVP, then successive engine builds), and testing (play-testing with Prof. Tambasco, the external expert, and personal testing).

The most vivid design thinking episode was the discovery of the one-sided illegality loophole (Episode 2 in the process documentation). A 1900-rated player against a 2500 GM could simply play illegal moves three times and force a draw, a catastrophic game-design failure that the theoretical ruleset missed entirely. The fix (separating one-sided from mutual illegalities, introducing a time penalty) came directly from the empathization step: my chess coach and I inhabiting the mindset of a player who would be motivated to exploit the rule.

The iterative design process is documented in Episodes 1–4 of the Process Documentation, showing how design thinking translated loopholes and edge cases into explicit rules.

---

**#systemmapping**

SimChess can be looked at as a complex system: the ruleset, the arbitration engine, the client-server protocol, and the clock system all interact. Mapping these interactions was necessary for both design and debugging.

The most explicit system map is Figure 3 (the comprehensive flow diagram in the Appendix), which documents every decision node in the atomic resolution protocol. Less formally, the system mapping manifested in the discovery of the "cannibal queen" bug: the bug only made sense when I mapped the full sequence of state mutations during a simultaneous resolution cycle and identified the moment when one piece's mutation became the input to the other player's move calculation.

The architecture diagram (Figure 3 in the Appendix, and described in "High-Level Architecture") maps the client-server interaction as a system: clients are intentionally "dumb" input terminals; the server is the authoritative game state holder. This mapping directly determined the WebSocket event design— events carry intentions, not decisions; the server makes all state transitions.

---

**#emergentproperties**

SimChess exhibits emergent gameplay patterns that could not have been predicted purely from reading the individual rules.

The most striking emergent property is the "mutual bluff equilibrium." In orthodox chess, a player would never voluntarily move a pinned piece, as it is simply illegal. In SimChess, moving a pinned piece is legal, and if the opponent doesn't know the piece is pinned (which they don't, because they see the same board you do), they may not realize they can capture the King. Two players who understand this mechanic can enter a psychological arms race: both considering "should I move my pinned piece and hope you miss it?" The bluffing mechanic—intended as a design choice—produces strategic patterns analogous to poker's "risk tolerance" dynamics, which is emergent behavior arising from a rule interaction rather than any single rule.

Another emergent property: the illegality counter system creates tempo attacks. A player who suspects the opponent is close to a 3-count can attempt to exploit the situation, but the mutual illegality cap means that aggressive illegal probing carries a draw risk. The system of counters produces strategic tension that was not explicitly designed in but falls out naturally from the mechanics.

---

**#audience**

Different sections of this project communicate to different audiences: the ruleset spec speaks to chess-literate players and potential implementers; the academic document speaks to a Capstone committee; the GitHub repository README speaks to developers; the walkthrough modal speaks to first-time users; the community outreach posts will speak to chess enthusiasts.

The ruleset document assumes proficiency in orthodox chess. Terms like "pin," "pawn diagonal capture," "pseudo-legal" are used without definition (except in the glossary). This is correct for the target audience. The executive summary does not assume chess knowledge in the same way; it explains the variant from first principles. The Process Documentation is academic tone with personal narrative, appropriate for the Capstone context.

---

**#medium**

This project communicates through multiple media simultaneously: a written ruleset document, a live interactive web application, a flow diagram, a GitHub repository, an academic paper, and now a community outreach effort.

The choice to present the ruleset as a specification document (Section A of the Work Product) rather than as informal prose reflected a deliberate medium decision: the audience for the ruleset is a player or implementer who needs unambiguous reference, not narrative. The Move History panel on the platform is itself a medium choice, displaying "intended vs. realized" moves in a persistent, scrollable log communicates game information that would otherwise require players to mentally track two layers of state simultaneously.

The interactive walkthrough modal added this semester is another medium choice: the complexity of SimChess rules cannot be communicated through a wall of text before you sit down to play. A step-by-step walkthrough with illustrations that auto-appears on first visit is the appropriate medium for onboarding.

---

**#responsibility**

Self-management of a year-long independent project (adhering to the timeline, tracking progress, and ensuring deliverables are complete) is an ongoing application. The Huly tracker has been updated with Spring milestones: the DigitalOcean migration, codebase modularization, and external expert session are all closed; community outreach and final submission preparation are the active items. Every weekly Capstone deliverable has been submitted on time, and the decision to formally scope out Stages 3 and 4 was itself an act of responsible scoping — recognizing that attempting them under the current timeline would compromise the quality of Stages 1 and 2.

---

**#modeling**

The SimChess ruleset is itself a formal model of a simultaneous game. The atomic resolution protocol (Section 2 of the Work Product) defines a function $f(I_w, I_b, S_0) \to S_1$ that maps two player intentions and an initial board state to a new board state, along with a set of side effects (illegality counter increments, time penalties, game-over signals). Writing that function precisely — specifying every conflict type, every resolution order, every counter behavior — is an act of mathematical modeling, even if the notation is informal.

The most concrete modeling contribution is the illegality penalty structure. The one-sided illegality system can be described as a cyclic counter with a threshold trigger: let $c$ be the count; when $c \bmod 3 = 0$ and $c > 0$, a 30-second penalty fires and $c$ resets to zero. This model made the "cyclic" behavior explicit and testable: it is not a once-per-game mechanic but a repeating cost structure, which has strategic implications (a skilled player can potentially bait the opponent into a second or third penalty cycle). Expressing the mechanic as a formal model rather than a prose rule was what made this implication visible.

A lighter modeling application: the bluffing mechanic can be analyzed as a simultaneous game in its own right. In any position where a player has a pinned piece, the relevant subgame is a 2×2 matrix: {move pinned piece, don't} × {capture king, don't}. The dominant strategy depends entirely on each player's beliefs about the other — a pure simultaneous-game reasoning problem. This framing doesn't require a Stage 3 engine to be useful; it clarifies why the bluffing mechanic produces genuine strategic depth and is not just a rule curiosity.

---

**#organization**

This Capstone document is itself an organizational artifact. The structure — Cover Sheet, Executive Summary, Academic Abstract, Work Product (Ruleset + Technical Implementation), Process Documentation, Management & Tracking, (No)AI, Scoping for Quality, HC/LO, Appendix — was not simply inherited from the Handbook template. Each section has a specific audience and function, and their ordering was deliberate: the Work Product is the primary deliverable and appears before the process narrative, so a reader who only wants the specification can stop there.

Within the Work Product, the separation of the ruleset (Section A) from the technical implementation (Section B) reflects the same organizing principle: the rules are what SimChess *is*; the implementation is how it was *built*. These are conceptually independent — one could implement the same ruleset in a different language or framework — and keeping them in separate sections makes that independence visible.

At the codebase level, organization is enforced structurally. The `engine/` package is the clearest example: it contains the game logic and nothing else. No routing, no socket handling, no Flask imports. Any developer reading the repository can locate the arbitration logic in one place, and the package can be imported and tested without spinning up the web server. The Huly tracker applies the same principle to project management: each task is in exactly one milestone, and milestones do not overlap.

---

**#professionalism**

Several decisions in this project were made not because they were technically required, but because they reflect the standard of a professionally maintained system.

The migration from Render to a VPS with a custom domain is the clearest example. The app could have continued running on Render's free tier — it was technically functional. The migration to `simchess.tech` with Nginx, HTTPS, and a systemd service that restarts on reboot was done because a production system should not sleep between requests, should serve traffic over a secure connection, and should recover automatically from crashes. These are not features that improve gameplay; they are hygiene markers of a professionally operated service.

The same standard applies to the codebase. Deleting `game_engine.py` — a 603-line legacy file that was no longer the source of truth — was a professionalism decision. Dead code in a repository creates confusion about what is actually running. The Flask application factory pattern (`create_app()`) is the standard approach for Flask applications in production; using it correctly, with `socketio.init_app()` inside the factory to avoid import-time side effects, reflects awareness of deployment best practices even when they are not strictly required for a single-developer project.

The ruleset document itself (v1.0) is formatted and versioned as a professional specification. The version number signals that it is stable and supersedes prior drafts. The glossary, the numbered sections, the formal notation for the resolution function — these are not required for a game played between two people, but they allow the ruleset to function as a reference document for anyone who wants to implement SimChess independently or modify it in the future.

---

**#plausibility**

A game variant with novel mechanics has to clear a basic bar: does it actually work? Can two players sit down and play a game from start to finish without encountering a situation the rules don't cover? Establishing this plausibility was a continuous thread throughout the project.

The iterative design episodes (1–4 in the Process Documentation) are each, at bottom, plausibility crises resolved. The Scandinavian Paradox (Episode 1) was a plausibility failure: the initial rules had no answer for reciprocal capture, so two players would deadlock. The one-sided illegality loophole (Episode 2) was a different kind of plausibility failure: the rules technically "worked" but produced outcomes that were obviously unfair. The checkmate/stalemate setback (Episode 3) was the hardest: a naive implementation of checkmate produced infinite loops and undefined states. Each resolution added a rule or sharpened an existing one until the game was not just theoretically consistent but actually playable.

The external expert session was the final plausibility test. A former chess coach encountered the rules for the first time, reviewed the document, played a game on the live platform, and found no gaps or contradictions. That outcome is evidence that the ruleset is complete in the sense that matters: a chess-literate person can read it, play by it, and not get stuck. The platform enforcing the rules correctly in real-time play — not crashing, not producing illegal board states, not failing to detect a win condition — is the engineering counterpart to that plausibility test.

---

#### LOs

**#cs162-abstraction**

The `SimChessBoard` subclass encapsulates the entire arbitration logic (collision detection, paradox resolution, one-sided penalty tracking) behind a clean `submit_move()` and `get_fen()` interface. The Flask application and frontend client do not need to understand "Rule 2.5" or path-intersection algorithms. This abstraction was critical for the "cannibal queen" bug fix: the transactional move resolution was a complete internal rewrite, but it had no external API changes—the fix was invisible to the rest of the system.

The JS modularization extends this principle to the frontend. The `socket.js` module communicates with `clocks.js` through the shared `SimChess` namespace, not through direct function calls into the monolith. Each module can be read and understood independently.

---

**#cs162-webstandards**

The platform relies on HTTP for initial resource loading and the WebSocket protocol (via Socket.IO) for bidirectional real-time communication. The frontend uses CSS Grid and Flexbox for the 3-column layout. The DigitalOcean migration introduced two additional web standards: HTTPS via TLS (enforced by Certbot/Let's Encrypt) and the standard Nginx reverse-proxy configuration for proxying WebSocket connections correctly (the `Upgrade` and `Connection` headers required special handling to avoid breaking the long-lived WebSocket connection).

---

**#cs162-deployment**

The deployment now spans multiple layers: GitHub, DigitalOcean Droplet (via SSH/manual pull), Gunicorn (process management), Nginx (reverse proxy, SSL termination), Certbot (certificate auto-renewal). This is a more complete deployment story than the Render setup, and it exposes the underlying infrastructure decisions that PaaS platforms hide. Specifically, managing the Gunicorn worker count to handle concurrent WebSocket connections, configuring Nginx to not buffer WebSocket traffic, and setting up systemd to restart Gunicorn on server reboots.

---

**#cs162-separationofconcerns**

The codebase now uses strict separation: `engine/` package (game rules and arbitration logic), `routes.py` (HTTP endpoints), `sockets.py` (WebSocket event handlers), `app.py` (factory only), and five frontend JS modules with single responsibilities. The legacy `game_engine.py` file, which mixed rule logic, clock management, and state serialization, has been deleted.

---

**#cs162-testing**

Manual play-testing continues to be the primary validation method, but the modularization this semester creates the conditions for automated testing. The `engine/` package can now be imported and tested independently of the Flask application. Future work (post-final-submission) would add pytest scripts for specific arbitration scenarios.

---

## Appendix

*(Original figures — Figure 1 (UI screenshot), Figure 2 (mutual illegality diagram), Figure 3 (flow diagram), Figure 4 (Parrow's Chess illustration), Figure 6 (Huly Documents), Figure 7 (Huly Tracker), Figure 8 (SimChess logo) — carried forward from Full Draft.)*

**[NEW] Figure 5 (replacement):** Add a screenshot of `simchess.tech` in a browser, alongside the DigitalOcean droplet dashboard showing the server running and the domain DNS configuration. This replaces the old Figure 5 (Render deployment screenshot), which showed the sleep-cycle limitation that has since been resolved.

---

*End of Revised Full Draft — SimChess — Elbion Redenica — February 27, 2026*
