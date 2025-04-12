import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import getHomeButton from '/static/js/components/homeButton.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import request from '/static/js/utils/request.js';
import newElement from '/static/js/utils/newElement.js';

function getUpperHalf(isLogged)
{
    const component = newElement('div', {classList: ['upper-half']});
    const homeButton = getHomeButton();
    homeButton.classList.add('header-button');
    component.append(homeButton);

    const headerButtonsDict = {
        'play':{ label: 'Play', image: Path.img('playLogo.png'), action: () => {navigate("/game/match/local");}},
        'friends':{ label: 'Friends', image: Path.img('friendsLogo.png'), action: () => {navigate("/main/friends");}},
        'profile':{ label: 'Profile', image: Path.img('profileLogo.png'), action: () => {navigate("/main/profile");}},
        'settings':{ label: 'Settings', image: Path.img('settingsLogo.png'), action: () => {navigate("/main/settings");}},
    };
    let buttons = [];
    if (isLogged) {
        buttons = [
            headerButtonsDict['play'],
            headerButtonsDict['friends'],
            headerButtonsDict['profile'],
            headerButtonsDict['settings'],
        ];
    }
    else {
        buttons = [
            headerButtonsDict['play'],
        ];
    }

    buttons.forEach(buttonData => {
        const button = newElement('div', {classList: ['header-button']});
        newElement('img', {parent: button, src: buttonData.image});
        newElement('span', {parent: button, textContent: buttonData.label}); 
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
            onClick: () => {navigate("/login/register");}
        });
        registerButton.classList.add('button-login');
        component.append(registerButton);
        
        const loginButton = getDefaultButton({
            bgColor: '#444444',
            textColor: null,
            content: 'Log In',
            onClick: () => {navigate("/login/login");}
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
                const response = await request("POST", Path.API.LOGOUT);
                if (response.status !== 200) {
                    alert(`Couldn't log you out :(`);
                    return;
                }
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
    const component = newElement('div', {id: 'sidebar'});
    // contains home button and move to other pages
    component.append(getUpperHalf(isLogged));
    // contains login and contract sidebar button
    component.append(getLowerHalf(isLogged));

    return component;
}