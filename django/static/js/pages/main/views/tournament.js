import createPongGameComponent from '/static/js/components/game.js';
import { PlayerController } from '/static/js/utils/Controller.js';
import Path from '/static/js/utils/Path.js';

class Tournament {
    constructor() {
    }

    init(players) {
        this.players = this.#shuffle(players);
        this.#createMatchBoxes();
        this.match = 0;
        this.round = 0;
        this.over = false;

        // Fill the first round with players
        if (this.players.length % 2 != 0)
            this.players = this.#addNullPlayer(this.players);
        for (let i = 0; i < this.matchBoxes[0].length; i++) {
            this.matchBoxes[0][i] = [this.players[2 * i], this.players[2 * i + 1]];
        }
    }
    
    setMatchResult(winner) { // winner = 0 or 1 (0 = left player, 1 = right player)
        if (this.over)
            return;
        
        // Write the winner on the next match box
        this.matchBoxes[this.round + 1][Math.floor(this.match / 2)][this.match % 2] = this.matchBoxes[this.round][this.match][winner];
        this.match += 1;
        if (this.match == this.matchBoxes[this.round].length) {
            this.match = 0;
            this.round += 1;
        }

        if (this.round == this.matchBoxes.length - 1) {
            this.over = true;
            return;
        }

        // Call this function again if the next match doesn't have both players
        if (this.matchBoxes[this.round][this.match].some(player => player == null))
            this.setMatchResult(this.matchBoxes[this.round][this.match][0] == null ? 1 : 0);
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

    #createMatchBoxes() {
        this.matchBoxes = [];
        const len = this.players.length;
        
        if (len == 0)
            return;
        
        const totalRounds = Math.ceil(Math.log2(len)) + 1;
        for (let i = 0; i < totalRounds; i++) {
            this.matchBoxes.push([]);
            const numBoxes = Math.ceil(len / 2 ** (i + 1));
            for (let j = 0; j < numBoxes; j++)
                this.matchBoxes[i].push([null, null]);
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
        matchBoxContent.textContent = this.matchBoxes[this.matchBoxes.length - 1][0][0] || this.matchBoxes[this.matchBoxes.length - 1][0][1] || '-';
        matchBox.appendChild(matchBoxContent);

        for (let i = this.matchBoxes.length - 2; i >= 0;  i--) {
            const roundDiv = document.createElement('div');
            roundDiv.classList.add('round');
            component.appendChild(roundDiv);

            for (let j = 0; j < this.matchBoxes[i].length; j++) {
                const matchBox = document.createElement('div');
                matchBox.classList.add('match-box');
                console.log (i, j, this.round, this.match);
                if (i == this.round && j == this.match)
                    matchBox.classList.add('active-match');
                roundDiv.appendChild(matchBox);

                const matchBoxContent = document.createElement('p');
                const p1 = this.matchBoxes[i][j][0];
                const p2 = this.matchBoxes[i][j][1];
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

const tournament = new Tournament();

function loadFormView(component) {
    const inputDiv = document.createElement('div');
    const input = document.createElement('input');
    const button = document.createElement('button');
    const playerList = document.createElement('ul');

    input.placeholder = 'Escribe el nombre del jugador';
    button.textContent = 'Añadir jugador';

    const MAX_PLAYERS = 8;
    const players = new Set();

    function addPlayerToForm() {
        const playerName = input.value.trim();

        if (!playerName) {
            alert('El nombre no puede estar vacío.');
            return;
        }

        if (players.has(playerName)) {
            alert('Este jugador ya está en la lista.');
            return;
        }

        if (players.size >= MAX_PLAYERS) {
            alert('No puedes añadir más de 8 jugadores.');
            return;
        }

        players.add(playerName);
        const listItem = document.createElement('li');
        listItem.textContent = playerName;
        playerList.appendChild(listItem);

        input.value = '';
    }

    button.addEventListener('click', addPlayerToForm);

    const buttonNext = document.createElement('button');
    buttonNext.textContent = 'Next';
    buttonNext.addEventListener('click', () => {
        let players = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
        //if (players.size < 2) {
        //    alert('Debes añadir al menos 2 jugadores.');
        //    return;
        //}
        tournament.init(players);
        component.innerHTML = '';
        loadMatchesView(component);
    });
    
    inputDiv.appendChild(input);
    inputDiv.appendChild(button);
    inputDiv.appendChild(buttonNext);
    component.appendChild(inputDiv);
    component.appendChild(playerList);
}


function loadMatchesView(component) {
    const matchesContainer = document.createElement('div');
    component.appendChild(matchesContainer);

    const matchesList = tournament.getComponent();
    matchesList.id = "tournament";
    matchesContainer.appendChild(matchesList);

    const buttonNext = document.createElement('button');
    buttonNext.textContent = 'Start tournament';
    buttonNext.addEventListener('click', () => {
        component.innerHTML = '';
        loadGameView(component, matches[0]);
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

function loadGameView(component, players) {
    const gameContainer = document.createElement('div');
    const game = createPongGameComponent({
        controllerLeft: new PlayerController("w", "s"),
        controllerRight: new PlayerController("ArrowUp", "ArrowDown"),
    });

    gameContainer.appendChild(game);
    component.appendChild(gameContainer);
}

export default async function getView(component, cssLoadFunction) {
    // Carga el CSS
    cssLoadFunction([
        Path.css("main/tournament.css"),
    ]);

    // Crea el formulario
    loadFormView(component);
}
