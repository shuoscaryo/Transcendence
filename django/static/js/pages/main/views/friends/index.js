import getDefaultButton from '/static/js/components/defaultButton.js';
import newElement from '/static/js/utils/newElement.js';
import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';

function fetchFriendList() {
    return [
        {profile_photo: '/media/profile_photos/default.jpg', username: 'patroclo', display_name: 'pepe'},
        {profile_photo: Path.media('profile_photos/default.jpg'), username: 'pipo', display_name: 'papeclo'},
    ];
}

function getFriendRow(friend) {
    const component = newElement('div', {classList: ['friend-row']});
    
    // component
    const userInfo = newElement('div', {parent: component, classList: ['user-info']});

    // component userInfo
    const userImage = newElement('img', {parent: userInfo, classList: ['user-image']});
    userImage.src = friend.profile_photo;
    const usernameDiv =  newElement('div', {parent: userInfo, classList: ['username-div']});

    // component userInfo usernameDiv
    const username = newElement('span', {parent: usernameDiv, classList: ['username', 'bold']});
    username.textContent = friend.username;
    const displayName = newElement('span', {parent: usernameDiv, classList: ['display-name']});
    displayName.textContent = friend.display_name;

    const interactionButtons = newElement('div', {parent: component, classList: ['interaction-buttons']});
    const buttonsList = {
        'challenge':{ label: 'Challenge', image: Path.img('playLogo.png'), action: null},
        'remove_friend':{ label: 'Remove Friend', image: Path.img('friendsLogo.png'), action: null},
        'chat':{ label: 'Chat', image: Path.img('chatLogo.png'), action: null},
        'profile':{ label: 'Profile', image: Path.img('profileLogo.png'),
            action: () => navigate(`/pages/main/profile/${friend.username}`)},
    };
    Object.keys(buttonsList).forEach(key => {
        const buttonData = buttonsList[key];
        const button = newElement('button', {parent: interactionButtons,
            classList: ['interaction-button', 'tooltip-container']});
        const image = newElement('img', {parent: button});
        image.src = buttonData.image;
        const tooltip = newElement('span', {parent: button, classList: ['tooltip']});
        tooltip.textContent = buttonData.label;
        
        button.addEventListener('click', buttonData.action);
    });

    return component;
}

function getAddFriendSection() {
    const component = newElement('section', {classList: ['section-block'], id: 'add-friend-section'});

    const form = newElement('form', {parent: component, id: 'add-friend-form'});
    const input = newElement('input', {parent: form, id: 'add-friend-input'});
    input.type = "text";
    input.placeholder = "Enter username";

    const button = getDefaultButton({
        bgColor: 'var(--color-lime)',
        content: 'Add Friend',
    });
    form.append(button);
    button.type = "submit";
    button.addEventListener('click', async (event) => {
        event.preventDefault();
        const username = input.value;
        const response = await fetch("/api/friends/add", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({username}),
        });
        if (response.status == 200) {
            input.value = "";
            alert("Friend request sent!");
        }
        else {
            alert("Error sending friend request");
        }
    });

    return component;
}

function getFriendListSection() {
    const component = newElement('section', {classList: ['section-block'], id: 'friend-list-section'});
    
    const inputSearchUser = newElement('input', {parent: component, id: 'search-friend'});
    inputSearchUser.type = "text";
    inputSearchUser.placeholder = "Search friend";
    
    const friendListDiv = newElement('div', {parent: component, id: 'friend-list-div'});
    const friendList = fetchFriendList();
    
    friendList.forEach(friend => {
        const friendRow = getFriendRow(friend);
        friendListDiv.append(friendRow);
    });
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

    const title = newElement('h1', {parent: component, id: 'title'});
    title.textContent = "🤝Friends";
    component.append(getAddFriendSection());
    component.append(getFriendListSection());

    return {status: 200, component, css};
}