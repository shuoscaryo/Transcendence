

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

// Load all the screens into an object (to access them by ID)
// class screen objects can contain data-name attribute to be used in the URL
const SCREENS = {};
document.querySelectorAll('.screen').forEach(screen => {
  SCREENS[screen.id] = screen;
});

/**
 * Displays the specified screen, hides all others, and optionally updates
 * browser history.
 *
 * @param {HTMLElement} screen - The screen element to display. This should be
 *     one of the elements in the `SCREENS` object, where each key is the `id`
 *     of an element with the class "screen" in the html.
 *     (e.g., `SCREENS.mainScreen`).
 * @param {boolean} [saveHistory=true] - Whether to add the loaded page to the
 *     browser history.
 * @param {boolean} [replaceHistory=false] - Whether to replace the current
 *     history entry (only applies if saveHistory is true).
 * @param {string|null} [screenName=null] - The name of the screen to be used
 *     in the URL and history state. If not provided, the function will use the
 *     screen's `data-name` attribute, or the `id` if `data-name` is not
 *     available.
 *
 * @example
 * // Show the main screen with default options (history is updated)
 * showScreen(SCREENS.mainScreen);
 * 
 * @example
 * // Show the settings screen without updating the browser history
 * showScreen(SCREENS.settingsScreen, { saveHistory: false });
 */
function showScreen(screen, {saveHistory = true, replaceHistory = false, screenName = null} = {})
{
	// Get the screen name in this order: screenName, screen.dataset.name, screen.id
	if (screenName === null)
	{
		if (screen.dataset.name != undefined)
			screenName = screen.dataset.name;
		else 
			screenName = screen.id.replace('Screen', '');
	}

	// Show only the selected screen
	Object.values(SCREENS).forEach(section => {section.style.display = 'none';});
    screen.style.display = 'block';

    // Update the browser history
	if (saveHistory && (!history.state || screenName != history.state.screen))
	{
		if (replaceHistory)
			history.replaceState({ screen: screenName }, null, screenName == '' ? window.location.pathname : `#${screenName}`);
		else
    		history.pushState({ screen: screenName }, null, screenName == '' ? window.location.pathname : `#${screenName}`);
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
    showScreen(SCREENS.mainScreen, {saveHistory:false});
};

// Event listeners for buttons
versusButton.addEventListener('click', () => {
    showScreen(SCREENS.versusScreen);
});

tournamentButton.addEventListener('click', () => {
    showScreen(SCREENS.tournamentSetupScreen);
});

backToMainVersus.addEventListener('click', () => {
	resetGame(versusCanvas); // This function is defined in game.js
    showScreen(SCREENS.mainScreen);
});

backToMainSetup.addEventListener('click', () => {
	clearAllPlayers();  // This function is defined in tournament.js
	resetGame(tournamentCanvas);  // This function is defined in game.js
    showScreen(SCREENS.mainScreen);
});

backToTournamentGameplay.addEventListener('click', () => {
	resetGame(tournamentCanvas);  // Reset the game
	resetTournament();  // Reset the tournament
	showScreen(SCREENS.tournamentSetupScreen);
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
        showScreen(SCREENS.tournamentGameplayScreen);  // Switch to the gameplay screen
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
