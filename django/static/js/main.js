import { getSidebar } from './components/sidebar.js';
import KeyStates from './KeyStates.js';
import { PongGame } from './components/PongGame.js';
import { Storage } from './Storage.js';
import { DemoAI, PongAI, PlayerController } from './Controller.js';

// General function to delete CSS files
function deleteDynamicStyles() {
    // Selecciona todos los elementos con la clase 'dynamic-style'
    const dynamicStyles = document.querySelectorAll('link.dynamic-style, style.dynamic-style');
    // Elimina cada elemento del DOM
    dynamicStyles.forEach(style => style.remove());
}

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
function getSectionButton(image, mainText, subText, onClick) {
    const button = document.createElement('button');
    button.className = 'section-1-button';
    button.addEventListener('click', onClick);

    const divLeft = document.createElement('div');
    divLeft.className = 'section-1-button-left';
    button.appendChild(divLeft);

    const img = document.createElement('img');
    img.src = image;
    divLeft.appendChild(img);

    const divRight = document.createElement('div');
    divRight.className = 'section-1-button-right';
    button.appendChild(divRight);

    const h2 = document.createElement('h2');
    h2.textContent = mainText;
    divRight.appendChild(h2);

    const p = document.createElement('p');
    p.textContent = subText;
    divRight.appendChild(p);

    button.addEventListener('click', () => {
        onClick();
    });

    return button;
}

function getSection1() {
    const section = document.createElement('section');
    section.id = 'section-1';

    const divCanvas = document.createElement('div');
    divCanvas.id = 'div-canvas';
    section.appendChild(divCanvas);

    const canvas = document.createElement('canvas');
    canvas.id = 'demo-gameplay';
    canvas.width = 600;
    canvas.height = 400;
    const pong = new PongGame(canvas);
    pong.controller1 = new DemoAI(pong.leftPaddle, pong.getState.bind(pong));
    pong.controller2 = new DemoAI(pong.rightPaddle, pong.getState.bind(pong));
    pong.start();
    Storage.add("pong",pong);
    divCanvas.appendChild(canvas);

    const divIntro = document.createElement('div');
    divIntro.id = 'div-intro';
    section.appendChild(divIntro);

    const h1 = document.createElement('h1');
    h1.textContent = 'Play Pong online on the #1 site!';
    divIntro.appendChild(h1);

    const divButtons = document.createElement('div');
    divButtons.id = 'div-buttons';
    divIntro.appendChild(divButtons);

    const buttonPlayVersus = getSectionButton(
        '/static/game/img/playLogo.png',
        'Versus Mode',
        'Play against a friend',
        () => {});
    buttonPlayVersus.id = 'button-play-versus';
    divButtons.appendChild(buttonPlayVersus);

    const buttonPlayTournament = getSectionButton(
        '/static/game/img/tournamentLogo.png',
        'Tournament',
        'Create a tournament to play with friends',
        () => {});
    buttonPlayTournament.id = 'button-play-tournament';
    divButtons.appendChild(buttonPlayTournament);


    return section;
}

function getSection2() {
    const container = document.createElement('section');
    container.id = 'section-2';

    const div = document.createElement('div');
    div.id = 'div-section-2-left';
    container.appendChild(div);
    const divText = document.createElement('div');
    divText.id = 'div-section-2-left-text';
    div.appendChild(divText);

    const h1 = document.createElement('h1');
    h1.textContent = 'Also check our major Module AI';
    divText.appendChild(h1);

    const p = document.createElement('p');
    p.innerHTML = `Our AI module is the best in the market,
    with a 99% win rate<br>
    <br>
    It only sees the map once a second and calculates where to move the paddle
    to bounce the ball.<br>It guesses where the paddle is by simulating the movement
    using the time since the last call and the last move decision.<br>`;
    divText.appendChild(p);

    const button = getSectionButton(
        '/static/game/img/AILogo.png',
        'Play vs Bots',
        'Play against our AI',
        () => {});
    button.id = 'button-play-ai';
    div.appendChild(button);

    const divImg = document.createElement('div');
    divImg.id = 'div-section-2-right';
    container.appendChild(divImg);

    const img = document.createElement('img');
    img.src = '/static/game/img/AI.png';
    divImg.appendChild(img);

    return container;
}

function getContent() {
    const main = document.createElement('main');
    main.id = 'main';

    main.appendChild(getSection1());
    main.appendChild(getSection2());
    
    const h1 = document.createElement('h1');
    h1.textContent = 'Welcome to Online Pong';
    main.appendChild(h1);
    
    const button = document.createElement('button');
    button.textContent = 'Versus Mode';
    button.id = 'versusButton';
    button.addEventListener('click', () => {
        console.log('Versus Mode');
    });
    main.appendChild(button);
    
    const button2 = document.createElement('button');
    button2.textContent = 'Tournament Mode';
    button2.id = 'tournamentButton';
    button2.addEventListener('click', () => {
        console.log('Tournament Mode');
    });
    main.appendChild(button2);
    
    const button3 = document.createElement('button');
    button3.textContent = 'oscar mode';
    button3.id = 'singleButton';
    button3.addEventListener('click', () => {
        console.log('oscar mode');
    });
    main.appendChild(button3);

    const button4 = document.createElement('button');
    button4.textContent = 'Login';
    button4.id = 'loginButton';
    button4.addEventListener('click', () => {
        console.log('Login');
    });
    main.appendChild(button4);

    return main;
}

// Loads the page content and styles
function main() {
    deleteDynamicStyles();
    loadCSS([
        '/static/css/main/main.css',
        '/static/css/main/sidebar.css',
        '/static/css/main/mainView.css'
    ]);

    const app = document.getElementById('app');

    const page = document.createElement('div');
    page.className = 'page';
    app.appendChild(page);
    
    page.appendChild(getSidebar());

    const content = document.createElement('div');
    content.className = 'content';
    page.appendChild(content);
    
    content.appendChild(getContent());

    const footer = document.createElement('footer');
    footer.textContent = 'Footer';
    content.appendChild(footer);

}

main();