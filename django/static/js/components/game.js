import PongGame from "/static/js/utils/PongGame.js";
import { navigate } from '/static/js/utils/router.js';
import newElement from '/static/js/utils/newElement.js';

// Helper: always returns a wrapper with two control divs (up/down), even if empty
function createControlsDiv(playerData, side) {
    // Outer wrapper
    const wrapper = newElement('div', {
      classList: ['controls-wrapper', `controls-${side}`]
    });
  
    // Create the two control slots
    const upControl = newElement('div', {
      classList: ['control', 'control-up'],
      parent: wrapper,
    });
    const downControl = newElement('div', {
      classList: ['control', 'control-down'],
      parent: wrapper
    });
  
    // Try to fill them if data is valid
    if (
      playerData &&
      playerData.controller &&
      typeof playerData.controller.getControls === 'function'
    ) {
      const { up, down } = playerData.controller.getControls();
      if (up != null && down != null) {
        upControl.style.backgroundColor   = '#333';
        downControl.style.backgroundColor = '#333';
        // Up arrow + label
        const upArrow = newElement('span', { classList: ['control-arrow'], parent: upControl });
        upArrow.textContent = '▲';
        const upKey = newElement('span', { classList: ['control-key'], parent: upControl });
        upKey.textContent = up;
  
        // Down arrow + label
        const downArrow = newElement('span', { classList: ['control-arrow'], parent: downControl });
        downArrow.textContent = '▼';
        const downKey = newElement('span', { classList: ['control-key'], parent: downControl });
        downKey.textContent = down;
      }
    }
  
    return wrapper;
  }
  

export default function createPongGameComponent(data) {
  // Container for the whole component
  const component = newElement('div', { classList: ['section-block', 'pong-game'] });

  // Add left/right controls outside the game
  const leftControlsDiv = createControlsDiv(data.playerLeft, 'left');
  if (leftControlsDiv)  component.append(leftControlsDiv);
  
  // Game + stats + buttons container
  const gameDiv = newElement('div', { classList: ['div-game'], parent: component });

  const rightControlsDiv = createControlsDiv(data.playerRight, 'right');
  if (rightControlsDiv) component.append(rightControlsDiv);

  // Score display
  const statsDiv = newElement('div', { classList: ['div-stats'], parent: gameDiv });
  const playerLeftDiv = newElement('div', { classList: ['div-player', 'player-left'], parent: statsDiv });
  playerLeftDiv.textContent = data.playerLeft.name;
  const scoreDiv = newElement('div', { classList: ['div-score'], parent: statsDiv });
  scoreDiv.textContent = `${data.playerLeft.score ?? 0} - ${data.playerRight.score ?? 0}`;
  const playerRightDiv = newElement('div', { classList: ['div-player', 'player-right'], parent: statsDiv });
  playerRightDiv.textContent = data.playerRight.name;

  // Canvas setup
  const canvas = newElement('canvas', { classList: ['canvas-game'], parent: gameDiv });
  canvas.width  = data.canvas?.width  ?? 800;
  canvas.height = data.canvas?.height ?? 600;

  // Pong game init
  const pong = new PongGame(canvas, data.type ?? 'offline');
  if (data.playerLeft.controller)  pong.setLeftController(data.playerLeft.controller);
  if (data.playerRight.controller) pong.setRightController(data.playerRight.controller);
  if (data.playerLeft.name)        pong.setLeftName(data.playerLeft.name);
  if (data.playerRight.name)       pong.setRightName(data.playerRight.name);
  if (data.maxScore != null)       pong.setMaxScore(data.maxScore);
  if (data.ballSpeedIncrease != null) pong.setBallSpeedIncrease(data.ballSpeedIncrease);
  if (data.ballInitialSpeed != null)  pong.setBallInitialSpeed(data.ballInitialSpeed);

  pong.onGoal(game => {
    const gs = game.getGameStatus();
    scoreDiv.textContent = `${gs.playerLeft.score} - ${gs.playerRight.score}`;
    data.onGoal?.(game);
  });

  pong.onGameEnd(game => {
    const gs = game.getGameStatus();
    playerLeftDiv.style.display = 'none';
    playerRightDiv.style.display = 'none';
    statsDiv.classList.add('end');
    scoreDiv.textContent = gs.playerLeft.score > gs.playerRight.score
      ? `${gs.playerLeft.name} wins!`
      : `${gs.playerRight.name} wins!`;

    buttonsDiv.innerHTML = '';
    buttonsDiv.append(resetButton);
    data.onGameEnd?.(game);
  });

  // Control buttons
  const buttonsDiv = newElement('div', { classList: ['div-buttons'], parent: gameDiv });
  const startButton = newElement('button', { parent: buttonsDiv });
  startButton.textContent = 'Start';
  startButton.addEventListener('click', () => {
    buttonsDiv.replaceChild(stopButton, startButton);
    pong.start();
  });

  const stopButton = newElement('button');
  stopButton.textContent = 'Pause';
  stopButton.addEventListener('click', () => {
    buttonsDiv.replaceChild(startButton, stopButton);
    pong.stop();
  });

  const resetButton = newElement('button');
  resetButton.textContent = 'Continue';
  resetButton.addEventListener('click', () => {
    if (data?.onContinueButton && typeof data?.onContinueButton === 'function')
        data.onContinueButton?.(pong)
    else
        navigate("/");
  });

  return [component, pong];
}
