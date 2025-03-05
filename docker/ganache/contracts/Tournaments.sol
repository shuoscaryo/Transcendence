// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Tournaments {
    // Structure to store tournament data
    struct Tournament {
        uint256 id;             // Unique ID of the tournament
		uint256 rounds;		    // Number of rounds in the tournament
        string[] players;       // List of player names
        string winner;          // Winner of the tournament (name)
        uint256 date;           // Completion timestamp
    }

    // Mapping to store tournaments by ID
    mapping(uint256 => Tournament) public tournaments;

    // Counter to assign unique IDs to tournaments
    uint256 public tournamentCount;

    // Event to notify when a tournament is created
    event TournamentCreated(uint256 id, string[] players);

    // Function to create a new tournament
    function createTournament(string[] memory _players, string memory _winner) public {
        // Increment the tournament counter
        tournamentCount++;

        // Create and store the tournament
        tournaments[tournamentCount] = Tournament({
            id: tournamentCount,
			rounds: _players.length - 1,
            players: _players,
            winner: _winner, // Initially no winner
            date: block.timestamp // Not completed yet
        });

        // Emit event
        emit TournamentCreated(tournamentCount, _players);
    }

    // Function to retrieve a tournament by ID
    function getTournament(uint256 _id)
		public
		view
		returns (
			uint256 id,
			uint256 rounds,
			string[] memory players,
			string memory winner,
			uint256 date
		)
	{
		require(_id > 0 && _id <= tournamentCount, "Tournament not found");
		Tournament memory t = tournaments[_id];
		return (t.id, t.rounds, t.players, t.winner, t.date);
	}
}
