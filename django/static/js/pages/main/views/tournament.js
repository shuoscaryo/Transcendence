import createPongGameComponent from '/static/js/components/game.js';
import { PlayerController } from '/static/js/utils/Controller.js';

let players = null;

function loadFormView(component) {
    const inputDiv = document.createElement('div');
    const input = document.createElement('input');
    const button = document.createElement('button');
    const playerList = document.createElement('ul');

    input.placeholder = 'Escribe el nombre del jugador';
    button.textContent = 'Añadir jugador';

    const MAX_PLAYERS = 8;
    players = new Set();

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
        if (players.size < 2) {
            alert('Debes añadir al menos 2 jugadores.');
            return;
        }

        component.innerHTML = '';
        loadMatchesView(component);
    });
    
    inputDiv.appendChild(input);
    inputDiv.appendChild(button);
    inputDiv.appendChild(buttonNext);
    component.appendChild(inputDiv);
    component.appendChild(playerList);
}

function generateMatches(players) {
    const matches = [];

    for (const player1 of players) {
        for (const player2 of players) {
            if (player1 === player2) continue;
            matches.push([player1, player2]);
        }
    }

    return matches;
}

function loadMatchesView(component) {
    const matchesContainer = document.createElement('div');
    const matchesList = document.createElement('ul');

    const matches = generateMatches([...players]);

    for (const match of matches) {
        const matchItem = document.createElement('li');
        matchItem.textContent = `${match[0]} vs ${match[1]}`;
        matchesList.appendChild(matchItem);
    }

    matchesContainer.appendChild(matchesList);
    component.appendChild(matchesContainer);

    const buttonNext = document.createElement('button');
    buttonNext.textContent = 'Start tournament';
    buttonNext.addEventListener('click', () => {
        component.innerHTML = '';
        loadGameView(component, matches[0]);
    });
    component.appendChild(buttonNext);
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
    cssLoadFunction([]);

    // Crea el formulario
    loadFormView(component);
}
