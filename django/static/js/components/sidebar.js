import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import getHomeButton from '/static/js/components/homeButton.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import apiLogout from '/static/js/utils/api/logout.js';

function getUpperHalf(isLogged)
{
    const component = document.createElement('div');
    component.className = 'upper-half';

    const homeButton = getHomeButton();
    homeButton.classList.add('header-button');
    component.append(homeButton);

    const headerButtonsDict = {
        'play':{ label: 'Play', image: Path.img('playLogo.png'), action: () => {navigate("/pages/main/game/local");}},
        'friends':{ label: 'Friends', image: Path.img('friendsLogo.png'), action: null},
        'chat':{ label: 'Chat', image: Path.img('chatLogo.png'), action: null},
        'profile':{ label: 'Profile', image: Path.img('profileLogo.png'), action: () => {navigate("/pages/main/profile");}},
    };
    let buttons = [];
    if (isLogged) {
        buttons = [
            headerButtonsDict['play'],
            headerButtonsDict['friends'],
            headerButtonsDict['chat'],
            headerButtonsDict['profile'],
        ];
    }
    else {
        buttons = [
            headerButtonsDict['play'],
        ];
    }

    buttons.forEach(buttonData => {
        const button = document.createElement('button');
        button.className = 'header-button';

        const div1 = document.createElement('div');
        button.append(div1);
        const image = document.createElement('img');
        image.src = buttonData.image;
        div1.append(image);

        const div2 = document.createElement('div');
        button.append(div2);
        const p = document.createElement('p');
        p.textContent = buttonData.label;
        div2.append(p);

        button.addEventListener('click', buttonData.action);

        component.append(button);
    });
    return component;
}

function getLowerHalf(isLogged)
{
    const component = document.createElement('div');
    component.className = 'lower-half';

    if (!isLogged) {
        const registerButton = getDefaultButton({
            bgColor: 'var(--color-lime)',
            textColor: null,
            content: 'Sign Up',
            onClick: () => {navigate("/pages/login/register");}
        });
        registerButton.classList.add('button-login');
        component.append(registerButton);
        
        const loginButton = getDefaultButton({
            bgColor: '#444444',
            textColor: null,
            content: 'Log In',
            onClick: () => {navigate("/pages/login/login");}
        });
        loginButton.classList.add('button-login');
        component.append(loginButton);
    }
    else {
        const contractButton = getDefaultButton({
            bgColor: 'var(--color-lime)',
            textColor: null,
            content: 'logout',
            onClick: async () => {
                await apiLogout();
                navigate("/");
            }
        });
        contractButton.classList.add('button-login');
        component.append(contractButton);
    }
    return component;
}

export default function getSidebar(isLogged)
{
    const component = document.createElement('div');
    component.className = 'sidebar';

    // contains home button and move to other pages
    component.append(getUpperHalf(isLogged));

    // contains login and contract sidebar button
    component.append(getLowerHalf(isLogged));

    return component;
}