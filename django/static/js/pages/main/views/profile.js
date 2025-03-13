import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import getDefaultButton from '/static/js/components/defaultButton.js';

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
    const component = document.createElement('div');
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
                    joined.textContent = `Joined: ${profile.date_joined}`;
                    randomData.appendChild(joined);

                    const lastOnline = document.createElement('p');
                    lastOnline.textContent = `Last online: ${profile.last_online}`;
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

function addWinLoseClass(row, username, match) {
    if (username !== match.playerLeft__username
        && username !== match.playerRight__username)
        return;

    const userIsLeft = match.playerLeft__username === username;
    const leftWon = match.scoreLeft > match.scoreRight;
    row.classList.add(userIsLeft == leftWon? 'won-match': 'lost-match');
}

function getMatchHistory(profile, matchHistory) {
    const component = document.createElement('div');
    component.id = 'match-history';
    component.classList.add('section-block');

    const title = document.createElement('div');
    title.id = 'title';
    title.textContent = 'Match History';
    component.appendChild(title);

    if (matchHistory.length === 0) {
        const noMatches = document.createElement('p');
        noMatches.id = 'no-matches';
        noMatches.textContent = 'No matches yet';
        component.appendChild(noMatches);
        return component;
    }

    const table = document.createElement('table');
    component.appendChild(table);

    // Crear el encabezado de la tabla
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.id = 'table-header';

    const headers = ['Img', 'Player 1', 'Player 2', 'Score', 'Duration', 'Start Time'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Crear el cuerpo de la tabla
    const tbody = document.createElement('tbody');

    matchHistory.forEach(match => {
        //const component = createMatchRow(profile, match);
        const row = document.createElement('tr');
        row.classList.add('match');
        addWinLoseClass(row, profile.username, match);

        // Imagen del tipo de partida
        const imgTd = document.createElement('td');
        const matchTypeImg = document.createElement('img');
        matchTypeImg.src = Path.img(`${match.match_type}_match.png`);
        matchTypeImg.alt = match.match_type;
        imgTd.appendChild(matchTypeImg);
        row.appendChild(imgTd);

        // Jugador 1
        const player1Td = document.createElement('td');
        player1Td.textContent = match.playerLeft__username;
        row.appendChild(player1Td);

        // Jugador 2
        const player2Td = document.createElement('td');
        player2Td.textContent = match.playerRight__username;
        row.appendChild(player2Td);

        // Resultado
        const scoreTd = document.createElement('td');
        scoreTd.textContent = `${match.scoreLeft} - ${match.scoreRight}`;
        row.appendChild(scoreTd);

        // Duración
        const durationTd = document.createElement('td');
        durationTd.textContent = `${match.duration} seconds`;
        row.appendChild(durationTd);

        // Hora de inicio
        const startTimeTd = document.createElement('td');
        startTimeTd.textContent = match.start_date;
        row.appendChild(startTimeTd);

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return component;
}

function createAddMatchForm() {
    const div = document.createElement('div');
    div.classList.add('add-match-form');

    // Formulario
    const form = document.createElement('form');
    form.style.padding = '20px';
    form.style.backgroundColor = '#111511';
    form.style.borderRadius = '10px';

    // Campo playerLeft
    const playerLeftDiv = document.createElement('div');
    const playerLeftLabel = document.createElement('label');
    playerLeftLabel.textContent = 'Player Left: ';
    const playerLeftInput = document.createElement('input');
    playerLeftInput.type = 'text';
    playerLeftInput.name = 'playerLeft';
    playerLeftInput.value = 'player1'; // Valor por defecto
    playerLeftInput.required = true;
    playerLeftDiv.append(playerLeftLabel, playerLeftInput);
    form.appendChild(playerLeftDiv);

    // Campo playerRight
    const playerRightDiv = document.createElement('div');
    const playerRightLabel = document.createElement('label');
    playerRightLabel.textContent = 'Player Right: ';
    const playerRightInput = document.createElement('input');
    playerRightInput.type = 'text';
    playerRightInput.name = 'playerRight';
    playerRightInput.value = 'player2'; // Valor por defecto
    playerRightInput.required = true;
    playerRightDiv.append(playerRightLabel, playerRightInput);
    form.appendChild(playerRightDiv);

    // Campo scoreLeft
    const scoreLeftDiv = document.createElement('div');
    const scoreLeftLabel = document.createElement('label');
    scoreLeftLabel.textContent = 'Score Left: ';
    const scoreLeftInput = document.createElement('input');
    scoreLeftInput.type = 'number';
    scoreLeftInput.name = 'scoreLeft';
    scoreLeftInput.value = 10; // Valor por defecto
    scoreLeftInput.required = true;
    scoreLeftDiv.append(scoreLeftLabel, scoreLeftInput);
    form.appendChild(scoreLeftDiv);

    // Campo scoreRight
    const scoreRightDiv = document.createElement('div');
    const scoreRightLabel = document.createElement('label');
    scoreRightLabel.textContent = 'Score Right: ';
    const scoreRightInput = document.createElement('input');
    scoreRightInput.type = 'number';
    scoreRightInput.name = 'scoreRight';
    scoreRightInput.value = 5; // Valor por defecto
    scoreRightInput.required = true;
    scoreRightDiv.append(scoreRightLabel, scoreRightInput);
    form.appendChild(scoreRightDiv);

    // Campo duration
    const durationDiv = document.createElement('div');
    const durationLabel = document.createElement('label');
    durationLabel.textContent = 'Duration (s): ';
    const durationInput = document.createElement('input');
    durationInput.type = 'number';
    durationInput.name = 'duration';
    durationInput.value = 120; // Valor por defecto
    durationInput.required = true;
    durationDiv.append(durationLabel, durationInput);
    form.appendChild(durationDiv);

    // Campo match_type
    const matchTypeDiv = document.createElement('div');
    const matchTypeLabel = document.createElement('label');
    matchTypeLabel.textContent = 'Match Type: ';
    const matchTypeSelect = document.createElement('select');
    matchTypeSelect.name = 'match_type';
    const types = ['local', 'AI', 'online', 'tournament'];
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        if (type === 'local') option.selected = true; // Valor por defecto
        matchTypeSelect.appendChild(option);
    });
    matchTypeDiv.append(matchTypeLabel, matchTypeSelect);
    form.appendChild(matchTypeDiv);

    // Botón de submit
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Add Match';
    form.appendChild(submitButton);

    // Manejar el submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {
            playerLeft: formData.get('playerLeft'),
            playerRight: formData.get('playerRight'),
            scoreLeft: parseInt(formData.get('scoreLeft')),
            scoreRight: parseInt(formData.get('scoreRight')),
            duration: parseInt(formData.get('duration')),
            match_type: formData.get('match_type')
        };

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
                navigate(); // Redirige a home o donde quieras
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Failed to add match');
        }
    });

    div.appendChild(form);
    return div;
}
export default async function getView(isLogged, path) {
    if (!isLogged && path.subPath === '/') {
        return { status: 300, redirect: "/pages/login/login" };
    }

    const css = [
        Path.css('main/profile.css'),
    ];
    const component = document.createElement('div');

    // Obtener datos del perfil
    const profileData = await fetchProfileData(isLogged, path);
    if (profileData.status && profileData.status !== 200) {
        return profileData; // Maneja redirecciones o errores
    }
    const { profile, match_history } = profileData;
    // Construir la página
    component.appendChild(getProfileHeader(profile));
    component.appendChild(createAddMatchForm());
    component.appendChild(getStats(profile));
    component.appendChild(getMatchHistory(profile, match_history));

    return { status: 200, component, css };
}