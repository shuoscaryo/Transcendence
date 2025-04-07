import getDefaultButton from '/static/js/components/defaultButton.js';
import PongGame from '/static/js/utils/PongGame.js';
import { DemoAI, PlayerController, PongAI } from '/static/js/utils/Controller.js';
import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import newElement from '/static/js/utils/newElement.js';
import ViewScope from '/static/js/utils/ViewScope.js';

function getButtonWithImage({imgSrc, text, description, bgColor, bgHoverColor, textColor, onClick}) {
    const buttonContent = newElement('div', {classList: ['button-content']});
    newElement('img', {parent: buttonContent, src: imgSrc});
    const divText = newElement('div', {parent: buttonContent});
    newElement('span', {classList: ['button-text'], textContent: text, parent: divText});
    newElement('span', {classList: ['description-text'], textContent: description, parent: divText});

    return getDefaultButton({
        bgColor,
        bgHoverColor,
        textColor,
        content: buttonContent,
        onClick
    });
}

function getSection1() {
    const component = newElement('section', {id: 'section-1', classList: ['section-block']});

    const canvas = newElement('canvas', {width: 600, height: 400, parent: component});
    const pong = new PongGame(canvas);
    pong.setLeftController(new DemoAI());
    pong.setRightController(new DemoAI());
    pong.onGameEnd((game) => {game.start();});
    ViewScope.onMount(() => pong.start());
    ViewScope.onDestroy(() => pong.stop());

    const sectionContent = newElement('div', {parent: component});
    const pageTitle = newElement('h1', {parent: sectionContent});
    pageTitle.textContent = 'Play Pong online on the #1 site!';

    const buttonsDiv = newElement('div', {parent: sectionContent, id: 'buttons-div'});

    const buttonPlayVersus = getButtonWithImage({
        imgSrc: Path.img('playLogo.png'),
        text: 'Versus Mode',
        description: 'Play against a friend',
        bgColor: 'var(--color-lime)',
        onClick: () => {navigate('/game/match/local');}
    });
    buttonsDiv.append(buttonPlayVersus);

    const buttonPlayTournament = getButtonWithImage({
        imgSrc: Path.img('tournamentLogo.png'),
        bgColor: 'var(--color-gray)',
        text: 'Tournament',
        description: 'Create a tournament to play with friends',
        onClick: () => {navigate('/game/tournament');}
    });
    buttonPlayTournament.id = 'button-play-tournament';
    buttonsDiv.append(buttonPlayTournament);

    return component;
}

function getSection2() {
    const component = newElement('section', {id: 'section-2', classList: ['section-block']});
    const sectionContent = newElement('div', {parent: component});

    const divText = newElement('div', {parent: sectionContent, classList: ['text-div']});
    const h2 = newElement('h2', {parent: divText});
    h2.textContent = 'Also check our major Module AI';
    const p = newElement('p', {parent: divText});
    p.innerHTML = `Our AI module is the best in the market, with a 99% win rate<br><br>
    It only sees the map once a second and calculates where to move the paddle
    to bounce the ball. It guesses where the paddle is by simulating the movement
    using the time since the last call and the last move decision.`;

    const button = getButtonWithImage({
        imgSrc: Path.img('AILogo.png'),
        text: 'Play vs Bots',
        description: 'Play against our AI',
        bgColor: 'var(--color-lime)',
        onClick: () => {
            navigate('/game/match/AI', {
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
                    navigate('/main/home');
                }
            });
        }
    });
    sectionContent.append(button);

    const img = newElement('img', {parent: component});
    img.src = Path.img('AI.png');

    return component;
}

function getSection3() {
    const component = newElement('section', {id: 'section-3', classList: ['section-block']});
    const img = newElement('img', {parent: component});
    img.src = Path.img('homeOnlineSection.png');
    const sectionContent = newElement('div', {parent: component});
    
    const divText = newElement('div', {parent: sectionContent, classList: ['text-div']});
    const h2 = newElement('h2', {parent: divText});
    h2.textContent = 'Challenge players online!';
    const p = newElement('p', {parent: divText});
    p.innerHTML = `Join our online matchmaking system to play against players
    from all over the world (42 campus at most).<br><br>
    We use advanced websocket technology to provide a seamless experience, 
    allowing you to play against other players in real-time!.`;

    const button = getButtonWithImage({
        imgSrc: Path.img('match_online.png'),
        text: 'Play Online',
        description: 'Find an online match',
        bgColor: 'var(--color-lime)',
        onClick: () => {
            navigate('/game/match/online');
        }
    });
    sectionContent.append(button);

    return component;
}

export default async function getView(isLogged, path) {
    if (path.subPath != '/') {
        return {status: 300, redirect: '/home'};
    }

    const css = [Path.css('main/home.css')];
    const component = document.createElement('div');

    component.append(getSection1());
    component.append(getSection2());
    component.append(getSection3());

    return {status: 200, component, css};
}
