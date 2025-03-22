import getDefaultButton from '/static/js/components/defaultButton.js';
import newElement from '/static/js/utils/newElement.js';
import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import request from '/static/js/utils/request.js';
import { usernameOk } from '/static/js/utils/validators.js';

function getUserInfoDiv(friend) {
    const component = newElement('div', { classList: ['user-info'] });
    const userImage = newElement('img', { parent: component, classList: ['user-image'] });
    userImage.src = friend.profile_photo;
    const usernameDiv = newElement('div', { parent: component, classList: ['username-div'] });
    const username = newElement('span', { parent: usernameDiv, classList: ['username', 'bold'] });
    username.textContent = friend.username;
    return component;
}

function getFriendRow(friend) {
    const component = newElement('div', { classList: ['friend-row'] });
    
    component.append(getUserInfoDiv(friend));

    const interactionButtons = newElement('div', { parent: component, classList: ['interaction-buttons'] });
    const buttonsList = {
        'challenge': { label: 'Challenge', image: Path.img('playLogo.png'), action: null },
        'remove_friend': {
            label: 'Remove Friend', image: Path.img('friendsLogo.png'),
            action: async () => {
                const response = await request('DELETE', Path.API.REMOVE_FRIEND, { username: friend.username });
                if (response.status == 200){
                    component.remove();
                    const friendListDiv = document.getElementById('friend-list-div');
                    if (friendListDiv && friendListDiv.children.length == 0) {
                        const noFriends = newElement('div', { id: 'no-friends' });
                        noFriends.textContent = "No friends yet";
                        friendListDiv.append(noFriends);
                    }
                }
                else
                    alert(`Couldn't remove friend :( ${response.error}`);
            }
        },
        'chat': { label: 'Chat', image: Path.img('chatLogo.png'), action: null },
        'profile': { label: 'Profile', image: Path.img('profileLogo.png'),
            action: () => navigate(`/pages/main/profile/${friend.username}`) },
    };
    Object.keys(buttonsList).forEach(key => {
        const buttonData = buttonsList[key];
        const button = newElement('button', { parent: interactionButtons,
            classList: ['interaction-button', 'tooltip-container'] });
        const image = newElement('img', { parent: button });
        image.src = buttonData.image;
        const tooltip = newElement('span', { parent: button, classList: ['tooltip'] });
        tooltip.textContent = buttonData.label;
        
        button.addEventListener('click', buttonData.action);
    });

    return component;
}

function getRequestRow(user, type) {
    const component = newElement('div', { classList: ['friend-row'] });
    
    component.append(getUserInfoDiv(user));

    const requestButtons = newElement('div', { parent: component, classList: ['request-buttons'] });
    const buttonsList = {
        'cancel': {
            label: 'Cancel', action: async () => {
                const response = await request('DELETE', Path.API.CANCEL_FRIEND_REQUEST, { username: user.username });
                if (response.status == 200)
                    component.remove();
                else
                    alert(`Couldn't cancel friend request :( ${response.error}`);
            }
        },
        'accept': {
            label: 'Accept', action: async () => {
                const response = await request('POST', Path.API.RESPOND_FRIEND_REQUEST, { username: user.username, action: 'accept' });
                if (response.status == 200) {
                    component.remove(); // Eliminar la solicitud
                    // Añadir el nuevo amigo al inicio de la lista de amigos usando el ID
                    const friendListDiv = document.getElementById('friend-list-div');
                    if (friendListDiv) {
                        const newFriend = { username: user.username, profile_photo: user.profile_photo };
                        const friendRow = getFriendRow(newFriend);
                        // Insertar como primer elemento
                        friendListDiv.insertBefore(friendRow, friendListDiv.firstChild);
                        // Si había un mensaje de "No friends yet", eliminarlo
                        const noFriends = friendListDiv.querySelector('#no-friends');
                        if (noFriends) noFriends.remove();
                    }
                } else {
                    alert(`Couldn't accept friend request :( ${response.error}`);
                }
            }
        },
        'decline': {
            label: 'Decline', action: async () => {
                const response = await request('POST', Path.API.RESPOND_FRIEND_REQUEST, { username: user.username, action: 'decline' });
                if (response.status == 200)
                    component.remove();
                else
                    alert(`Couldn't decline friend request :( ${response.error}`);
            }
        },
    };

    let buttons = [];
    if (type == 'sent') {
        buttons = ['cancel'];
    } else if (type == 'received') {
        buttons = ['accept', 'decline'];
    } else {
        throw new Error("[getRequestRow] Type can only be sent or received dumbass");
    }
    buttons.forEach(buttonName => {
        const button = newElement('button', { parent: requestButtons, classList: ['request-button'] });
        button.textContent = buttonsList[buttonName].label;
        button.addEventListener('click', buttonsList[buttonName].action);
    });

    return component;
}

async function getRequestSection() {
    const component = newElement('section', { classList: ['section-block'], id: 'add-friend-section' });

    const form = newElement('form', { parent: component, id: 'add-friend-form' });
    const input = newElement('input', { parent: form, id: 'add-friend-input' });
    input.type = "text";
    input.placeholder = "Enter username";

    const requestListDiv = newElement('div', { parent: component, classList: ['friends-list'] });
    const button = getDefaultButton({
        bgColor: 'var(--color-lime)',
        content: 'Add Friend',
    });
    form.append(button);
    button.type = "submit";
    button.addEventListener('click', async (event) => {
        event.preventDefault();
        const username = input.value;
        if (!usernameOk(username)) {
            alert("Invalid username");
            return;
        }
        const response = await request('POST', Path.API.SEND_FRIEND_REQUEST, { username });
        if (response.status == 200) {
            input.value = "";
            const newRequestUser = response.data;
            requestListDiv.append(getRequestRow(newRequestUser, 'sent'));
            alert("Friend request sent!");
        } else if (response.status == 404) {
            alert(`User ${username} not found`);
        } else {
            alert(`${response.error ? response.error : "Error sending friend request"}`);
        }
    });

    const response = await request('GET', Path.API.GET_FRIEND_REQUESTS);
    if (response.status == 200) {
        const sentRequests = response.data.sent;
        if (sentRequests && sentRequests.length > 0) {
            sentRequests.forEach(request => {
                const requestRow = getRequestRow(request, 'sent');
                requestListDiv.append(requestRow);
            });
        }
        const receivedRequests = response.data.received;
        if (receivedRequests && receivedRequests.length > 0) {
            receivedRequests.forEach(request => {
                const requestRow = getRequestRow(request, 'received');
                requestListDiv.append(requestRow);
            });
        }
    }

    return component;
}

async function getFriendListSection() {
    const component = newElement('section', { classList: ['section-block'], id: 'friend-list-section' });
    
    const inputSearchUser = newElement('input', { parent: component, id: 'search-friend' });
    inputSearchUser.type = "text";
    inputSearchUser.placeholder = "Search friend";
    
    const friendListDiv = newElement('div', { parent: component, classList: ['friends-list'], id: 'friend-list-div' });
    const response = await request('GET', Path.API.GET_FRIENDS);
    
    if (response.status == 200) {
        const friendsList = response.data.friends;
        if (!friendsList || friendsList.length == 0) {
            const noFriends = newElement('div', { parent: friendListDiv, id: 'no-friends' });
            noFriends.textContent = "No friends yet";
        } else {
            friendsList.forEach(friend => {
                const friendRow = getFriendRow(friend);
                friendListDiv.append(friendRow);
            });
        }
    } else {
        const error = newElement('div', { parent: friendListDiv, id: 'no-friends' });
        error.textContent = "Error fetching friends";
    }
    return component;
}

export default async function getView(isLogged, path) {
    if (!isLogged) {
        return { status: 300, redirect: "/pages/login/login" };
    }

    const css = [
        Path.css('main/friends.css'),
    ];
    const component = document.createElement('main');

    const title = newElement('h1', { parent: component, id: 'title' });
    title.textContent = "🤝Friends";
    component.append(await getRequestSection());
    component.append(await getFriendListSection());

    return { status: 200, component, css };
}