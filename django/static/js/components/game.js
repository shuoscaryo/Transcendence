import PongGame from "/static/js/utils/PongGame.js";
import { navigate } from '/static/js/utils/router.js';

function checkData(data){
    if (!data.playerLeft)
        throw new Error('playerLeft is required');
    if (!data.playerRight)
        throw new Error('playerRight is required');
    if (!data.playerLeft.controller)
        throw new Error('playerLeft.controller is required');
    if (!data.playerRight.controller)
        throw new Error('playerRight.controller is required');
    if (!data.playerLeft.name)
        throw new Error('playerLeft.name is required');
    if (!data.playerRight.name)
        throw new Error('playerRight.name is required');
}

export default function createPongGameComponent(data) {
    // Check if the minimum data is present
    checkData(data);

    // Create the container for the component
    const component = document.createElement('div');
    component.classList.add('section-block');
    component.classList.add('pong-game');

    // Create another container that has the game and the buttons
    const gameDiv = document.createElement('div');
    gameDiv.classList.add('div-game');
    component.append(gameDiv);

    // Create the score display
    const statsDiv = document.createElement('div');
    statsDiv.classList.add('div-stats');
    gameDiv.append(statsDiv);

    const playerLeftDiv = document.createElement('div');
    playerLeftDiv.classList.add('div-player', 'player-left');
    playerLeftDiv.textContent = data.playerLeft.name;
    statsDiv.append(playerLeftDiv);
    
    const scoreDiv = document.createElement('div');
    scoreDiv.classList.add('div-score');
    scoreDiv.textContent = '0 - 0';
    statsDiv.append(scoreDiv);

    const playerRightDiv = document.createElement('div');
    playerRightDiv.classList.add('div-player', 'player-right');
    playerRightDiv.textContent = data.playerRight.name;
    statsDiv.append(playerRightDiv);

    // Create the canvas and the game
    const canvas = document.createElement('canvas');
    canvas.classList.add('canvas-game');
    canvas.width = 800;
    canvas.height = 600;
    gameDiv.append(canvas);
    
    const pong = new PongGame(canvas);
    pong.playerLeft.controller = data.playerLeft.controller;
    pong.playerRight.controller = data.playerRight.controller;
    pong.playerLeft.name = data.playerLeft.name;
    pong.playerRight.name = data.playerRight.name;
    pong.onGoal = (game) => {
        scoreDiv.textContent = `${game.playerLeft.score} - ${game.playerRight.score}`;
        if (data.onGoal)
            data.onGoal(game);
    };
    pong.onGameEnd = (game) => {
        playerLeftDiv.style.display = 'none';
        playerRightDiv.style.display = 'none';
        statsDiv.classList.add('end');
        if (game.playerLeft.score > game.playerRight.score)
            scoreDiv.textContent = `${game.playerLeft.name} wins!`;
        else
            scoreDiv.textContent = `${game.playerRight.name} wins!`;
        buttonsDiv.innerHTML = '';
        buttonsDiv.append(resetButton);
        if (data.onGameEnd)
            data.onGameEnd(game);
    }
    pong.maxScore = data.maxScore || pong.maxScore;

    // Create control buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('div-buttons');
    gameDiv.append(buttonsDiv);
    
    const startButton = document.createElement('button');
    startButton.textContent = 'Start';
    startButton.addEventListener('click', () => {
        buttonsDiv.removeChild(startButton);
        buttonsDiv.append(stopButton);
        pong.start();
    });
    buttonsDiv.append(startButton);
    
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