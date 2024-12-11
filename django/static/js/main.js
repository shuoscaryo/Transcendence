
// SIDEBAR stuff
function getHomeButton()
{
    return document.createElement('button');
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
        buttonDiv.className = 'headerButton';

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

function getContractHeaderButton()
{
    return document.createElement('button');
}
function getLowerHalf()
{
    const component = document.createElement('div');
    const loginButton = getLoginButton();
    component.appendChild(loginButton);

    const contractButton = getContractHeaderButton();
    component.appendChild(contractButton);

    return component;
}

function getSidebar()
{
    const component = document.createElement('div');
    component.className = 'sidebar';

    // contains home button and move to other pages
    component.appendChild(getUpperHalf());

    // contains login and contract sidebar button
    component.appendChild(getLowerHalf());

    return component;
}

// Loads the page content and styles
function main() {
    document.body.appendChild(getSidebar());
    const img = document.createElement('img'); 
    console.log(window.AppConfig.STATIC_URL);
    const staticURL = window.AppConfig.STATIC_URL;
    const imagePath = 'game/img/pong_screen_title.png';
    const fullPath = staticURL.endsWith('/') ? staticURL + imagePath : staticURL + '/' + imagePath;
    img.src = fullPath; 
    img.alt = 'Example';
    document.body.appendChild(img);

    const h1 = document.createElement('h1');
    h1.textContent = 'Welcome to Pong Game';
    document.body.appendChild(h1);

    const button = document.createElement('button');
    button.textContent = 'Versus Mode';
    button.id = 'versusButton';
    button.addEventListener('click', () => {
        console.log('Versus Mode');
    });
    document.body.appendChild(button);

    const button2 = document.createElement('button');
    button2.textContent = 'Tournament Mode';
    button2.id = 'tournamentButton';
    button2.addEventListener('click', () => {
        console.log('Tournament Mode');
    });
    document.body.appendChild(button2);

    const button3 = document.createElement('button');
    button3.textContent = 'oscar mode';
    button3.id = 'singleButton';
    button3.addEventListener('click', () => {
        console.log('oscar mode');
    });
    document.body.appendChild(button3);
    
    const button4 = document.createElement('button');
    button4.textContent = 'Login';
    button4.id = 'loginButton';
    button4.addEventListener('click', () => {
        console.log('Login');
    });
    document.body.appendChild(button4);

    // footer
    const footer = document.createElement('footer');
    footer.textContent = 'Footer';
    document.body.appendChild(footer);
}

main();