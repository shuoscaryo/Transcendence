import PongGame from "/static/js/utils/PongGame.js";
import Storage from "/static/js/utils/Storage.js";

export default function createPongGameComponent(data) {
    if (!data.controllerLeft)
        throw new Error('createPongGameComponent: The data.controllerLeft parameter is required.');
    if (!data.controllerRight)
        throw new Error('createPongGameComponent: The data.controllerRight parameter is required.');

    // Create the container for the component
    const component = document.createElement('div');
    component.classList.add('pong-game');

    // Create game elements
    const statsDiv = document.createElement('div');
    statsDiv.classList.add('div-stats');
    component.appendChild(statsDiv);

    const canvas = document.createElement('canvas');
    canvas.classList.add('canvas-game');
    canvas.width = 800;
    canvas.height = 600;
    component.appendChild(canvas);

    const pong = new PongGame(canvas);
    pong.controllerLeft = data.controllerLeft;
    pong.controllerRight = data.controllerRight;
    Storage.addToView('pong', pong);

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

    // Return the component to integrate it into other views
    return component;
}