function getHomeButton()
{
    const component = document.createElement('button');
    component.id = 'home-button';
    component.class = 'header-button';
    
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

    buttons.forEach(button => {
        const buttonDiv = document.createElement('button');
        buttonDiv.className = 'header-button';

        const image = document.createElement('img');
        image.src = button.image;
        image.alt = button.label;
        buttonDiv.appendChild(image);

        const label = document.createElement('label');
        label.textContent = button.label;
        buttonDiv.appendChild(label);

        buttonDiv.addEventListener('click', button.action);

        component.appendChild(buttonDiv);
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