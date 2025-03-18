import getDefaultButton from '/static/js/components/defaultButton.js';
import newElement from '/static/js/utils/newElement.js';
import Path from '/static/js/utils/Path.js';

function getAddFriendSection() {
    const component = newElement('section', {classList: ['section-block'], id: 'add-friend-section'});
    component.textContent = "Add Friend";

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

function getAddFriendListSection() {
    const component = newElement('section', {classList: ['section-block'], id: 'add-friend-list-section'});
    
    const inputSearchUser = newElement('input', {parent: component});
    inputSearchUser.type = "text";
    inputSearchUser.placeholder = "Search user";
    
    const friendListDiv = newElement('div', {parent: component, id: 'friend-list-div'});
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

    const title = newElement('h1', {parent: component});
    title.textContent = "🤝Friends";
    component.append(getAddFriendSection());
    component.append(getAddFriendListSection());

    return {status: 200, component, css};
}