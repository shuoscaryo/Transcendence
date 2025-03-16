import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import { usernameOk } from '../../../utils/validators.js';

async function fetchProfileData(isLogged, path, offset = 0, limit = 10) {
    let url;
    if (path.subPath === '/') {
        url = `/api/profile/?offset=${offset}&limit=${limit}`;
    } else {
        const username = path.subPath.split('/')[1];
        url = `/api/profile/${username}?offset=${offset}&limit=${limit}`;
    }

    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
    });
    if (!response.ok) {
        return { status: response.status, error: await response.json() };
    }
    return response.json();
}

function getProfileHeader(profile) {
    const component = document.createElement('section');
    component.id = 'header';
    component.classList.add('section-block');

    const userDiv = document.createElement('div');
    userDiv.id = 'user';
    component.appendChild(userDiv);

    const profileImage = document.createElement('img');
    profileImage.src = profile.profile_photo;
    userDiv.appendChild(profileImage);

    const userInfo = document.createElement('div');
    userInfo.id = 'user-info';
    userDiv.appendChild(userInfo);

    const username = document.createElement('h1');
    username.textContent = profile.username;
    userInfo.appendChild(username);

    const randomData = document.createElement('div');
    randomData.id = 'random-data';
    userInfo.appendChild(randomData);

    const joined = document.createElement('p');
    joined.innerHTML = `<b>Joined:</b> ${profile.date_joined}`;
    randomData.appendChild(joined);

    const lastOnline = document.createElement('p');
    lastOnline.innerHTML = `<b>Last online:</b> ${profile.last_online}`;
    randomData.appendChild(lastOnline);

    const searchAnotherUser = document.createElement('div');
    searchAnotherUser.id = 'search-another-user';
    component.appendChild(searchAnotherUser);

    const searchText = document.createElement('p');
    searchText.textContent = 'Search another user';
    searchAnotherUser.appendChild(searchText);

    const inputDiv = document.createElement('div');
    inputDiv.id = 'search-input-div';
    searchAnotherUser.appendChild(inputDiv);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Username';
    inputDiv.appendChild(searchInput);

    const searchButton = getDefaultButton({
        bgColor: 'var(--color-lime)',
        content: 'Search',
        onClick: () => {
            if (searchInput.value === '')
                return;
            navigate(`/pages/main/profile/${searchInput.value}`);
        }
    })
    searchButton.id = 'search-button';
    inputDiv.appendChild(searchButton);

    return component;
}

function getStats(profile) {
    const component = document.createElement('div');
    component.id = 'stats';
    component.classList.add('section-block');

    return component;
}

function secondsToMS(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function isScoreValid(score) {
    for (let i = 0; i < score.length; i++) {
        if (score[i] < '0' || score[i] > '9') return false;
    }
    return true;
}

function getnewMatchForm(profile) {
    function getInputRow(label, type, name, value, required = true) {
        const component = document.createElement('div');
        component.classList.add('input-row');
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        const input = document.createElement('input');
        input.type = type;
        input.name = name;
        input.value = value;
        input.required = required;
        component.append(labelElement, input);
        return component;
    }

    const component = document.createElement('form');
    component.method = "POST";
    
    const playerLeftDiv = getInputRow('Player Left:', 'text', 'playerLeft', profile.username, true);
    component.appendChild(playerLeftDiv);

    const playerRightDiv = getInputRow('Player Right:', 'text', 'playerRight', 'player2', false);
    component.appendChild(playerRightDiv);

    const scoreLeftDiv = getInputRow('Score Left:', 'number', 'scoreLeft', 10, true);
    component.appendChild(scoreLeftDiv);

    const scoreRightDiv = getInputRow('Score Right:', 'number', 'scoreRight', 5, true);
    component.appendChild(scoreRightDiv);

    const durationDiv = getInputRow('Duration (s):', 'number', 'duration', 120, true);
    component.appendChild(durationDiv);
    
    // Campo matchType
    const matchTypeDiv = document.createElement('div');
    matchTypeDiv.classList.add('input-row');
    const matchTypeLabel = document.createElement('label');
    matchTypeLabel.textContent = 'Match Type:';
    const matchTypeSelect = document.createElement('select');
    matchTypeSelect.name = 'matchType';
    const types = ['local', 'AI', 'online'];
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        if (type === 'local') option.selected = true;
        matchTypeSelect.appendChild(option);
    });
    matchTypeDiv.append(matchTypeLabel, matchTypeSelect);
    component.appendChild(matchTypeDiv);

    // Botón de submit
    const submitButton = getDefaultButton({
        bgColor: 'var(--color-lime)',
        content: 'Create Match',
    });
    component.addEventListener('submit', async (event) => {
        event.preventDefault(); // ❌ Evita que el formulario recargue la página
    
        const formData = new FormData(component);
        const data = Object.fromEntries(formData.entries()); // Convierte a JSON
    
        if (!usernameOk(data.playerLeft)) {
            alert('Invalid player left');
            return;
        }
        if (data.matchType === 'online' && data.playerRight !== '' && !usernameOk(data.playerRight)) {
            alert('Invalid player right');
            return;
        }
        if (!isScoreValid(data.scoreLeft) || !isScoreValid(data.scoreRight)) {
            alert('Invalid scores');
            return;
        }
        if (!isScoreValid(data.duration)) {
            alert('Invalid duration');
            return;
        }
        try {
            const response = await fetch('/api/add-match', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
    
            if (response.ok) {
                alert('Match added successfully!');
                navigate();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Failed to add match');
        }
    });
    
    component.appendChild(submitButton);

    return component;
}

function getPlayerLink(username, profile, realUser = true) {
    const component = document.createElement('a');
    component.classList.add('player-link');
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
    const component = document.createElement('div');
    if (match.matchType.startsWith('tournament'))
        component.classList.add('tournament');
    component.classList.add('match');

    const img = document.createElement('img');
    if (match.matchType.startsWith('tournament'))
        img.src = Path.img('match_tournament.png');
    else
        img.src = Path.img(`match_${match.matchType}.png`);
    img.alt = match.matchType;
    component.appendChild(img);

    const playersDiv = document.createElement('div');
    playersDiv.classList.add('players-div');
    component.appendChild(playersDiv);

    const scoreDiv = document.createElement('div');
    scoreDiv.classList.add('score');
    component.appendChild(scoreDiv);

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
            if (i % rowLength === 0) {
                playersColumnDiv = document.createElement('div');
                playersColumnDiv.classList.add('players-column-div');
                playersDiv.appendChild(playersColumnDiv);
            }
            const player = getPlayerLink(
                match.players[i],
                profile,
                match.matchType === 'tournament-online'
            );
            playersColumnDiv.appendChild(player);
        }
        scoreDiv.textContent = `${match.winner} won`;
        if (match.winner === profile.username)
            component.classList.add('won-match');
        else
            component.classList.add('lost-match');
    }

    const durationDiv = document.createElement('div');
    durationDiv.textContent = secondsToMS(match.duration);
    component.appendChild(durationDiv);

    const startTimeDiv = document.createElement('div');
    startTimeDiv.classList.add('start-time');
    const date = match.start_date.split(' ');
    startTimeDiv.innerHTML = `${date[0]}<br>${date[1]}`;
    component.appendChild(startTimeDiv);

    return component;
}

function getMatchHistorySection(profile, matchHistory) {
    const component = document.createElement('section');
    component.id = 'match-history-section';
    component.classList.add('section-block');

    const addNewMatchDiv = getnewMatchForm(profile);
    addNewMatchDiv.id = 'new-match-form';
    component.appendChild(addNewMatchDiv);

    const matchHistoryDiv = document.createElement('div');
    matchHistoryDiv.id = 'match-history-div';
    component.appendChild(matchHistoryDiv);

    const title = document.createElement('div');
    title.id = 'title';
    title.textContent = 'Match History';
    matchHistoryDiv.appendChild(title);

    if (matchHistory.length === 0) {
        const noMatches = document.createElement('p');
        noMatches.id = 'no-matches';
        noMatches.textContent = 'No matches yet';
        matchHistoryDiv.appendChild(noMatches);
        return component;
    }
    
    matchHistory.forEach(match => {
        const row = getMatchHistoryRow(profile, match);
        matchHistoryDiv.appendChild(row);
    });

    return component;
}

export default async function getView(isLogged, path) {
    if (!isLogged && path.subPath === '/') {
        return { status: 300, redirect: "/pages/login/login" };
    }

    const css = [
        Path.css('main/profile.css'),
    ];
    const component = document.createElement('div');

    const profileData = await fetchProfileData(isLogged, path);
    if (profileData.status && profileData.status !== 200) {
        return profileData;
    }

    const { profile, match_history } = profileData;

    component.appendChild(getProfileHeader(profile));
    component.appendChild(getStats(profile));
    component.appendChild(getMatchHistorySection(profile, match_history));

    return { status: 200, component, css };
}