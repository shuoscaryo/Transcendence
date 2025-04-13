import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import newElement from '/static/js/utils/newElement.js';
import { formatDate } from '/static/js/utils/time.js';
import ViewScope from '/static/js/utils/ViewScope.js';
import { lastGamesStats } from './statsSection.js';

function secondsToMS(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getPlayerLink(displayName, profile, realUser = true) {
    const component = newElement('a', {classList: ['player-link']});
    component.textContent = displayName;
    if (!realUser || displayName === profile.display_name)
        component.classList.add('no-link');
    else {
        component.addEventListener('click', () => {
            navigate(`/main/profile/${displayName}`);
        });
    }

    if (displayName === profile.display_name)
        component.style.fontWeight = 'bold';

    return component;
}

function getTournamentInfoDiv(profile, matches) {
    const component = newElement('div', {classList: ['tournament-info-div']});

    let currentIndex = 0;
    let roundNumber = 1;
    let matchesRemaining = matches.length;

    while (matchesRemaining > 0) {
        const roundDiv = newElement('div', {classList: ['round-block'], parent: component});
        newElement('div', {
            textContent: `Round ${roundNumber}`,
            classList: ['round-title'],
            parent: roundDiv
        });

        const matchesContainer = newElement('div', {classList: ['round-matches'], parent: roundDiv});
        const matchCount = Math.pow(2, Math.floor(Math.log2(matchesRemaining + 1)) - 1);

        for (let i = 0; i < matchCount && currentIndex < matches.length; i++, currentIndex++) {
            const match = matches[currentIndex];
            const matchDiv = newElement('div', {classList: ['mini-match', 'match-div'], parent: matchesContainer});
        
            const p1 = match.playerLeft;
            const p2 = match.playerRight;
        
            if (!p1 || !p2) {
                const skipper = p1 || p2;
                matchDiv.textContent = `${skipper} skips`;
            } else {
                matchDiv.textContent = `${p1} vs ${p2} : ${match.scoreLeft} - ${match.scoreRight}`;
            }
        }

        matchesRemaining -= matchCount;
        roundNumber++;
    }

    return component;
}

function getMatchHistoryRow(profile, match) {
    if (match.match_type.startsWith('tournament')) {
        const tournamentDiv = newElement('div', {classList: ['tournament-div']});
        const matchDiv = getNormalMatchDiv(profile, match);
        tournamentDiv.append(matchDiv);
        if (matchDiv.classList.contains('won-match'))
            tournamentDiv.classList.add('won-match');
        else
            tournamentDiv.classList.add('lost-match');
        const toggleButton = newElement('button', {
            classList: ['toggle-button'],
            parent: matchDiv,
        });
        toggleButton.textContent = '▼';
        
        const matchesDiv = getTournamentInfoDiv(profile, match.matches);
        tournamentDiv.append(matchesDiv);
        let isHidden = true;
        matchesDiv.style.display = 'none';
        toggleButton.addEventListener('click', () => {
            isHidden = !isHidden;
            matchesDiv.style.display = isHidden ? 'none' : 'block';
            toggleButton.textContent = isHidden ? '▼' : '▲';
        });
        return tournamentDiv;
    } else
        return getNormalMatchDiv(profile, match);
}
function getNormalMatchDiv(profile, match) {
    const component = newElement('div', {classList: ['match']});
    if (match.match_type.startsWith('tournament'))
        component.classList.add('tournament');

    // component
    const img = newElement('img', {parent: component});
    if (match.match_type.startsWith('tournament'))
        img.src = Path.img('match_tournament.png');
    else
        img.src = Path.img(`match_${match.match_type}.png`);
    const playersDiv = newElement('div', {parent: component, classList: ['players-div', 'match-div']});
    const scoreDiv = newElement('div', {parent: component, classList: ['score', 'match-div']});

    // component (playersDiv && scoreDiv)
    if (match.match_type === 'local') {
        playersDiv.classList.add('players-local');
        playersDiv.textContent = 'Local match';
        scoreDiv.textContent = `${match.score_left} - ${match.score_right}`;
    }
    else if (match.match_type === 'AI') {
        playersDiv.classList.add('players-normal');
        const player1 = getPlayerLink(match.player_left__display_name, profile);
        const player2 = getPlayerLink('AI', profile, false);
        playersDiv.append(player1, player2);
        scoreDiv.textContent = `${match.score_left} - ${match.score_right}`;
        if (match.score_left > match.score_right)
            component.classList.add('won-match');
        else
            component.classList.add('lost-match');
    }
    else if (match.match_type === 'online') {
        playersDiv.classList.add('players-normal');
        const player1 = getPlayerLink(match.player_left__display_name, profile);
        const player2 = getPlayerLink(match.player_right__display_name, profile);
        playersDiv.append(player1, player2);
        scoreDiv.textContent = `${match.score_left} - ${match.score_right}`;
        // username is left user XNOR left user won (if both conditions are same then its a win)
        if ((profile.display_name === match.player_left__display_name)
            === (match.score_left > match.score_right))
            component.classList.add('won-match');
        else
            component.classList.add('lost-match');
    }
    else if (match.match_type.startsWith('tournament')) {
        playersDiv.classList.add('players-tournament');
        const rowLength = 4;
        let playersColumnDiv;
        for (let i = 0; i < match.players.length; i++) {
            if (i % rowLength === 0)
                playersColumnDiv = newElement('div', {parent: playersDiv, classList: ['players-column-div']});
            const player = getPlayerLink(
                match.players[i],
                profile,
                match.match_type === 'tournament-online'
            );
            playersColumnDiv.append(player);
        }
        scoreDiv.textContent = `${match.winner} won`;
        if (match.winner === profile.display_name)
            component.classList.add('won-match');
        else
            component.classList.add('lost-match');
    }

    // component
    const durationDiv = newElement('div', {parent: component, classList: ['duration', 'match-div']});
    durationDiv.textContent = secondsToMS(match.duration);
    const startTimeDiv = newElement('div', {parent: component, classList: ['start-time', 'match-div']});
    startTimeDiv.textContent = formatDate(match.start_date);

    return component;
}

export default function getMatchHistorySection(profile, matchHistory, path) {
    const component = newElement('section', {id: 'match-history-section', classList: ['section-block']});

    //component
    const matchHistoryDiv = newElement('div', {id: 'match-history-div', parent: component});

    // component matchHistoryDiv
    const title = newElement('div', {classList: ['subsection-title'], parent: matchHistoryDiv});
    title.textContent = 'Match History';

    if (matchHistory.length === 0) {
        const noMatches = newElement('p', {id: 'no-matches', parent: matchHistoryDiv});
        noMatches.textContent = 'No matches yet';
        return component;
    }

    const matchHistoryRows = newElement('div', {id: 'match-history-rows', parent: matchHistoryDiv});

    // component matchHistoryDiv matchHistoryRows
    matchHistory.forEach(match => {
        matchHistoryRows.append(getMatchHistoryRow(profile, match));
    });

    let currMatchDisplayed = 10;
    const matchesPerFetch = 5;
    const getMoreButton = getDefaultButton({
        bgColor: 'var(--color-dark-gray)',
        content: 'Get more matches',
        onClick: async () => {
            getMoreButton.disabled = true;
            ViewScope.request(
                'GET',
                `${Path.API.MATCH_HISTORY}${path.subPath}?offset=0&limit=${currMatchDisplayed + matchesPerFetch}`,
                {
                    onResolve: (res) => {
                        if (res.status !== 200) {
                            getMoreButton.disabled = false;
                            return;
                        }
                        const matchHistory = res.data.matches;
                        let maxMatches = res.data.total_matches;
                        if (matchHistory.length === 0) {
                            getMoreButton.disabled = true;
                            return;
                        }
                        matchHistoryRows.innerHTML = '';
                        matchHistory.forEach(match => {
                            matchHistoryRows.append(getMatchHistoryRow(profile, match));
                        });
                        currMatchDisplayed += matchesPerFetch;
                        if (currMatchDisplayed >= maxMatches)
                            currMatchDisplayed = maxMatches;

                        // update lastGamesStats
                        const lastGamesDiv = document.querySelector('#last-games-stats');
                        if (lastGamesDiv)
                            lastGamesDiv.replaceWith(lastGamesStats(matchHistory, profile));
                        getMoreButton.disabled = false;
                    },
                    onThrow: () => {
                        getMoreButton.disabled = false;
                    }
                }
            );
        }
    });
    getMoreButton.id = 'get-more-matches';
    matchHistoryDiv.append(getMoreButton);

    return component;
}