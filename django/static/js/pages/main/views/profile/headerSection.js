import { navigate } from '/static/js/utils/router.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import newElement from '/static/js/utils/newElement.js';

export default function getProfileHeaderSection(profile) {
    const component = newElement('section', {id: 'header', classList: ['section-block']});

    // component
    const userDiv = newElement('div', {id: 'user', parent: component});

    // component userDiv
    const profileImg = newElement('img', {src: profile.profile_photo, parent: userDiv});
    profileImg.src = profile.profile_photo;
    const userInfo = newElement('div', {id: 'user-info', parent: userDiv});

    // component userDiv userInfo
    const displayName = newElement('h1', {parent: userInfo});
    displayName.textContent = profile.display_name;
    const randomData = newElement('div', {id: 'random-data', parent: userInfo});
    randomData.id = 'random-data';

    // component userDiv userInfo randomData
    const joined = newElement('p', {parent: randomData});
    joined.innerHTML = `<b>Joined:</b> ${profile.date_joined}`;

    // component
    const searchAnotherUser = newElement('div', {id: 'search-another-user', parent: component});

    // component searchAnotherUser
    const searchText = newElement('p', {parent: searchAnotherUser});
    searchText.textContent = 'Search another user';
    const inputDiv = newElement('div', {id: 'search-input-div', parent: searchAnotherUser});

    // component searchAnotherUser inputDiv
    const searchInput = newElement('input', {parent: inputDiv});
    searchInput.type = 'text';
    searchInput.placeholder = 'Username';
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