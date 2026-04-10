const ALL_TIKIS = ['Nani', 'Kapu', 'Nui', 'Akamai', 'Hookipa', 'Loa', 'Hulu', 'Mano', 'Pele'];
// Original Vibrant colors + the symbols I added
const TIKI_PROPS = {
    'Nani': {c: '#FFB3BA', s: '🐟'}, 'Kapu': {c: '#FFDFBA', s: '⭐'}, 'Nui': {c: '#FFFFBA', s: '🐚'},
    'Akamai': {c: '#BAFFC9', s: '🐟'}, 'Hookipa': {c: '#BAE1FF', s: '⭐'}, 'Loa': {c: '#D0B0FF', s: '🐚'},
    'Hulu': {c: '#FFBDF2', s: '🐟'}, 'Mano': {c: '#E0E0E0', s: '⭐'}, 'Pele': {c: '#FF9E9E', s: '🐚'}
};

let gameState = {
    players: [],
    numPlayers: 0,
    currentRound: 1,
    maxRounds: 4,
    currentPlayerIndex: 0,
    board: [],
    selectedTikiIndex: null,
    secretCardsDeck: [],
    isTieBreaker: false
};

// UI Elements
const screenMenu = document.getElementById('screen-menu');
const screenGame = document.getElementById('screen-game');
const screenRoundOver = document.getElementById('screen-roundover');

// --- PEEK BUTTON LOGIC ---
const peekBtn = document.getElementById('peek-btn');
const secretDisplay = document.getElementById('secret-tikis-display');

if (peekBtn) {
    peekBtn.addEventListener('mousedown', () => secretDisplay.classList.remove('hidden'));
    peekBtn.addEventListener('mouseup', () => secretDisplay.classList.add('hidden'));
    peekBtn.addEventListener('mouseleave', () => secretDisplay.classList.add('hidden'));

    // mobile support
    peekBtn.addEventListener('touchstart', (e) => { e.preventDefault(); secretDisplay.classList.remove('hidden'); });
    peekBtn.addEventListener('touchend', (e) => { e.preventDefault(); secretDisplay.classList.add('hidden'); });
}

// --- INITIALIZATION ---
function startGame(playerCount) {
    gameState.numPlayers = playerCount;
    gameState.maxRounds = (playerCount === 3) ? 3 : 4; 
    gameState.players = [];
    gameState.isTieBreaker = false;
    
    for(let i=0; i<playerCount; i++) {
        gameState.players.push({
            id: i,
            name: `Player ${i+1}`,
            score: 0,
            hand: [],
            secretTikis: []
        });
    }

    gameState.currentRound = 1;
    startNextRound();

    screenMenu.classList.add('hidden');
    screenGame.classList.remove('hidden');
}

function startNextRound() {
    screenRoundOver.classList.add('hidden');
    
    // 1. Board setup: Shuffle the 9 Tikis
    gameState.board = [...ALL_TIKIS].sort(() => 0.5 - Math.random());
    
    // 2. Secret Cards setup: Each player gets 3 random unique tikis they want on top
    gameState.secretCardsDeck = [];
    for(let i=0; i<10; i++) {
        let shuffled = [...ALL_TIKIS].sort(() => 0.5 - Math.random());
        gameState.secretCardsDeck.push([shuffled[0], shuffled[1], shuffled[2]]);
    }
    
    // 3. Hands setup
    gameState.players.forEach(p => {
        p.secretTikis = gameState.secretCardsDeck.pop();
        
        if(gameState.numPlayers === 2) {
            p.hand = [
                {id: Math.random(), type: 'up1', name: 'Tiki Up 1'},
                {id: Math.random(), type: 'up2', name: 'Tiki Up 2'},
                {id: Math.random(), type: 'up3', name: 'Tiki Up 3'},
                {id: Math.random(), type: 'up1', name: 'Tiki Up 1'},
                {id: Math.random(), type: 'up2', name: 'Tiki Up 2'},
                {id: Math.random(), type: 'topple', name: 'Tiki Topple'},
                {id: Math.random(), type: 'toast', name: 'Tiki Toast'}
            ];
        } else {
            p.hand = [
                {id: Math.random(), type: 'up1', name: 'Tiki Up 1'},
                {id: Math.random(), type: 'up2', name: 'Tiki Up 2'},
                {id: Math.random(), type: 'up2', name: 'Tiki Up 2'},
                {id: Math.random(), type: 'up3', name: 'Tiki Up 3'},
                {id: Math.random(), type: 'topple', name: 'Tiki Topple'},
                {id: Math.random(), type: 'toast', name: 'Tiki Toast'}
            ];
        }
    });

    gameState.currentPlayerIndex = 0;
    gameState.selectedTikiIndex = null;
    
    renderGame();
}

// --- RENDERING ---
function renderGame() {
    document.getElementById('round-display').innerText = `Round ${gameState.currentRound} / ${gameState.maxRounds}`;
    
    const scoresDiv = document.getElementById('player-scores');
    scoresDiv.innerHTML = gameState.players.map(p => `<h3>${p.name}: ${p.score} pts</h3>`).join('');

    const curPlayer = gameState.players[gameState.currentPlayerIndex];
    document.getElementById('turn-indicator').innerText = `${curPlayer.name}'s Turn`;

    const secretDiv = document.getElementById('secret-tikis-display');
    secretDiv.innerHTML = curPlayer.secretTikis.map((t, idx) => `<span>#${idx+1} ${t}</span>`).join('');
    
    const handDiv = document.getElementById('player-hand');
    handDiv.innerHTML = '';
    
    if(curPlayer.hand.length > 0) {
        curPlayer.hand.forEach((card, idx) => {
            const btn = document.createElement('button');
            btn.className = `action-card card-${card.type.substring(0,6)}`;
            btn.innerText = card.name;
            if(gameState.selectedTikiIndex === null) {
                btn.classList.add('disabled');
            } else {
                btn.onclick = () => playCard(idx);
            }
            handDiv.appendChild(btn);
        });
    } else {
        handDiv.innerHTML = '<p>No cards left!</p>';
    }

    const boardDiv = document.getElementById('tiki-lineup');
    boardDiv.innerHTML = '';
    gameState.board.forEach((tiki, idx) => {
        const div = document.createElement('div');
        div.className = `tiki-piece ${gameState.selectedTikiIndex === idx ? 'selected' : ''}`;
        const props = TIKI_PROPS[tiki] || {c: '#fff', s: ''};
        div.style.backgroundColor = props.c;
        div.innerHTML = `<span>${idx + 1}.</span> <span>${props.s} ${tiki}</span>`;
        div.onclick = () => {
            gameState.selectedTikiIndex = idx;
            renderGame();
        };
        boardDiv.appendChild(div);
    });
}

// --- GAME LOGIC ---
function playCard(handIndex) {
    if(gameState.selectedTikiIndex === null) return;

    const curPlayer = gameState.players[gameState.currentPlayerIndex];
    const card = curPlayer.hand[handIndex];
    const tikiIdx = gameState.selectedTikiIndex;

    let validMove = false;

    if (card.type === 'up1' || card.type === 'up2' || card.type === 'up3') {
        const moves = parseInt(card.type.substring(2));
        if (tikiIdx > 0) {
            let newIdx = Math.max(0, tikiIdx - moves);
            const item = gameState.board.splice(tikiIdx, 1)[0];
            gameState.board.splice(newIdx, 0, item);
            validMove = true;
        } else {
            alert("This Tiki is already at the top!");
        }
    } 
    else if (card.type === 'topple') {
        if (tikiIdx < gameState.board.length - 1) {
            const item = gameState.board.splice(tikiIdx, 1)[0];
            gameState.board.push(item);
            validMove = true;
        } else {
            alert("This Tiki is already at the bottom!");
        }
    }
    else if (card.type === 'toast') {
        if (tikiIdx === gameState.board.length - 1) {
            gameState.board.pop();
            validMove = true;
        } else {
            alert("Tiki Toast can ONLY be played on the very bottom Tiki!");
        }
    }

    if (validMove) {
        curPlayer.hand.splice(handIndex, 1);
        gameState.selectedTikiIndex = null;
        checkRoundEndState();
    }
}

function checkRoundEndState() {
    const allOut = gameState.players.every(p => p.hand.length === 0);
    const threeLeft = gameState.board.length <= 3;

    if (threeLeft || allOut) {
        endRound();
    } else {
        advanceTurn();
    }
}

function advanceTurn() {
    let nextIdx = (gameState.currentPlayerIndex + 1) % gameState.numPlayers;
    let loopProtect = 0;
    while(gameState.players[nextIdx].hand.length === 0 && loopProtect < 10) {
        nextIdx = (nextIdx + 1) % gameState.numPlayers;
        loopProtect++;
    }
    gameState.currentPlayerIndex = nextIdx;
    renderGame();
}

function endRound() {
    let resultsHTML = `<h3>Board:</h3><ol>`;
    for(let i=0; i<3; i++) {
        if(gameState.board[i]) resultsHTML += `<li>${gameState.board[i]}</li>`;
    }
    resultsHTML += `</ol><hr><h3>Points Scored:</h3>`;

    // Scoring matches official Tiki Topple rules:
    gameState.players.forEach(p => {
        let pts = 0;
        let reasons = [];
        const top3 = gameState.board.slice(0, 3);
        
        if(p.secretTikis[0] === top3[0]) { 
            pts += 9; reasons.push("+9 (Top tiki in 1st)"); 
        }
        if(p.secretTikis[1] === top3[0] || p.secretTikis[1] === top3[1]) { 
            pts += 5; reasons.push("+5 (Mid tiki in Top 2)"); 
        }
        if(p.secretTikis[2] === top3[0] || p.secretTikis[2] === top3[1] || p.secretTikis[2] === top3[2]) { 
            pts += 2; reasons.push("+2 (Bot tiki in Top 3)"); 
        }

        p.score += pts;
        resultsHTML += `<p><strong>${p.name}:</strong> ${pts > 0 ? reasons.join(', ') : '0 pts'}</p>`;
    });

    document.getElementById('round-results').innerHTML = resultsHTML;
    
    gameState.currentRound++;
    
    if(gameState.currentRound > gameState.maxRounds) {
        let maxScore = -1;
        gameState.players.forEach(p => maxScore = Math.max(maxScore, p.score));
        const tiedPlayers = gameState.players.filter(p => p.score === maxScore);
        
        if (tiedPlayers.length > 1 && !gameState.isTieBreaker) {
            gameState.isTieBreaker = true;
            gameState.maxRounds++;
            document.getElementById('round-results').innerHTML += `<h2 style="color:yellow; margin-top:10px;">TIE DETECTED! ONE FINAL ROUND ADDED!</h2>`;
            document.getElementById('next-round-btn').innerText = "Start Tie-Breaker Round";
        } else {
             document.getElementById('next-round-btn').innerText = "Game Over! Finish";
             if(gameState.isTieBreaker) {
                 document.getElementById('round-results').innerHTML += `<h2 style="color:lime; margin-top:10px;">TIE BREAKER CONCLUDED!</h2>`;
             }
        }
    }

    screenRoundOver.classList.remove('hidden');
}
