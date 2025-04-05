import getDefaultButton from '/static/js/components/defaultButton.js';
import newElement from '/static/js/utils/newElement.js';
import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import request from '/static/js/utils/request.js';
import { usernameOk } from '/static/js/utils/validators.js';
import WebSocketService from '/static/js/utils/WebSocketService.js';
import { formatTimeAgo } from '/static/js/utils/time.js';
import ViewLifeCycle from '/static/js/utils/ViewLifeCycle.js';

function noFriendsDiv() {
    const noFriends = newElement('div', { id: 'no-friends' });
    noFriends.textContent = "No friends yet";
    return noFriends;
}

function getFriendRow(friend) {
    const component = newElement('div', { classList: ['friend-row'] });
    
    const userInfo = newElement('div', { classList: ['user-info'], parent: component });
    const userImage = newElement('img', { parent: userInfo, classList: ['user-image'] });
    userImage.src = friend.profile_photo;
    const displayNameDiv = newElement('div', { parent: userInfo, classList: ['username-div'] });
    const displayName = newElement('span', { parent: displayNameDiv, classList: ['username', 'bold'] });
    displayName.textContent = friend.display_name;
    const lastOnline = newElement('p', { parent: displayNameDiv, classList: ['last-online'] });
    if (friend.is_online) {
        lastOnline.textContent = 'Online';
        lastOnline.style.color = 'var(--color-lime)';
    } else if (friend.last_online) {
        lastOnline.textContent = `Last online: ${formatTimeAgo(friend.last_online)}`;
        lastOnline.style.color = '';
    } else {
        lastOnline.textContent = 'Offline';
        lastOnline.style.color = '';
    }
    const delCallbackOnlineStatus = WebSocketService.addCallback('online_status', (message) => {
        if (message.display_name !== friend.display_name)
            return;
        if (message.is_online) {
            lastOnline.textContent = 'Online';
            lastOnline.style.color = 'var(--color-lime)';
        } else if (message.last_online) {
            lastOnline.textContent = `Last online: ${formatTimeAgo(message.last_online)}`;
            lastOnline.style.color = '';
        } else {
            lastOnline.textContent = 'Offline';
            lastOnline.style.color = '';
        }
    })
    const delCallBackRemoveFriend = WebSocketService.addCallback('friend_removed', (message) => {
        if (message.display_name !== friend.display_name)
            return;
        component.remove();
        delCallBackRemoveFriend();
        delCallbackOnlineStatus();
        const friendListDiv = document.getElementById('friend-list-div');
        if (friendListDiv && friendListDiv.children.length == 0)
            friendListDiv.append(noFriendsDiv());
    });

    const interactionButtons = newElement('div', { parent: component, classList: ['interaction-buttons'] });
    const buttonsList = {
        'challenge': { label: 'Challenge', image: Path.img('playLogo.png'), action: null },
        'remove_friend': {
            label: 'Remove Friend', image: Path.img('friendsLogo.png'),
            action: async () => { ViewLifeCycle.request(
                'DELETE',
                Path.API.REMOVE_FRIEND,
                {
                    body: { display_name: friend.display_name },
                    onResolve: (res) => {
                        if (res.status == 200) {
                            component.remove();
                            delCallBackRemoveFriend();
                            delCallbackOnlineStatus();
                            const friendListDiv = document.getElementById('friend-list-div');
                            if (friendListDiv && friendListDiv.children.length == 0)
                                friendListDiv.append(noFriendsDiv());
                        } else
                            alert(`Couldn't remove friend :( ${res.data.error}`);
                    },
                }
            )}
        },
        'chat': { label: 'Chat', image: Path.img('chatLogo.png'), action: null },
        'profile': { label: 'Profile', image: Path.img('profileLogo.png'),
            action: () => navigate(`/main/profile/${friend.display_name}`) },
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
    let deleteCallback = null;
    function deleteSelf() {
        component.remove();
        deleteCallback?.();
    }

    const component = newElement('div', { classList: ['friend-row'] });
    
    const userInfo = newElement('div', { classList: ['user-info'], parent: component });
    const userImage = newElement('img', { parent: userInfo, classList: ['user-image'] });
    userImage.src = user.profile_photo;
    const displayNameDiv = newElement('div', { parent: userInfo, classList: ['username-div'] });
    const displayName = newElement('span', { parent: displayNameDiv, classList: ['username', 'bold'] });
    displayName.textContent = user.display_name;

    const requestButtons = newElement('div', { parent: component, classList: ['request-buttons'] });
    const buttonsList = {
        'cancel': {
            label: 'Cancel', action: async () => {
                ViewLifeCycle.request(
                    'DELETE',
                    Path.API.CANCEL_FRIEND_REQUEST,
                    {
                        body: { display_name: user.display_name },
                        onResolve: (res) => {
                            if (res.status == 200)
                                deleteSelf();
                            else
                                alert(`Couldn't cancel friend request :( ${res.data.error}`);
                        },
                    }
                );
            }
        },
        'accept': {
            label: 'Accept', action: async () => {
                ViewLifeCycle.request(
                    'POST',
                    Path.API.RESPOND_FRIEND_REQUEST,
                    {
                        body: { display_name: user.display_name, action: 'accept' },
                        onResolve: (res) => {
                            if (res.status == 200) {
                                deleteSelf();
                                const friendListDiv = document.getElementById('friend-list-div');
                                if (friendListDiv) {
                                    const friendRow = getFriendRow(res.data);
                                    friendListDiv.insertBefore(friendRow, friendListDiv.firstChild);
                                    friendListDiv.querySelector('#no-friends')?.remove();
                                }
                            } else
                                alert(`Couldn't accept friend request :( ${res.data.error}`);
                        },
                    }
                );
            }
        },
        'decline': {
            label: 'Decline', action: async () => {
                ViewLifeCycle.request(
                    'POST',
                    Path.API.RESPOND_FRIEND_REQUEST,
                    {
                        body: { display_name: user.display_name, action: 'decline' },
                        onResolve: (res) => {
                            if (res.status == 200)
                                deleteSelf();
                            else
                                alert(`Couldn't decline friend request :( ${res.data.error}`);
                        },
                    }
                );
            }
        },
    };

    let buttons = [];
    if (type == 'sent') {
        buttons = ['cancel'];
        deleteCallback = WebSocketService.addCallback('friend_request_response', (message) => {
            if (message.display_name !== user.display_name)
                return;
            if (message.answer === 'accept') {
                const friendListDiv = document.getElementById('friend-list-div');
                friendListDiv.prepend(getFriendRow(message));
                friendListDiv.querySelector('#no-friends')?.remove();
            }
            deleteSelf();
        });
    } else if (type == 'received') {
        buttons = ['accept', 'decline'];
        deleteCallback = WebSocketService.addCallback('friend_request_cancelled', (message) => {
            if (message.display_name !== user.display_name)
                return;
            deleteSelf();
        });
    } else
        throw new Error("[getRequestRow] Type can only be sent or received dumbass");
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
        const displayName = input.value;
        if (!usernameOk(displayName)) {
            alert("Invalid username");
            return;
        }
        ViewLifeCycle.request(
            'POST',
            Path.API.SEND_FRIEND_REQUEST,
            {
                body: { display_name: displayName },
                onResolve: (res) => {
                    if (res.status == 200) {
                        input.value = "";
                        const newRequestUser = res.data;
                        requestListDiv.append(getRequestRow(newRequestUser, 'sent'));
                    } else if (res.status == 404)
                        alert(`User ${displayName} not found`);
                    else
                        alert(`${res.data.error ? res.data.error : "Error sending friend request"}`);
                },
            }
        );
    });

    ViewLifeCycle.request(
        'GET',
        Path.API.GET_FRIEND_REQUESTS,
        {
            onResolve: (res) => {
                if (res.status == 200) {
                    const sentRequests = res.data.sent;
                    if (sentRequests && sentRequests.length > 0) {
                        sentRequests.forEach(request => {
                            const requestRow = getRequestRow(request, 'sent');
                            requestListDiv.append(requestRow);
                        });
                    }
                    const receivedRequests = res.data.received;
                    if (receivedRequests && receivedRequests.length > 0) {
                        receivedRequests.forEach(request => {
                            const requestRow = getRequestRow(request, 'received');
                            requestListDiv.append(requestRow);
                        });
                    }
                }
            },
        }
    );
    WebSocketService.addCallback('friend_request_new', (message) => {
        requestListDiv.prepend(getRequestRow(message, 'received'));
    });

    return component;
}

async function getFriendListSection() {
    const component = newElement('section', {classList: ['section-block'], id: 'friend-list-section'});
    
    const inputSearchUser = newElement('input', {parent: component, id: 'search-friend'});
    inputSearchUser.type = 'text';
    inputSearchUser.placeholder = 'Search friend';
    
    const friendListDiv = newElement('div', { parent: component, classList: ['friends-list'], id: 'friend-list-div'});

    // Fetch initial friends list from API
    let friendsList = [];
    const response = await ViewLifeCycle.request('GET', Path.API.GET_FRIENDS);
    if (!response || response.status !== 200) {
        const error = newElement('div', {parent: friendListDiv, id: 'no-friends'});
        error.textContent = "Error fetching friends";
        return component;
    }
    if (response.status === 200)
        friendsList = response.data.friends;

    // Function to update the displayed friends list based on search term
    function updateFriendList(searchTerm = '') {
        friendListDiv.innerHTML = '';
        
        // Show message if no friends
        if (!friendsList || friendsList.length === 0) {
            friendListDiv.append(noFriendsDiv());
            return;
        }

        // Filter friends based on the search term (case-insensitive)
        const filteredFriends = friendsList.filter(friend => {
            const matches = friend.display_name.toLowerCase().includes(searchTerm.toLowerCase());
            return matches;
        });

        // Show message if no matches found with search term
        if (filteredFriends.length === 0 && searchTerm) {
            const noMatch = newElement('div', { 
                parent: friendListDiv, 
                id: 'no-friends' 
            });
            noMatch.textContent = "No matching friends found";
        } else if (filteredFriends.length > 0) {
            filteredFriends.forEach(friend => {
                const friendRow = getFriendRow(friend);
                friendListDiv.append(friendRow);
            });
        } else {
            // Show all friends when search is empty and there are friends
            friendsList.forEach(friend => {
                const friendRow = getFriendRow(friend);
                friendListDiv.appendChild(friendRow);
            });
        }
    }

    // Show initial list of all friends
    updateFriendList();

    // Add event listener for real-time search as user types
    inputSearchUser.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        updateFriendList(searchTerm);
    });

    return component;
}

export default async function getView(isLogged, path) {
    if (!isLogged) {
        return { status: 300, redirect: "/login/login" };
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