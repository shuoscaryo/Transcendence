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
        uint duration;
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
        uint _duration,
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

    // Get a tournament played by the index (0 is first ever played)
    function getUserTournament(uint userId, uint index)
        public
        view
        returns (
            uint winnerId,
            string memory winnerName,
            uint[] memory playerIds,
            string[] memory playerNames,
            uint matchCount,
            string memory startDate,
            uint duration,
            string memory gameType
        )
    {
        require(index < userTournaments[userId].length, "Index out of bounds");
        uint tournamentId = userTournaments[userId][index];
        Tournament storage t = tournaments[tournamentId];
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
    function getUserMatch(uint userId, uint tournamentIndex, uint matchIndex)
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
        require(tournamentIndex < userTournaments[userId].length, "Tournament index out of bounds");
        uint tournamentId = userTournaments[userId][tournamentIndex];
        require(matchIndex < tournaments[tournamentId].matches.length, "Match index out of bounds");

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

    // Get length of tournaments used played in
    function getTournamentCountForUser(uint userId) public view returns (uint) {
        return userTournaments[userId].length;
    }
}
