import PongGame from "/static/js/utils/PongGame.js";
import { navigate } from '/static/js/utils/router.js';
import newElement from '/static/js/utils/newElement.js';


export default function createPongGameComponent(data) {
    // Create the container for the component
    const component = newElement('div', { classList: ['section-block', 'pong-game'] });

    // Create another container that has the game and the buttons
    const gameDiv = newElement('div', { classList: ['div-game'], parent: component });

    // Create the score display
    const statsDiv = newElement('div', { classList: ['div-stats'], parent: gameDiv });
    const playerLeftDiv = newElement('div', { classList: ['div-player', 'player-left'], parent: statsDiv });
    playerLeftDiv.textContent = data.playerLeft.name;
    const scoreDiv = newElement('div', { classList: ['div-score'], parent: statsDiv });
    scoreDiv.textContent = '0 - 0';
    const playerRightDiv = newElement('div', { classList: ['div-player', 'player-right'], parent: statsDiv });
    playerRightDiv.textContent = data.playerRight.name;

    // Create the canvas and the game
    const canvas = newElement('canvas', { classList: ['canvas-game'], parent: gameDiv });
    canvas.width = 800;
    canvas.height = 600;
    
    const pong = new PongGame(canvas, data?.type? data.type : 'offline');
    if(data?.playerLeft?.controller !== undefined)
        pong.setLeftController(data.playerLeft.controller);
    if(data?.playerRight?.controller !== undefined)
        pong.setRightController(data.playerRight.controller);
    if(data?.playerLeft?.name !== undefined)
        pong.setLeftName(data.playerLeft.name);
    if(data?.playerRight?.name !== undefined)
        pong.setRightName(data.playerRight.name);
    if(data?.maxScore !== undefined)
        pong.setMaxScore(data.maxScore);
    if(data?.setBallSpeedIncrease !== undefined)
        pong.setBallSpeedIncrease(data.setBallSpeedIncrease);
    
    pong.onGoal((game) => {
        const gameStatus = game.getGameStatus();
        scoreDiv.textContent = `${gameStatus.playerLeft.score} - ${gameStatus.playerRight.score}`;
        if (data?.onGoal !== undefined)
            data.onGoal(game);
    });
    
    pong.onGameEnd((game) => {
        const gameStatus = game.getGameStatus();
        playerLeftDiv.style.display = 'none';
        playerRightDiv.style.display = 'none';
        statsDiv.classList.add('end');
        if (gameStatus.playerLeft.score > gameStatus.playerRight.score)
            scoreDiv.textContent = `${gameStatus.playerLeft.name} wins!`;
        else
            scoreDiv.textContent = `${gameStatus.playerRight.name} wins!`;
        buttonsDiv.innerHTML = '';
        buttonsDiv.append(resetButton);
        if (data?.onGameEnd !== undefined)
            data.onGameEnd(game);
    });

    // Create control buttons
    const buttonsDiv = newElement('div', { classList: ['div-buttons'], parent: gameDiv });
    const startButton = newElement('button', { parent: buttonsDiv });
    startButton.textContent = 'Start';
    startButton.addEventListener('click', () => {
        buttonsDiv.removeChild(startButton);
        buttonsDiv.append(stopButton);
        pong.start();
    });
    
    const stopButton = document.createElement('button');
    stopButton.textContent = 'Pause';
    stopButton.addEventListener('click', () => {
        buttonsDiv.removeChild(stopButton);
        buttonsDiv.append(startButton);
        pong.stop();
    });
    
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Continue';
    resetButton.addEventListener('click', () => {
        if (data.onContinueButton)
            data.onContinueButton(pong)
        else
            navigate("/");
    });

    return [component, pong];
}