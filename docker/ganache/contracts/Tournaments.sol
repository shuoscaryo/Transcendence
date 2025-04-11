// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Tournaments {
    struct Match {
        string player1Name;
        uint player1;
        string player2Name;
        uint player2;
        uint score1;
        uint score2;
    }

    struct Tournament {
        string gameType; // "local" or "online"
        uint winnerId;
        string winnerName;
        uint[] playerIds;
        string[] playerNames;
        Match[] matches;
        string startDate;
        string duration;
    }

    uint public nextId = 0;

    mapping(uint => Tournament) public tournaments;
    mapping(uint => uint[]) public userTournaments;

    event TournamentCreated(uint tournamentId);

    // Create a tournament
    function addTournament(
        uint _winnerId,
        string memory _winnerName,
        uint[] memory _playerIds,
        string[] memory _playerNames,
        string memory _startDate,
        string memory _duration,
        string memory _gameType
    ) public {
        require(_playerIds.length == _playerNames.length, "IDs and names must match");

        Tournament storage t = tournaments[nextId];
        t.winnerId = _winnerId;
        t.winnerName = _winnerName;
        t.playerIds = _playerIds;
        t.playerNames = _playerNames;
        t.startDate = _startDate;
        t.duration = _duration;
        t.gameType = _gameType;

        emit TournamentCreated(nextId);
        nextId++;
    }

    // Add a match to a tournament
    function addMatch(
        uint tournamentId,
        string memory p1Name,
        uint p1,
        string memory p2Name,
        uint p2,
        uint s1,
        uint s2
    ) public {
        tournaments[tournamentId].matches.push(
            Match(p1Name, p1, p2Name, p2, s1, s2)
        );
    }

    // Link players to the tournament
    function addPlayerTournament(uint tournamentId, uint[] memory players) public {
        for (uint i = 0; i < players.length; i++) {
            userTournaments[players[i]].push(tournamentId);
        }
    }

    // Get tournament data
    function getTournament(uint id)
        public
        view
        returns (
            uint winnerId,
            string memory winnerName,
            uint[] memory playerIds,
            string[] memory playerNames,
            uint matchCount,
            string memory startDate,
            string memory duration,
            string memory gameType
        )
    {
        Tournament storage t = tournaments[id];
        return (
            t.winnerId,
            t.winnerName,
            t.playerIds,
            t.playerNames,
            t.matches.length,
            t.startDate,
            t.duration,
            t.gameType
        );
    }

    // Get a specific match
    function getMatch(uint tournamentId, uint matchIndex)
        public
        view
        returns (
            string memory p1Name,
            uint p1,
            string memory p2Name,
            uint p2,
            uint s1,
            uint s2
        )
    {
        Match storage m = tournaments[tournamentId].matches[matchIndex];
        return (
            m.player1Name,
            m.player1,
            m.player2Name,
            m.player2,
            m.score1,
            m.score2
        );
    }

    // Get tournaments a user has played in
    function getTournamentIdsForUser(uint userId) public view returns (uint[] memory) {
        return userTournaments[userId];
    }
}
