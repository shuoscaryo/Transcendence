let currentMatch = 0; // Keep track of the current match
let player1, player2; // Players for the current match
const clearPlayersButton = document.getElementById('clearPlayersButton');

// Array to store the players
let players = [];

function removePlayer(playerName) {
    // Remove the player from the array
    players = players.filter(player => player !== playerName);
}

// Function to add a player to the list
function addPlayerToList(playerName) {
    if (players.length < 8) {  // Limit the number of players to 8, for example
        players.push(playerName);  // Add the player to the array

        // Update the player list in the UI
        const playerListElement = document.getElementById('playerList');
        const listItem = document.createElement('li');
        listItem.textContent = playerName;

        // Create a "Remove" button for the player
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.style.marginLeft = '10px';  // Add some spacing
        removeButton.addEventListener('click', () => {
            removePlayer(playerName);  // Remove player when button is clicked
            listItem.remove();  // Remove the list item from the UI
        });

        listItem.appendChild(removeButton);  // Add the remove button to the list item
        playerListElement.appendChild(listItem);  // Append the list item to the <ul>
    } else {
        alert('Maximum number of players reached');
    }
}

// Event listener for clearing all players
clearPlayersButton.addEventListener('click', () => {
    clearAllPlayers();
});

function clearAllPlayers() {
    players = [];  // Empty the players array

    // Clear the player list in the UI
    const playerListElement = document.getElementById('playerList');
    playerListElement.innerHTML = '';  // Remove all list items from the UI
}


