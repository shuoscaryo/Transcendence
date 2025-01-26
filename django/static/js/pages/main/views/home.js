import getDefaultButton from '/static/js/components/defaultButton.js';
import PongGame from '/static/js/utils/PongGame.js';
import { DemoAI } from '/static/js/utils/Controller.js';
import Path from '/static/js/utils/Path.js';
import loadPage from '/static/js/utils/loadPage.js';
import { PlayerController, PongAI } from '/static/js/utils/Controller.js';

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

function addRatonMiltonVideo() {
    const component = document.getElementById('view');
    // ID del video de YouTube
    const videoId = "qS0HlqjQHnk";

    // Crea el iframe del video con autoplay activado
    const iframe = document.createElement("iframe");
    iframe.width = "560"; // Ancho del video
    iframe.height = "315"; // Alto del video
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&showinfo=0&rel=0`; // autoplay agregado aquí
    iframe.title = "YouTube video player";
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.allow = "autoplay"; // Asegura que el autoplay esté permitido en algunos navegadores

    // Limpia el contenido del componente y añade el iframe
    component.appendChild(iframe);
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
    const pong = new PongGame(canvas);
    pong.playerLeft.controller = new DemoAI();
    pong.playerRight.controller = new DemoAI();
    pong.onGameEnd = (game) => {game.start();};
    pong.start();

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
        onClick: () => {
            loadPage("main", "game", {
                playerLeft: { 
                    controller: new PlayerController("w", "s"),
                    name: "anon1",
                },
                playerRight: {
                    controller: new PlayerController("ArrowUp", "ArrowDown"),
                    name: "anon2",
                },
                maxScore: 3,
                onContinueButton: (game) => {
                    loadPage("main", "home");
                }
            });
        }
    });
    divButtons.appendChild(buttonPlayVersus);

    const buttonPlayTournament = getButtonWithImage({
        imgSrc: Path.img('tournamentLogo.png'),
        bgColor: 'var(--color-gray)',
        text: 'Tournament',
        description: 'Create a tournament to play with friends',
        onClick: () => {loadPage("main", "tournament");}
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
            loadPage("main", "game", {
                playerLeft: {
                    controller: new PlayerController("w", "s"),
                    name: "anon1",
                },
                playerRight: {
                    controller: new PongAI(),
                    name: "AI",
                },
                maxScore: 3,
                onGameEnd: (game) => {
                    if (game.playerRight.score > game.playerLeft.score)
                        addRatonMiltonVideo();
                },
                onContinueButton: (game) => {
                    loadPage("main", "home");
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

export default async function getView(component, loadCssFunction) {
    await loadCssFunction([
        Path.css('main/home.css'),
    ]);

    const divSections = document.createElement('div');
    divSections.id = 'div-sections';
    component.appendChild(divSections);
    divSections.appendChild(getSection1());
    divSections.appendChild(getSection2());
    component.appendChild(getFooter());
}