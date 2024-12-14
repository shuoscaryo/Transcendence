
// General function to load CSS files
function loadCSS(filePaths) {
    filePaths.forEach(filePath => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.className = 'dynamic-styles';
        link.href = filePath;
        document.head.appendChild(link);
    });
}

// SIDEBAR stuff
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
    const loginButton = getLoginButton();
    component.appendChild(loginButton);

    const contractButton = getCollapseHeaderButton();
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

function getContent()
{
    const component = document.createElement('div');
    component.className = 'content';

    const img = document.createElement('img'); 
    const staticURL = window.AppConfig.STATIC_URL;
    const imagePath = 'game/img/pong_screen_title.png';
    const fullPath = staticURL.endsWith('/') ? staticURL + imagePath : staticURL + '/' + imagePath;
    img.src = fullPath; 
    img.alt = 'Example';
    component.appendChild(img);
    
    const h1 = document.createElement('h1');
    h1.textContent = 'Welcome to Pong Game';
    component.appendChild(h1);
    
    const button = document.createElement('button');
    button.textContent = 'Versus Mode';
    button.id = 'versusButton';
    button.addEventListener('click', () => {
        console.log('Versus Mode');
    });
    component.appendChild(button);
    
    const button2 = document.createElement('button');
    button2.textContent = 'Tournament Mode';
    button2.id = 'tournamentButton';
    button2.addEventListener('click', () => {
        console.log('Tournament Mode');
    });
    component.appendChild(button2);
    
    const button3 = document.createElement('button');
    button3.textContent = 'oscar mode';
    button3.id = 'singleButton';
    button3.addEventListener('click', () => {
        console.log('oscar mode');
    });
    component.appendChild(button3);
    
    const button4 = document.createElement('button');
    button4.textContent = 'Login';
    button4.id = 'loginButton';
    button4.addEventListener('click', () => {
        console.log('Login');
    });
    component.appendChild(button4);
    
    // footer
    const footer = document.createElement('footer');
    footer.textContent = 'Footer';
    component.appendChild(footer);

    return component;
}

// Loads the page content and styles
function main() {
    loadCSS([
        '/static/css/main/main.css',
        '/static/css/main/sidebar.css',
        '/static/css/main/content.css'
    ]);
    const app = document.getElementById('app');

    const page = document.createElement('div');
    page.className = 'page';
    app.appendChild(page);

    page.appendChild(getSidebar());
    page.appendChild(getContent());
}

main();