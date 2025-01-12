import Path from "/static/js/utils/Path.js";
import PongGame from "/static/js/utils/PongGame.js";
import Storage from "/static/js/utils/Storage.js";

export default async function getView(component, loadCssFunction, data) {
    await loadCssFunction([
    ]);

    if (!data.controllerLeft)
        throw new Error('getView: The data.controllerLeft parameter is required.');
    if (!data.controllerRight)
        throw new Error('getView: The data.controllerRight parameter is required.');

    const statsDiv = document.createElement('div');
    statsDiv.id = 'div-stats';
    component.appendChild(statsDiv);

    const canvas = document.createElement('canvas');
    canvas.id = 'canvas-game';
    canvas.width = 800;
    canvas.height = 600;
    component.appendChild(canvas);

    const pong = new PongGame(canvas);
    pong.controllerLeft = data.controllerLeft;
    pong.controllerRight = data.controllerRight;
    Storage.addToView('pong', pong);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.id = 'div-buttons';
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

}