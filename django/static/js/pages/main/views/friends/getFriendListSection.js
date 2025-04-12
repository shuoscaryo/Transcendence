import newElement from '/static/js/utils/newElement.js';
import Path from '/static/js/utils/Path.js';
import ViewScope from '/static/js/utils/ViewScope.js';
import { navigate } from '/static/js/utils/router.js';
import WebSocketService from '/static/js/utils/WebSocketService.js';
import { formatTimeAgo } from '/static/js/utils/time.js';

function noFriendsDiv() {
    const noFriends = newElement('div', { id: 'no-friends' });
    noFriends.textContent = "No friends yet";
    return noFriends;
}

export function getFriendRow(friend) {
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
            action: async () => { ViewScope.request(
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

export default async function getFriendListSection() {
    const component = newElement('section', {classList: ['section-block'], id: 'friend-list-section'});
    
    const inputSearchUser = newElement('input', {parent: component, id: 'search-friend'});
    inputSearchUser.type = 'text';
    inputSearchUser.placeholder = 'Search friend';
    
    const friendListDiv = newElement('div', { parent: component, classList: ['friends-list'], id: 'friend-list-div'});

    // Fetch initial friends list from API
    let friendsList = [];
    const response = await ViewScope.request('GET', Path.API.GET_FRIENDS);
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