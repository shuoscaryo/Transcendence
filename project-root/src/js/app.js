// Get references to the screens and buttons
const mainScreen = document.getElementById('mainScreen');
const versusScreen = document.getElementById('versusScreen');
const tournamentScreen = document.getElementById('tournamentScreen');

const versusButton = document.getElementById('versusButton');
const tournamentButton = document.getElementById('tournamentButton');
const startGameButton = document.getElementById('startGameButton');

const backToMainVersus = document.getElementById('backToMainVersus');
const backToMainTournament = document.getElementById('backToMainTournament');

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
const versusCanvas = document.getElementById('pongVersusGame');
backToMainVersus.addEventListener('click', () => {
	resetGame(versusCanvas); // This function is defined in game.js
    showScreen(mainScreen);
});

backToMainTournament.addEventListener('click', () => {
    showScreen(mainScreen);
});

// Function to start the game (linking to the game logic in game.js)
startGameButton.addEventListener('click', () => {
    // Call startGame with the canvas, not the event
    startGame(versusCanvas);  // Pass the canvas element, not the event
});
