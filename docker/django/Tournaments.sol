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

    struct UserData {
        uint[] tournamentsPlayed;
        uint wins;
        uint totalDuration;
    }

    uint public nextId = 0;

    mapping(uint => Tournament) public tournaments;
    mapping(uint => UserData) public userData;

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

        for (uint i = 0; i < _playerIds.length; i++) {
            uint playerId = _playerIds[i];
            if (playerId != 0) {
                userData[playerId].tournamentsPlayed.push(nextId);
                userData[playerId].totalDuration += _duration;
            }
        }

        if (_winnerId != 0) {
            userData[_winnerId].wins += 1;
        }

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

    // Get tournament data by user index
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
        require(index < userData[userId].tournamentsPlayed.length, "Index out of bounds");
        uint tournamentId = userData[userId].tournamentsPlayed[index];
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
        require(tournamentIndex < userData[userId].tournamentsPlayed.length, "Tournament index out of bounds");
        uint tournamentId = userData[userId].tournamentsPlayed[tournamentIndex];
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

    // Get tournament count for a user
    function getTournamentCountForUser(uint userId) public view returns (uint) {
        return userData[userId].tournamentsPlayed.length;
    }

    // Get wins for a user
    function getWinCount(uint userId) public view returns (uint) {
        return userData[userId].wins;
    }

    // Get total duration for a user
    function getTotalDuration(uint userId) public view returns (uint) {
        return userData[userId].totalDuration;
    }
}
