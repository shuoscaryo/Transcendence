import PongGame from "/static/js/utils/PongGame.js";

export default function createPongGameComponent(data) {
    if (!data?.playerLeft?.controller)
        throw new Error('createPongGameComponent: The data.playerLeftController parameter is required.');
    if (!data?.playerRight?.controller)
        throw new Error('createPongGameComponent: The data.playerRightController parameter is required.');

    // Create the container for the component
    const component = document.createElement('div');
    component.classList.add('pong-game');

    // Create game elements
    const statsDiv = document.createElement('div');
    statsDiv.classList.add('div-stats');
    component.appendChild(statsDiv);

    const scoreLeft = document.createElement('div');
    scoreLeft.textContent = '0';
    statsDiv.appendChild(scoreLeft);

    const scoreRight = document.createElement('div');
    scoreRight.textContent = '0';
    statsDiv.appendChild(scoreRight);

    const canvas = document.createElement('canvas');
    canvas.classList.add('canvas-game');
    canvas.width = 800;
    canvas.height = 600;
    component.appendChild(canvas);
    
    // Create control buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('div-buttons');
    component.appendChild(buttonsDiv);
    
    const startButton = document.createElement('button');
    startButton.textContent = 'Start';
    startButton.addEventListener('click', () => pong.start());
    buttonsDiv.appendChild(startButton);
    
    const stopButton = document.createElement('button');
    stopButton.textContent = 'Stop';
    stopButton.addEventListener('click', () => pong.stop());
    buttonsDiv.appendChild(stopButton);
    
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.addEventListener('click', () => pong.reset());
    buttonsDiv.appendChild(resetButton);
    
    const pong = new PongGame(canvas);
    pong.playerLeft.controller = data.playerLeft.controller;
    pong.playerRight.controller = data.playerRight.controller;
    pong.playerLeft.name = data.playerLeft.name;
    pong.playerRight.name = data.playerRight.name;
    pong.onGoal = (game) => {
        /*update div with scores*/
        scoreLeft.textContent = game.playerLeft.score;
        scoreRight.textContent = game.playerRight.score;
        if (data.onGoal)
            data.onGoal(game);
    };
    pong.onGameEnd = data.onGameEnd;
    pong.maxScore = data.maxScore || pong.maxScore;

    return [component, pong];
}