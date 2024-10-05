// Get references to the screens and buttons
const mainScreen = document.getElementById('mainScreen');
const versusScreen = document.getElementById('versusScreen');
const tournamentSetupScreen = document.getElementById('tournamentSetupScreen');
const tournamentGameplayScreen = document.getElementById('tournamentGameplayScreen');


// Main screen buttons
const versusButton = document.getElementById('versusButton');
const tournamentButton = document.getElementById('tournamentButton');

// Versus screen buttons
const startGameButton = document.getElementById('startGameButton');
const backToMainVersus = document.getElementById('backToMainVersus');

// Versus canvas
const versusCanvas = document.getElementById('pongVersusGame');

// Tournament screen buttons
const backToMainSetup = document.getElementById('backToMainSetup');
const backToTournamentGameplay = document.getElementById('backToTournamentGameplay');
const addPlayerButton = document.getElementById('addPlayerButton');

// Tournament variables
const tournamentCanvas = document.getElementById('pongTournamentGame');
const playerNameInput = document.getElementById('playerNameInput');  // Input field for player names

// Function to show screens and update browser history
function showScreen(screen, screenName, {saveHistory = true, replaceHistory = false} = {}) {
    // Hide all screens
    const screens = [mainScreen, versusScreen, tournamentSetupScreen, tournamentGameplayScreen];
    screens.forEach(s => s.style.display = 'none');

    // Show the selected screen
    screen.style.display = 'block';

    // Update the browser history
	if (saveHistory && screenName != history.state.screen)
	{
		if (replaceHistory)
			history.replaceState({ screen: screenName }, null, `#${screenName}`);
		else
    		history.pushState({ screen: screenName }, null, `#${screenName}`);
	}
}

// Handle browser back and forward button navigation
window.onpopstate = (event) => {
	const screen = event.state.screen;
	if (screen)
		showScreen(document.getElementById(`${screen}Screen`), screen, {saveHistory:false});
	else
		history.back();
};

// Initial page load
window.onload = () => {
	history.replaceState({ screen: 'main' }, null, null);
    showScreen(mainScreen, 'main');
};

// Event listeners for buttons
versusButton.addEventListener('click', () => {
    showScreen(versusScreen, 'versus');
});

tournamentButton.addEventListener('click', () => {
    showScreen(tournamentSetupScreen, 'tournamentSetup');
});

backToMainVersus.addEventListener('click', () => {
	resetGame(versusCanvas); // This function is defined in game.js
    showScreen(mainScreen, 'main');
});

backToMainSetup.addEventListener('click', () => {
	clearAllPlayers();  // This function is defined in tournament.js
	resetGame(tournamentCanvas);  // This function is defined in game.js
    showScreen(mainScreen, 'main');
});

backToTournamentGameplay.addEventListener('click', () => {
	resetGame(tournamentCanvas);  // Reset the game
	resetTournament();  // Reset the tournament
	showScreen(tournamentSetupScreen, 'tournamentSetup');
});

// Function to start the game (linking to the game logic in game.js)
startGameButton.addEventListener('click', () => {
	player1 = "Player 1";
	player2 = "Player 2";
    startGame(versusCanvas);  // Pass the canvas element, not the event
});

// Event listener for starting the tournament (switch to gameplay screen)
startTournamentButton.addEventListener('click', () => {
    if (players.length < 2) {
        alert('You need at least 2 players to start the tournament.');
    } else {
        showScreen(tournamentGameplayScreen, "tournamentGameplay");  // Switch to the gameplay screen
        startTournament();  // Start the tournament logic
    }
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
