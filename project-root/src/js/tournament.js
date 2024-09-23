let players = ["Nachorte", "Shuoscaryo", "PabloEscobar", "Fideos"]; // Example players
let currentMatch = 0; // Keep track of the current match
let player1, player2; // Players for the current match
let tournamentCanvas = document.getElementById('pongTournamentGame'); // Tournament canvas

// Function to start the tournament
function startTournament() {
    showScreen(tournamentScreen);  // Show the tournament screen

    // Display player list
    let playerList = document.getElementById('playerList');
    playerList.innerHTML = '';
    players.forEach(player => {
        let li = document.createElement('li');
        li.textContent = player;
        playerList.appendChild(li);
    });

    // Start the first match
    setupNextMatch();
}

// Function to set up the next match
function setupNextMatch() {
    if (currentMatch >= players.length / 2) {
        alert('Tournament over! The winner is: ' + players[0]);  // End of tournament
        return;
    }

    // Select players for the current match
    player1 = players[currentMatch * 2];
    player2 = players[currentMatch * 2 + 1];

    // Display match info
    document.getElementById('player1Name').textContent = player1;
    document.getElementById('player2Name').textContent = player2;
    document.getElementById('matchInfo').style.display = 'block';

    // Reset the game and start with the tournament canvas
    resetGame();
    startGame(tournamentCanvas);

    document.getElementById('nextMatchButton').style.display = 'none';
}

// Function to end the current match and prepare for the next
/*function endMatch() {
    stopGameLoop();  // Stop the game loop
    document.getElementById('nextMatchButton').style.display = 'block';  // Show the next match button
}*/

// Function to advance to the next match
document.getElementById('nextMatchButton').addEventListener('click', () => {
    currentMatch++;
    setupNextMatch();  // Proceed to the next match
});

// Event listener to start the tournament
document.getElementById('startTournamentButton').addEventListener('click', startTournament);
