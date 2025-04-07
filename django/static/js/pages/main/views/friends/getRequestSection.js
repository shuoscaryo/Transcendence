import getDefaultButton from '/static/js/components/defaultButton.js';
import newElement from '/static/js/utils/newElement.js';
import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import { usernameOk } from '/static/js/utils/validators.js';
import WebSocketService from '/static/js/utils/WebSocketService.js';
import { formatTimeAgo } from '/static/js/utils/time.js';
import ViewScope from '/static/js/utils/ViewScope.js';

import { getFriendRow } from './getFriendListSection.js';

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
                ViewScope.request(
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
                ViewScope.request(
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
                ViewScope.request(
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

export default async function getRequestSection() {
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
        ViewScope.request(
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

    ViewScope.request(
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
