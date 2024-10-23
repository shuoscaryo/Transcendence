let currentMatch = 0; // Keep track of the current match
let i = 0; // Iterator for the currentPlayers array
let player1, player2; // Players for the current match
const clearPlayersButton = document.getElementById('clearPlayersButton');
const startTournamentButton = document.getElementById('startTournamentButton');
const nextMatchButton = document.getElementById('nextMatchButton');
const startMatchButton = document.getElementById('startMatchButton');

// Array to store the players
let players = [];

// Array to store current players
let currentPlayers = [];

// Function to remove a player
function removePlayer(playerName) {
    players = players.filter(player => player !== playerName);
}

// Function to add a player to the list
function addPlayerToList(playerName) {
    if (players.length < 8) {
        players.push(playerName);

        const playerListElement = document.getElementById('playerList');
        const listItem = document.createElement('li');
        listItem.textContent = playerName;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.style.marginLeft = '10px';
        removeButton.addEventListener('click', () => {
            removePlayer(playerName);
            listItem.remove();
        });

        listItem.appendChild(removeButton);
        playerListElement.appendChild(listItem);
    } else {
        alert('Maximum number of players reached');
    }
}

// Clear all players
clearPlayersButton.addEventListener('click', () => {
    clearAllPlayers();
});

function clearAllPlayers() {
    players = [];
    const playerListElement = document.getElementById('playerList');
    playerListElement.innerHTML = '';
}

function startTournament() {
    currentMatch = 0;
	i = 0;
	currentPlayers = players.slice();  // Copy the players array
    showNextMatch();
}

// Show the next match
function showNextMatch() {
    if (currentPlayers.length <= 1) {
        alert('Tournament over! Winner is: ' + currentPlayers[0]);
        return;
    }

    player1 = currentPlayers[i];
    player2 = currentPlayers[i + 1];

    document.getElementById('player1Name').textContent = player1;
    document.getElementById('player2Name').textContent = player2;

    document.getElementById('matchInfo').style.display = 'block';
	document.getElementById('startMatchButton').style.display = 'inline';  // Show "Start Match" button
    document.getElementById('nextMatchButton').style.display = 'none';  // Hide "Next Match" button for now

    currentMatch++;
}

// Move to the next match
nextMatchButton.addEventListener('click', () => {
	console.log(currentPlayers);
	console.log(player1Score);
	console.log(player2Score);
	if (player1Score > player2Score) {
		currentPlayers.splice(i + 1, 1);  // Remove player 2
	} else {
		currentPlayers.splice(i, 1);  // Remove player 1
	}
	console.log(currentPlayers);
	i++;
	if (i + 1 >= currentPlayers.length) {
		i = 0;
	}
	resetGame(tournamentCanvas); // Reset the game
    showNextMatch();
});

// Event listener for starting the match
startMatchButton.addEventListener('click', () => {
    const canvas = document.getElementById('pongTournamentGame');  // Get the tournament canvas
    startGame(canvas);  // Pass the canvas to the startGame function
    document.getElementById('startMatchButton').style.display = 'none';  // Hide "Start Match" button
});

function resetTournament() {
	currentMatch = 0;
	i = 0;
	currentPlayers = [];
	document.getElementById('matchInfo').style.display = 'none';
}
