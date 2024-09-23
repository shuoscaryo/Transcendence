// Get references to the screens and buttons
const mainScreen = document.getElementById('mainScreen');
const versusScreen = document.getElementById('versusScreen');
const tournamentScreen = document.getElementById('tournamentScreen');


// Main screen buttons
const versusButton = document.getElementById('versusButton');
const tournamentButton = document.getElementById('tournamentButton');

// Versus screen buttons
const startGameButton = document.getElementById('startGameButton');
const backToMainVersus = document.getElementById('backToMainVersus');

// Versus canvas
const versusCanvas = document.getElementById('pongVersusGame');

// Tournament screen buttons
const backToMainTournament = document.getElementById('backToMainTournament');
const startTournamentButton = document.getElementById('startTournamentButton');
const nextMatchButton = document.getElementById('nextMatchButton');
const addPlayerButton = document.getElementById('addPlayerButton');

// Tournament variables
const tournamentCanvas = document.getElementById('pongTournamentGame');
const playerNameInput = document.getElementById('playerNameInput');  // Input field for player names

// Function to show a screen and hide the others
function showScreen(screen) {
    mainScreen.classList.remove('active');
    versusScreen.classList.remove('active');
    tournamentScreen.classList.remove('active');
    
    screen.classList.add('active');
}

// Event listeners for buttons
versusButton.addEventListener('click', () => {
    showScreen(versusScreen);
});

tournamentButton.addEventListener('click', () => {
    showScreen(tournamentScreen);
});

backToMainVersus.addEventListener('click', () => {
	resetGame(versusCanvas); // This function is defined in game.js
    showScreen(mainScreen);
});

backToMainTournament.addEventListener('click', () => {
    showScreen(mainScreen);
});

// Function to start the game (linking to the game logic in game.js)
startGameButton.addEventListener('click', () => {
    startGame(versusCanvas);  // Pass the canvas element, not the event
});

// Event listener for adding a player
addPlayerButton.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();  // Get the player name and trim whitespace
    if (playerName) {
        addPlayerToList(playerName);  // Call the function to add the player to the list (in tournament.js)
        playerNameInput.value = '';  // Clear the input field
    } else {
        alert("Please enter a valid player name");  // Alert the user if no name was entered
    }
});
