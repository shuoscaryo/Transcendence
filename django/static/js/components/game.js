import PongGame from "/static/js/utils/PongGame.js";
import loadPage from '/static/js/utils/loadPage.js';

export default function createPongGameComponent(data) {
    // Create the container for the component
    const component = document.createElement('div');
    component.classList.add('pong-game');

    // Create another container that has the game and the buttons
    const gameDiv = document.createElement('div');
    gameDiv.classList.add('div-game');
    component.appendChild(gameDiv);

    // Create the score display
    const statsDiv = document.createElement('div');
    statsDiv.classList.add('div-stats');
    gameDiv.appendChild(statsDiv);

    const playerLeftDiv = document.createElement('div');
    playerLeftDiv.classList.add('div-player', 'player-left');
    playerLeftDiv.textContent = data.playerLeft.name;
    statsDiv.appendChild(playerLeftDiv);
    
    const scoreDiv = document.createElement('div');
    scoreDiv.classList.add('div-score');
    scoreDiv.textContent = '0 - 0';
    statsDiv.appendChild(scoreDiv);

    const playerRightDiv = document.createElement('div');
    playerRightDiv.classList.add('div-player', 'player-right');
    playerRightDiv.textContent = data.playerRight.name;
    statsDiv.appendChild(playerRightDiv);

    // Create the canvas and the game
    const canvas = document.createElement('canvas');
    canvas.classList.add('canvas-game');
    canvas.width = 800;
    canvas.height = 600;
    gameDiv.appendChild(canvas);
    
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
        buttonsDiv.appendChild(resetButton);
        if (data.onGameEnd)
            data.onGameEnd(game);
    }
    pong.maxScore = data.maxScore || pong.maxScore;

    // Create control buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('div-buttons');
    gameDiv.appendChild(buttonsDiv);
    
    const startButton = document.createElement('button');
    startButton.textContent = 'Start';
    startButton.addEventListener('click', () => {
        buttonsDiv.removeChild(startButton);
        buttonsDiv.appendChild(stopButton);
        pong.start();
    });
    buttonsDiv.appendChild(startButton);
    
    const stopButton = document.createElement('button');
    stopButton.textContent = 'Pause';
    stopButton.addEventListener('click', () => {
        buttonsDiv.removeChild(stopButton);
        buttonsDiv.appendChild(startButton);
        pong.stop();
    });
    
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Continue';
    resetButton.addEventListener('click', () => {
        if (data.onContinueButton)
            data.onContinueButton(pong)
        else
            loadPage("/pages/main/home");
    });

    return [component, pong];
}