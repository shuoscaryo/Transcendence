import getSectionButton from '../sectionButton.js';
import PongGame from '/static/js/utils/PongGame.js';
import { DemoAI } from '/static/js/utils/Controller.js';
import Storage from '/static/js/utils/Storage.js';
import Path from '/static/js/utils/Path.js';
import loadPage from '/static/js/utils/loadPage.js';
import { PlayerController, PongAI } from '/static/js/utils/Controller.js';

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
    Storage.addToView("pong", pong);
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
        () => { loadPage("main", "game", {controllerLeft: PlayerController, controllerRight: PongAI});}
    );
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

function getFooter() {
    const component = document.createElement('footer');
    component.textContent = 'Footer with github link and 42 link and stuff';
    return component;
}

export default async function getView(component, loadCssFunction) {
    await loadCssFunction([
        Path.css('main/mainView.css'),
    ]);

    const divSections = document.createElement('div');
    divSections.id = 'div-sections';
    component.appendChild(divSections);
    divSections.appendChild(getSection1());
    divSections.appendChild(getSection2());
    component.appendChild(getFooter());
}