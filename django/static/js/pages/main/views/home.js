import getDefaultButton from '/static/js/components/defaultButton.js';
import PongGame from '/static/js/utils/PongGame.js';
import { DemoAI } from '/static/js/utils/Controller.js';
import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import { PlayerController, PongAI } from '/static/js/utils/Controller.js';

let g_pong = null;

function getButtonWithImage({imgSrc, text, description, bgColor, bgHoverColor, textColor, onClick}) {
    const buttonContent = document.createElement('div');
    buttonContent.classList.add('button-content');

    const img = document.createElement('img');
    img.src = imgSrc;
    buttonContent.appendChild(img);

    const divText = document.createElement('div');
    divText.classList.add('button-text');
    buttonContent.appendChild(divText);

    const h2 = document.createElement('h2');
    h2.textContent = text;
    divText.appendChild(h2);

    const p = document.createElement('p');
    p.textContent = description;
    divText.appendChild(p);

    return getDefaultButton({
        bgColor: bgColor,
        bgHoverColor: bgHoverColor,
        textColor: textColor,
        content: buttonContent,
        onClick: onClick
    });
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
    divCanvas.appendChild(canvas);
    g_pong = new PongGame(canvas);
    g_pong.playerLeft.controller = new DemoAI();
    g_pong.playerRight.controller = new DemoAI();
    g_pong.onGameEnd = (game) => {game.start();};
    g_pong.start();

    const divIntro = document.createElement('div');
    divIntro.id = 'div-intro';
    section.appendChild(divIntro);

    const h1 = document.createElement('h1');
    h1.textContent = 'Play Pong online on the #1 site!';
    divIntro.appendChild(h1);

    const divButtons = document.createElement('div');
    divButtons.id = 'div-buttons';
    divIntro.appendChild(divButtons);

    const buttonPlayVersus = getButtonWithImage({
        imgSrc: Path.img('playLogo.png'),
        text: 'Versus Mode',
        description: 'Play against a friend',
        bgColor: 'var(--color-lime)',
        onClick: () => {navigate('/pages/main/game/local');}
    });
    divButtons.appendChild(buttonPlayVersus);

    const buttonPlayTournament = getButtonWithImage({
        imgSrc: Path.img('tournamentLogo.png'),
        bgColor: 'var(--color-gray)',
        text: 'Tournament',
        description: 'Create a tournament to play with friends',
        onClick: () => {navigate('/pages/main/tournament');}
    });
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

    const button = getButtonWithImage({
        imgSrc: Path.img('AILogo.png'),
        text: 'Play vs Bots',
        description: 'Play against our AI',
        bgColor: 'var(--color-lime)',
        onClick: () => {
            navigate('/pages/main/game/AI', {
                playerLeft: {
                    controller: new PlayerController("w", "s"),
                    name: "anon1",
                },
                playerRight: {
                    controller: new PongAI(),
                    name: "AI",
                },
                maxScore: 3,

                onContinueButton: (game) => {
                    navigate('/pages/main/home');
                }
            });
        }
    });
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

export default async function getView(isLogged, path) {
    if (path.subPath != '/') {
        return {status: 300, redirect: '/home'};
    }

    const css = [
        Path.css('main/home.css'),
    ];
    const component = document.createElement('div');

    const divSections = document.createElement('div');
    divSections.id = 'div-sections';
    component.appendChild(divSections);
    divSections.appendChild(getSection1());
    divSections.appendChild(getSection2());
    component.appendChild(getFooter());
    
    const pongInstance = g_pong;
    const onDestroy = () => {
        if (pongInstance)
            pongInstance.stop();
    };
    return {status: 200, component, css, onDestroy};
}

export function destroy() {
    if (g_pong)
        g_pong.stop();
    g_pong = null;
}