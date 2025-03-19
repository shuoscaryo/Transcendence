import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import newElement from '/static/js/utils/newElement.js';
import fetchMatchHistory from '/static/js/utils/api/fetchMatchHistory.js';

import getCreateELementsDiv from './manualCreateMatches.js';

function secondsToMS(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getPlayerLink(username, profile, realUser = true) {
    const component = newElement('a', {classList: ['player-link']});
    component.textContent = username;
    if (!realUser || username === profile.username)
        component.classList.add('no-link');
    else {
        component.addEventListener('click', () => {
            navigate(`/pages/main/profile/${username}`);
        });
    }

    if (username === profile.username)
        component.style.fontWeight = 'bold';

    return component;
}

function getMatchHistoryRow(profile, match) {
    const component = newElement('div', {classList: ['match']});
    if (match.matchType.startsWith('tournament'))
        component.classList.add('tournament');

    // component
    const img = newElement('img', {parent: component});
    if (match.matchType.startsWith('tournament'))
        img.src = Path.img('match_tournament.png');
    else
        img.src = Path.img(`match_${match.matchType}.png`);
    img.alt = match.matchType;
    const playersDiv = newElement('div', {parent: component, classList: ['players-div', 'match-div']});
    const scoreDiv = newElement('div', {parent: component, classList: ['score', 'match-div']});

    // component (playersDiv && scoreDiv)
    if (match.matchType === 'local') {
        playersDiv.classList.add('players-local');
        playersDiv.textContent = 'Local match';
        scoreDiv.textContent = `${match.scoreLeft} - ${match.scoreRight}`;
    }
    else if (match.matchType === 'AI') {
        playersDiv.classList.add('players-normal');
        const player1 = getPlayerLink(match.playerLeft__username, profile);
        const player2 = getPlayerLink('AI', profile, false);
        playersDiv.append(player1, player2);
        scoreDiv.textContent = `${match.scoreLeft} - ${match.scoreRight}`;
        if (match.scoreLeft > match.scoreRight)
            component.classList.add('won-match');
        else
            component.classList.add('lost-match');
    }
    else if (match.matchType === 'online') {
        playersDiv.classList.add('players-normal');
        const player1 = getPlayerLink(match.playerLeft__username, profile);
        const player2 = getPlayerLink(match.playerRight__username, profile);
        playersDiv.append(player1, player2);
        scoreDiv.textContent = `${match.scoreLeft} - ${match.scoreRight}`;
        // username is left user XNOR left user won (if both conditions are same then its a win)
        if ((profile.username === match.playerLeft__username)
            === (match.scoreLeft > match.scoreRight))
            component.classList.add('won-match');
        else
            component.classList.add('lost-match');
    }
    else if (match.matchType.startsWith('tournament')) {
        playersDiv.classList.add('players-tournament');
        const rowLength = 4;
        let playersColumnDiv;
        for (let i = 0; i < match.players.length; i++) {
            if (i % rowLength === 0)
                playersColumnDiv = newElement('div', {parent: playersDiv, classList: ['players-column-div']});
            const player = getPlayerLink(
                match.players[i],
                profile,
                match.matchType === 'tournament-online'
            );
            playersColumnDiv.append(player);
        }
        scoreDiv.textContent = `${match.winner} won`;
        if (match.winner === profile.username)
            component.classList.add('won-match');
        else
            component.classList.add('lost-match');
    }

    // component
    const durationDiv = newElement('div', {parent: component, classList: ['duration', 'match-div']});
    durationDiv.textContent = secondsToMS(match.duration);
    const startTimeDiv = newElement('div', {parent: component, classList: ['start-time', 'match-div']});
    const date = match.start_date.split(' ');
    startTimeDiv.innerHTML = `${date[0]}<br>${date[1]}`;

    return component;
}

export default function getMatchHistorySection(profile, matchHistory, path) {
    const component = newElement('section', {id: 'match-history-section', classList: ['section-block']});

    //component
    const createElementsDiv = getCreateELementsDiv(profile);
    component.append(createElementsDiv);
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

    let offset = 10;
    const matchesPerFetch = 5;
    const getMoreButton = getDefaultButton({
        bgColor: 'var(--color-dark-gray)',
        content: 'Get more matches',
        onClick: async () => {
            getMoreButton.disabled = true;
            const matchHistoryData = await fetchMatchHistory(path.subPath, offset, matchesPerFetch);
            if (matchHistoryData.status && matchHistoryData.status !== 200) {
                getMoreButton.disabled = false;
                return;
            }
            const matchHistory = matchHistoryData.data.matches;
            let maxMatches = matchHistoryData.data.total_matches;
            matchHistory.forEach(match => {
                matchHistoryRows.append(getMatchHistoryRow(profile, match));
            });
            offset += matchesPerFetch;
            if (offset >= maxMatches)
                offset = maxMatches;
            getMoreButton.disabled = false;
        }
    });
    getMoreButton.id = 'get-more-matches';
    matchHistoryDiv.append(getMoreButton);

    return component;
}