function getHomeButton()
{
    const component = document.createElement('button');
    component.id = 'home-button';
    component.className = 'header-button';
    
    const image = document.createElement('img');
    image.src = '/static/game/img/homeLogo.png';
    image.alt = 'Home';
    component.appendChild(image);

    return component;
}

function getUpperHalf()
{
    const component = document.createElement('div');
    component.className = 'upper-half';

    const homeButton = getHomeButton();
    component.appendChild(homeButton);

    const buttons = [
        { label: 'Play', image: '/static/game/img/playLogo.png', action: null},
        { label: 'Friends', image: '/static/game/img/friendsLogo.png', action: null},
        { label: 'Chat', image: '/static/game/img/chatLogo.png', action: null},
        { label: 'Profile', image: '/static/game/img/profileLogo.png', action: null},
    ];

    buttons.forEach(buttonData => {
        const button = document.createElement('button');
        button.className = 'header-button';

        const div1 = document.createElement('div');
        button.appendChild(div1);
        const image = document.createElement('img');
        image.src = buttonData.image;
        image.alt = buttonData.label;
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

function getLoginButton()
{
    const component = document.createElement('button');
    component.textContent = 'Login';
    return component;
}

function getCollapseHeaderButton()
{
    const component = document.createElement('button');
    component.textContent = 'Collapse';
    return component;
}

function getLowerHalf()
{
    const component = document.createElement('div');
    component.className = 'lower-half';

    const registerButton = document.createElement('button');
    registerButton.textContent = 'Register';
    component.appendChild(registerButton);

    const loginButton = getLoginButton();
    component.appendChild(loginButton);

    const contractButton = getCollapseHeaderButton();
    component.appendChild(contractButton);

    return component;
}

export function getSidebar()
{
    const component = document.createElement('div');
    component.className = 'sidebar';

    // contains home button and move to other pages
    component.appendChild(getUpperHalf());

    // contains login and contract sidebar button
    component.appendChild(getLowerHalf());

    return component;
}