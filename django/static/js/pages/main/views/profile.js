import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';

// Obtener datos del perfil desde la API
async function fetchProfileData(isLogged, path) {
    let username;
    if (path.subPath === '/') {
        if (!isLogged) {
            return { status: 300, redirect: "/pages/login/login" };
        }
        // Para /profile/, obtenemos el usuario autenticado
        const response = await fetch('/api/profile/', {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            return { status: response.status, error: await response.json() };
        }
        return response.json();
    } else {
        // Para /profile/algo, usamos el username de la URL
        username = path.subPath.split('/')[1];
        const response = await fetch(`/api/profile/${username}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            return { status: response.status, error: await response.json() };
        }
        return response.json();
    }
}

// Crear la sección superior (foto, username, email)
function getUpperSection(profile) {
    const upper = document.createElement('div');
    upper.classList.add('profile-upper');

    // Foto de perfil
    const photo = document.createElement('img');
    photo.src = profile.profile_photo || Path.img('default.jpg');
    photo.alt = 'Profile Photo';
    photo.style.width = '100px';
    photo.style.height = '100px';
    photo.style.borderRadius = '50%';
    upper.appendChild(photo);

    // Username
    const username = document.createElement('h2');
    username.textContent = profile.username;
    upper.appendChild(username);

    // Email
    const email = document.createElement('p');
    email.textContent = profile.email;
    email.style.color = '#666';
    upper.appendChild(email);

    return upper;
}

// Crear la sección de estadísticas (wins/losses)
function getStatsSection(profile) {
    const stats = document.createElement('div');
    stats.classList.add('profile-stats');

    const wins = document.createElement('p');
    wins.textContent = `Wins: ${profile.wins}`;
    stats.appendChild(wins);

    const losses = document.createElement('p');
    losses.textContent = `Losses: ${profile.losses}`;
    stats.appendChild(losses);

    return stats;
}

// Crear la sección de amigos
function getFriendsSection(profile) {
    const friends = document.createElement('div');
    friends.classList.add('profile-friends');

    const title = document.createElement('h3');
    title.textContent = 'Friends';
    friends.appendChild(title);

    if (profile.friends.length === 0) {
        const noFriends = document.createElement('p');
        noFriends.textContent = 'No friends yet.';
        friends.appendChild(noFriends);
    } else {
        const friendsList = document.createElement('ul');
        profile.friends.forEach(friend => {
            const friendItem = document.createElement('li');
            friendItem.textContent = friend;
            friendItem.style.cursor = 'pointer';
            friendItem.addEventListener('click', () => navigate(`/profile/${friend}`));
            friendsList.appendChild(friendItem);
        });
        friends.appendChild(friendsList);
    }

    return friends;
}

// Crear la sección de historial de partidas
function getMatchHistorySection(match_history) {
    const history = document.createElement('div');
    history.classList.add('profile-history');

    const title = document.createElement('h3');
    title.textContent = 'Match History';
    history.appendChild(title);

    if (match_history.length === 0) {
        const noMatches = document.createElement('p');
        noMatches.textContent = 'No matches played yet.';
        history.appendChild(noMatches);
    } else {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        // Encabezados
        const header = document.createElement('tr');
        ['Opponent', 'Score', 'Type', 'Duration', 'Date'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            th.style.borderBottom = '1px solid #ddd';
            th.style.padding = '8px';
            header.appendChild(th);
        });
        table.appendChild(header);

        // Filas de partidas
        match_history.forEach(match => {
            const row = document.createElement('tr');
            const opponent = match.playerRight__username || 'AI';
            const cells = [
                opponent,
                `${match.scoreLeft}-${match.scoreRight}`,
                match.match_type,
                `${match.duration}s`,
                new Date(match.start_date).toLocaleDateString()
            ];
            cells.forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                td.style.padding = '8px';
                row.appendChild(td);
            });
            table.appendChild(row);
        });
        history.appendChild(table);
    }

    return history;
}

export default async function getView(isLogged, path) {
    const css = [
        Path.css('main/profile.css'),
    ];
    const component = document.createElement('div');
    component.classList.add('profile-container');

    // Obtener datos del perfil
    const profileData = await fetchProfileData(isLogged, path);
    if (profileData.status && profileData.status !== 200) {
        return profileData; // Maneja redirecciones o errores
    }

    const { profile, match_history } = profileData;

    // Construir la página
    component.appendChild(getUpperSection(profile));
    component.appendChild(getStatsSection(profile));
    component.appendChild(getFriendsSection(profile));
    component.appendChild(getMatchHistorySection(match_history));

    return { status: 200, component, css };
}