import createPongGameComponent from '/static/js/components/game.js';
import { PlayerController } from '/static/js/utils/Controller.js';
import Path from '/static/js/utils/Path.js';

class Tournament {
    constructor() {
    }

    init(players) {
        const shuffledPlayers = this.#shuffle(players);
        this.#createMatchBoxes(shuffledPlayers.length);
        this.match = 0;
        this.round = 0;
        this.over = false;

        // Fill the first round with players
        let j = 0;
        for (let i = 0; i < this.matchBoxes[0].length; i++) {
            if (this.matchBoxes[0][i] === null)
                continue;
            this.matchBoxes[0][i] = shuffledPlayers[j];
            j++;
        }

        // Skip the first match if it's the null one
        if (this.matchBoxes[0]?.[0] === null)
            this.setMatchResult(1);
        if (this.matchBoxes[0]?.[1] === null)
            this.setMatchResult(0);
    }

    getMatchPlayers() {
        return [this.matchBoxes[this.round][this.match], this.matchBoxes[this.round][this.match + 1]];
    }
    
    setMatchResult(winner) { // winner = 0 or 1 (0 = left player, 1 = right player)
        if (this.over)
            return;
        
        // Write the winner on the next match box
        for (let i = 0; i < this.matchBoxes[this.round + 1].length; i++) {
            if (this.matchBoxes[this.round + 1][i] === undefined) {
                this.matchBoxes[this.round + 1][i] = this.matchBoxes[this.round][this.match + winner];
                break;
            }
        }
        this.match += 2;
        if (this.match >= this.matchBoxes[this.round].length) {
            this.match = 0;
            this.round += 1;
        }

        if (this.round == this.matchBoxes.length - 1) {
            this.over = true;
            return;
        }

        // Call this function again if the next match doesn't have both players
        if (this.matchBoxes[this.round][this.match] === null)
            this.setMatchResult(1);
        else if (this.matchBoxes[this.round][this.match + 1] === null)
            this.setMatchResult(0);
    }

    #shuffle(array) {
        const shuffledPlayers = [...array];
        for (let i = shuffledPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
        }
        return shuffledPlayers;
    }

    #addNullPlayer(array) {
        const randomIndex = Math.floor(Math.random() * (array.length + 1));
        array.splice(randomIndex, 0, null);
        return array
    }

    #createMatchBoxes(numPlayers) {
        this.matchBoxes = [];
        
        if (numPlayers == 0)
            return;
        
        const totalRounds = Math.ceil(Math.log2(numPlayers)) + 1;
        for (let i = 0; i < totalRounds; i++) {
            const roundPlayers = Math.ceil(numPlayers / 2 ** i);
            this.matchBoxes.push(Array(roundPlayers).fill(undefined));
            if (roundPlayers % 2 != 0)
                this.matchBoxes[i] = this.#addNullPlayer(this.matchBoxes[i]);
        }
    }

    getComponent() {
        const component = document.createElement('div');
        component.classList.add('tournament');

        const roundDiv = document.createElement('div');
        roundDiv.classList.add('round');
        component.appendChild(roundDiv);

        const winnerDiv = document.createElement('div');
        winnerDiv.id = 'winner';
        roundDiv.appendChild(winnerDiv);

        const crownImg = document.createElement('img');
        crownImg.src = Path.img('crown.png');
        crownImg.alt = 'Winner';
        winnerDiv.appendChild(crownImg);

        const matchBox = document.createElement('div');
        matchBox.classList.add('match-box');
        if (this.round == this.matchBoxes.length - 1)
            matchBox.classList.add('active-match');
        winnerDiv.appendChild(matchBox);
        
        const matchBoxContent = document.createElement('p');
        matchBoxContent.textContent = this.matchBoxes[this.matchBoxes.length - 1][0] || this.matchBoxes[this.matchBoxes.length - 1][1] || '-';
        matchBox.appendChild(matchBoxContent);

        for (let i = this.matchBoxes.length - 2; i >= 0;  i--) {
            const roundDiv = document.createElement('div');
            roundDiv.classList.add('round');
            component.appendChild(roundDiv);

            for (let j = 0; j < this.matchBoxes[i].length; j += 2) {
                const matchBox = document.createElement('div');
                matchBox.classList.add('match-box');
                if (i == this.round && j == this.match)
                    matchBox.classList.add('active-match');
                roundDiv.appendChild(matchBox);

                const matchBoxContent = document.createElement('p');
                const p1 = this.matchBoxes[i][j];
                const p2 = this.matchBoxes[i][j + 1];
                if (p1 != null && p2 != null)
                    matchBoxContent.textContent = `${p1} vs ${p2}`;
                else if (p1 != null)
                    matchBoxContent.textContent = p1;
                else if (p2 != null)
                    matchBoxContent.textContent = p2;
                else
                    matchBoxContent.textContent = '-';

                matchBox.appendChild(matchBoxContent);
            }
        }

        return component;
    }
};

let tournament = null;

function loadFormView(component) {
    const MAX_PLAYERS = 8;
    const players = new Set();
    function addPlayerToForm() {
        const playerName = input.value;
        
        if (players.size >= MAX_PLAYERS) {
            alert('Max players reached.');
            return;
        }

        if (!playerName) {
            alert('No empty names allowed.');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(playerName)) {
            alert('Only letters, numbers and underscores allowed.');
            return;
        }
        
        if (players.has(playerName)) {
            alert('Player already added.');
            return;
        }
        
        if (playerName.length > 20) {
            alert('Player name too long.');
            return;
        }
        
        players.add(playerName);
        const listItem = document.createElement('li');
        playerList.appendChild(listItem);
        
        const listText = document.createElement('p');
        listText.textContent = playerName;
        listItem.appendChild(listText);

        const removeButton = document.createElement('button');
        removeButton.classList.add('button-red');
        removeButton.textContent = 'X';
        removeButton.addEventListener('click', () => {
            players.delete(playerName);
            listItem.remove();
        });
        listItem.appendChild(removeButton);
        
        input.value = '';
    }

    const containerDiv = document.createElement('div');
    containerDiv.id = 'div-container';
    component.appendChild(containerDiv);

    const titleDiv = document.createElement('div');
    titleDiv.classList.add('div-title');
    containerDiv.appendChild(titleDiv);

    const title = document.createElement('h1');
    title.textContent = 'Tournament';
    titleDiv.appendChild(title);

    const description = document.createElement('p');
    description.textContent = 'Enter the names of the players.';
    titleDiv.appendChild(description);

    const inputDiv = document.createElement('div');
    inputDiv.classList.add('div-input');
    containerDiv.appendChild(inputDiv);
    
    const input = document.createElement('input');
    input.placeholder = 'PlayerName';
    input.addEventListener('keydown', (event) => {
        if (input.value.trim() === '')
            return;
        if (event.key === 'Enter') {
            addPlayerToForm();
        }
    });
    inputDiv.appendChild(input);
    
    const button = document.createElement('button');
    button.textContent = 'Add Player';
    button.addEventListener('click', addPlayerToForm);
    inputDiv.appendChild(button);
    
    const buttonNext = document.createElement('button');
    buttonNext.id = "button-next";
    buttonNext.classList.add('button-green');
    buttonNext.textContent = 'Start Tournament';
    buttonNext.addEventListener('click', () => {
        if (players.size < 2) {
            alert('Minimum 2 Players required.');
            return;
        }
        tournament.init(players);
        component.innerHTML = '';
        loadMatchesView(component);
    });
    containerDiv.appendChild(buttonNext);
    
    const playersDiv = document.createElement('div');
    playersDiv.classList.add('div-players');
    containerDiv.appendChild(playersDiv);

    const headerDiv = document.createElement('div');
    headerDiv.classList.add('div-header');
    headerDiv.textContent = 'Players';
    playersDiv.appendChild(headerDiv);

    const playerList = document.createElement('ul');    
    playersDiv.appendChild(playerList);
}


function loadMatchesView(component) {
    const matchesContainer = document.createElement('div');
    matchesContainer.id = 'div-container';
    component.appendChild(matchesContainer);

    const matchesList = tournament.getComponent();
    matchesList.id = "tournament";
    matchesContainer.appendChild(matchesList);

    const buttonNext = document.createElement('button');
    buttonNext.textContent = 'Start tournament';
    buttonNext.addEventListener('click', () => {
        component.innerHTML = '';
        loadGameView(component);
    });
    component.appendChild(buttonNext);

    const buttonTest0 = document.createElement('button');
    buttonTest0.textContent = 'Test 0';
    buttonTest0.addEventListener('click', () => {
        tournament.setMatchResult(0);
        matchesContainer.replaceChildren(tournament.getComponent());
    });
    component.appendChild(buttonTest0);

    const buttonTest1 = document.createElement('button');
    buttonTest1.textContent = 'Test 1';
    buttonTest1.addEventListener('click', () => {
        tournament.setMatchResult(1);
        matchesContainer.replaceChildren(tournament.getComponent());
    });
    component.appendChild(buttonTest1);
}

function loadGameView(component) {
    const gameContainer = document.createElement('div');
    const players = tournament.getMatchPlayers();
    let [game, pong] = createPongGameComponent({
        playerLeft: {
            name: players[0],
            controller: new PlayerController("w", "s"),
        },
        playerRight: {
            name: players[1],
            controller: new PlayerController("ArrowUp", "ArrowDown"),
        },
        maxScore: 3,
        onContinueButton: (game) => {
            const winner = game.playerLeft.score > game.playerRight.score ? 0 : 1;
            tournament.setMatchResult(winner);
            pong = null;
            component.innerHTML = '';
            loadMatchesView(component);
        },
    });

    gameContainer.appendChild(game);
    component.appendChild(gameContainer);
}

export default async function getView(component, cssLoadFunction) {
    // Carga el CSS
    cssLoadFunction([
        Path.css("main/tournament.css"),
        Path.css("components/game.css"),
    ]);

    tournament = new Tournament();
    // Crea el formulario
    loadFormView(component);
}
