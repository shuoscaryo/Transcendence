import Path from '/static/js/utils/Path.js';
import loadPage from '/static/js/utils/loadPage.js';
import getHomeButton from '/static/js/components/homeButton.js';

function getUpperHalf()
{
    const component = document.createElement('div');
    component.className = 'upper-half';

    const homeButton = getHomeButton();
    homeButton.classList.add('header-button');
    component.appendChild(homeButton);

    const buttons = [
        { label: 'Play', image: Path.img('playLogo.png'), action: null},
        { label: 'Friends', image: Path.img('friendsLogo.png'), action: null},
        { label: 'Chat', image: Path.img('chatLogo.png'), action: null},
        { label: 'Profile', image: Path.img('profileLogo.png'), action: null},
    ];

    buttons.forEach(buttonData => {
        const button = document.createElement('button');
        button.className = 'header-button';

        const div1 = document.createElement('div');
        button.appendChild(div1);
        const image = document.createElement('img');
        image.src = buttonData.image;
        div1.appendChild(image);

        const div2 = document.createElement('div');
        button.appendChild(div2);
        const p = document.createElement('p');
        p.textContent = buttonData.label;
        div2.appendChild(p);

        button.addEventListener('click', buttonData.action);

        component.appendChild(button);
    });
    return component;
}

function getLowerHalf()
{
    const component = document.createElement('div');
    component.className = 'lower-half';

    const registerButton = document.createElement('button');
    registerButton.classList.add('button-login', 'button-green');
    registerButton.textContent = 'Sign Up';
    registerButton.addEventListener('click', () => {
        loadPage('register');
    });
    component.appendChild(registerButton);
    
    const loginButton = document.createElement('button');
    loginButton.classList.add('button-login', 'button-gray');
    loginButton.textContent = 'Log In';
    loginButton.addEventListener('click', () => {
        loadPage('login');
    });
    component.appendChild(loginButton);

    return component;
}

export default function getSidebar()
{
    const component = document.createElement('div');
    component.className = 'sidebar';

    // contains home button and move to other pages
    component.appendChild(getUpperHalf());

    // contains login and contract sidebar button
    component.appendChild(getLowerHalf());

    return component;
}