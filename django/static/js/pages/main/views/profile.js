import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import { usernameOk } from '/static/js/utils/validators.js';
import newElement from '/static/js/utils/newElement.js';
import fetchProfileData from '/static/js/utils/api/fetchProfileData.js';

function getProfileHeader(profile) {
    const component = document.createElement('section');
    component.id = 'header';
    component.classList.add('section-block');

    const userDiv = document.createElement('div');
    userDiv.id = 'user';
    component.append(userDiv);

    const profileImage = document.createElement('img');
    profileImage.src = profile.profile_photo;
    userDiv.append(profileImage);

    const userInfo = document.createElement('div');
    userInfo.id = 'user-info';
    userDiv.append(userInfo);

    const username = document.createElement('h1');
    username.textContent = profile.username;
    userInfo.append(username);

    const randomData = document.createElement('div');
    randomData.id = 'random-data';
    userInfo.append(randomData);

    const joined = document.createElement('p');
    joined.innerHTML = `<b>Joined:</b> ${profile.date_joined}`;
    randomData.append(joined);

    const lastOnline = document.createElement('p');
    lastOnline.innerHTML = `<b>Last online:</b> ${profile.last_online}`;
    randomData.append(lastOnline);

    const searchAnotherUser = document.createElement('div');
    searchAnotherUser.id = 'search-another-user';
    component.append(searchAnotherUser);

    const searchText = document.createElement('p');
    searchText.textContent = 'Search another user';
    searchAnotherUser.append(searchText);

    const inputDiv = document.createElement('div');
    inputDiv.id = 'search-input-div';
    searchAnotherUser.append(inputDiv);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Username';
    inputDiv.append(searchInput);

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
    inputDiv.append(searchButton);

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

function isUintValid(score) {
    for (let i = 0; i < score.length; i++) {
        if (score[i] < '0' || score[i] > '9') return false;
    }
    return true;
}

function getInputRow(label, type, name, value, required = true) {
    const component = newElement('div', {classList: ['input-row']});
    
    // component
    const labelElement = newElement('label', {parent: component});
    labelElement.textContent = label;
    const input = newElement('input', {parent: component});
    input.type = type;
    input.name = name;
    input.value = value;
    input.required = required;
    
    return component;
}

function getNewMatchForm(profile) {
    const component = document.createElement('div');

    // component
    const title = newElement('div', {parent: component, classList: ['subsection-title']});
    title.textContent = 'Create Match';
    const form = newElement('form', {parent: component});
    form.method = "POST";
    
    // component form
    const inputDiv = newElement('div', {parent: form, classList: ['input-div']});

    // component form inputDiv
    inputDiv.append(getInputRow('Player Left:', 'text', 'playerLeft', profile.username, true));
    inputDiv.append(getInputRow('Player Right:', 'text', 'playerRight', 'player2', false));
    inputDiv.append(getInputRow('Score Left:', 'number', 'scoreLeft', 10, true));
    inputDiv.append(getInputRow('Score Right:', 'number', 'scoreRight', 5, true));
    inputDiv.append(getInputRow('Duration (s):', 'number', 'duration', 120, true));
    const matchTypeDiv = newElement('div', {parent: inputDiv, classList: ['input-row']});

    // component form inputDiv matchTypeDiv
    const matchTypeLabel = newElement('label', {parent: matchTypeDiv});
    matchTypeLabel.textContent = 'Match Type:';
    const matchTypeSelect = newElement('select', {parent: matchTypeDiv});
    matchTypeSelect.name = 'matchType';

    // component form inputDiv matchTypeDiv matchTypeSelect
    const types = ['local', 'AI', 'online'];
    types.forEach(type => {
        const option = newElement('option', {parent: matchTypeSelect});
        option.value = type;
        option.textContent = type;
        if (type === 'local')
            option.selected = true;
    });

    // component form
    const submitButton = getDefaultButton({
        bgColor: 'var(--color-lime)',
        content: 'Create Match',
    });
    form.append(submitButton);
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
    
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
    
        if (!usernameOk(data.playerLeft)) {
            alert('Invalid player left');
            return;
        }
        if (data.matchType === 'online' && data.playerRight !== '' && !usernameOk(data.playerRight)) {
            alert('Invalid player right');
            return;
        }
        if (!isUintValid(data.scoreLeft) || !isUintValid(data.scoreRight)) {
            alert('Invalid scores');
            return;
        }
        if (!isUintValid(data.duration)) {
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

    return component;
}

function getNewTournamentForm(profile) {
    const component = document.createElement('div');
    
    // component
    const title = newElement('div', {parent: component, classList: ['subsection-title']});
    title.textContent = 'Create Tournament';

    const form = newElement('form', {parent: component});
    form.method = "POST";

    // component form
    const inputDiv = newElement('div', {parent: form, classList: ['input-div']});

    // component form inputDiv
    inputDiv.append(getInputRow('Player List:', 'text', 'playerList',
        `${profile.username}, player2, player3`, true));
    inputDiv.append(getInputRow('Winner:', 'text', 'winner', profile.username, true));
    inputDiv.append(getInputRow('Duration (s):', 'number', 'duration', 1200, true));
    const matchTypeDiv = newElement('div', {parent: inputDiv, classList: ['input-row']});
    
    // component form inputDiv matchTypeDiv
    const matchTypeLabel = newElement('label', {parent: matchTypeDiv});
    matchTypeLabel.textContent = 'Match Type:';
    const matchTypeSelect = newElement('select', {parent: matchTypeDiv});
    matchTypeSelect.name = 'matchType';
    
    // component form inputDiv matchTypeDiv matchTypeSelect
    const types = ['tournament-local', 'tournament-online'];
    types.forEach(type => {
        const option = newElement('option', {parent: matchTypeSelect});
        option.value = type;
        option.textContent = type;
        if (type === 'tournament-local')
            option.selected = true;
    });

    // component form
    form.append(getDefaultButton({
        bgColor: 'var(--color-lime)',
        content: 'Create Tournament',
    }));
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
    
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
    
        data.playerList = data.playerList.split(',').map(p => p.trim());
        if (!data.playerList.every(usernameOk)) {
            alert('Invalid player list');
            return;
        }
        if (data.playerList.length < 2 || data.playerList.length > 8) {
            alert('players must be between 2 and 8');
            return;
        }
        if (!data.winner || !data.playerList.includes(data.winner)) {
            alert('Invalid winner');
            return;
        }
        if (!isUintValid(data.duration)) {
            alert('Invalid duration');
            return;
        }

        try {
            const response = await fetch('/api/add-tournament', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (response.ok) {
                alert('Tournament added successfully!');
                navigate();
            } else {
                alert(`Error: ${result.error}`);
            }
        }
        catch (error) {
            console.error('Fetch error:', error);
            alert('Failed to add tournament');
        }
    });

    return component;
}

function getCreateELementsDiv(profile) {
    const component = newElement('div', {id: 'create-elements-subsection'});

    // component
    const header = newElement('div', {parent: component, classList: ['subsection-header']});
    
    // component header
    const headerTitle = newElement('div', {parent: header, classList: ['subsection-title']});
    headerTitle.textContent = 'Create Matches & Tournaments';
    const headerButton = getDefaultButton({
        bgColor: 'var(--color-lime)',
        content: 'Show forms',
        onClick: () => {
            if (createElementsDiv.style.display === 'none') {
                createElementsDiv.style.display = 'flex';
                headerButton.textContent = 'Hide forms';
            } else {
                createElementsDiv.style.display = 'none';
                headerButton.textContent = 'Show forms';
            }
        }
    });
    header.append(headerButton);

    // component
    const createElementsDiv = newElement('div', {id: 'create-elements-form-container', parent: component});
    createElementsDiv.style.display = 'none';

    // component createElementsDiv
    const addNewMatchDiv = getNewMatchForm(profile);
    addNewMatchDiv.classList.add('new-element-form');
    createElementsDiv.append(addNewMatchDiv);

    const addNewTournamentDiv = getNewTournamentForm(profile);
    addNewTournamentDiv.classList.add('new-element-form');
    createElementsDiv.append(addNewTournamentDiv);

    return component;
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

function getMatchHistorySection(profile, matchHistory) {
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
    
    matchHistory.forEach(match => {
        matchHistoryDiv.append(getMatchHistoryRow(profile, match));
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

    const profileData = await fetchProfileData(path);
    if (profileData.status && profileData.status !== 200) {
        return profileData;
    }
    const { profile, match_history } = profileData;

    component.append(getProfileHeader(profile));
    component.append(getStats(profile));
    component.append(getMatchHistorySection(profile, match_history));

    return { status: 200, component, css };
}