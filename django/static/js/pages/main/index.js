import { getSidebar } from './sidebar.js';
import { PongGame } from '/static/js/utils/PongGame.js';
import { Storage } from '/static/js/utils/Storage.js';
import { DemoAI } from '/static/js/utils/Controller.js';
import Path from '/static/js/utils/Path.js';

// General function to delete CSS files
function deleteDynamicStyles() {
    // Selecciona todos los elementos con la clase 'dynamic-style'
    const dynamicStyles = document.querySelectorAll('link.dynamic-style, style.dynamic-style');
    // Elimina cada elemento del DOM
    dynamicStyles.forEach(style => style.remove());
}

// General function to load CSS files
function loadCSS(filePaths) {
    return Promise.all(
        filePaths.map(filePath => {
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.className = 'dynamic-style';
                link.href = filePath;

                // Resolver cuando el archivo CSS haya terminado de cargarse
                link.onload = () => resolve();
                link.onerror = () => reject(`Error loading CSS file: ${filePath}`);

                document.head.appendChild(link);
            });
        })
    );
}

function getSectionButton(image, mainText, subText, onClick) {
    const component = document.createElement('button');
    component.className = 'section-button';
    component.addEventListener('click', onClick);

    const divLeft = document.createElement('div');
    divLeft.className = 'section-button-left';
    component.appendChild(divLeft);

    const img = document.createElement('img');
    img.src = image;
    divLeft.appendChild(img);

    const divRight = document.createElement('div');
    divRight.className = 'section-button-right';
    component.appendChild(divRight);

    const h2 = document.createElement('h2');
    h2.textContent = mainText;
    divRight.appendChild(h2);

    const p = document.createElement('p');
    p.textContent = subText;
    divRight.appendChild(p);

    return component;
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
        Path.img('playLogo.png'),
        'Versus Mode',
        'Play against a friend',
        () => {});
    buttonPlayVersus.classList.add('button-green');
    divButtons.appendChild(buttonPlayVersus);

    const buttonPlayTournament = getSectionButton(
        Path.img('tournamentLogo.png'),
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
        Path.img('AILogo.png'),
        'Play vs Bots',
        'Play against our AI',
        () => {});
    button.classList.add('button-green');
    button.id = 'button-play-ai';
    div.appendChild(button);

    const divImg = document.createElement('div');
    divImg.id = 'div-section-2-right';
    container.appendChild(divImg);

    const img = document.createElement('img');
    img.src = Path.img('AI.png');
    divImg.appendChild(img);

    return container;
}

function getContent() {
    const main = document.createElement('main');

    main.appendChild(getSection1());
    main.appendChild(getSection2());

    return main;
}

function getFooter() {
    const component = document.createElement('footer');
    component.textContent = 'Footer with github link and 42 link and stuff';
    return component;
}

// Loads the page content and styles
export default async function mainPage() {
    deleteDynamicStyles();
    await loadCSS([
        Path.css('main/main.css'),
        Path.css('main/sidebar.css'),
        Path.css('main/mainView.css')
    ]);

    const app = document.getElementById('app');

    const page = document.createElement('div');
    page.id = 'page';
    app.appendChild(page);
    
    page.appendChild(getSidebar());

    const content = document.createElement('div');
    content.id = 'content';
    page.appendChild(content);
    
    content.appendChild(getContent());

    const footer = getFooter();
    content.appendChild(footer);
}
