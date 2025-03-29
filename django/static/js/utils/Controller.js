"use strict";
import KeyStates from "/static/js/utils/KeyStates.js";
import WebSocketService from '/static/js/utils/WebSocketService.js';

export class Controller {
    constructor() {
		if (new.target === Controller) {
            throw new Error("Cannot instantiate abstract class Controller directly");
        }
    }

    getMove(paddleID, gameStatus) {
        throw new Error("Must override getMove()");
    }
}

export class PlayerController extends Controller {
    constructor(upKey, downKey) {
        super();
		this.upKey = upKey;
		this.downKey = downKey;
    }

    getMove(paddleID, gameStatus) {
        if (KeyStates.get(this.upKey))
            return -1;
    	else if (KeyStates.get(this.downKey))
            return 1;
        else
            return 0;
    }
}

export class RemoteControllerOutgoing extends Controller {
    _upKey;
    _downKey;
    _localMove = 0; // Movimiento local basado en teclas

    constructor(upKey, downKey) {
        super();
        this._upKey = upKey;
        this._downKey = downKey;
        this._setupKeyListeners();
    }

    _setupKeyListeners() {
        const updateMove = () => {
            let move = 0;
            if (KeyStates.get(this._upKey)) {
                move = -1;
            } else if (KeyStates.get(this._downKey)) {
                move = 1;
            }
            this._localMove = move; // Actualiza el movimiento local
            this._sendMove(move);   // Envía al servidor
        };

        document.addEventListener('keydown', updateMove);
        document.addEventListener('keyup', updateMove);
    }

    _sendMove(move) {
        try {
            WebSocketService.send("move", { move: move });
        } catch (error) {
            console.error('Error sending move:', error);
        }
    }

    getMove(paddleID, gameStatus) {
        return this._localMove; // Devuelve el movimiento local directamente
    }
}

// Controlador para la paleta derecha (recibe datos a través de su propio socket)
export class RemoteControllerIncoming extends Controller {
    _currentMove = 0; // Movimiento recibido del servidor

    constructor() {
        super();
		WebSocketService.addViewCallback("move_p", (message) => {
			if (message.move !== undefined)
				this._currentMove = message.move;
			else
				console.error("Error: No se recibió move en move");
		});
    }

    getMove(paddleID, gameStatus) {
        return this._currentMove; // Devuelve el movimiento recibido del servidor
    }
}

export class DemoAI extends Controller {
    constructor() {
        super();
    }

    getMove(paddleID, gameStatus) {
		const paddle = paddleID == "left" ? gameStatus.paddleLeft : gameStatus.paddleRight;
        // if the ball is moving away from the paddle, don't move
        if ((paddleID == "left") == (gameStatus.ball.v.x < 0)) {
            const margin = 10;
            if (Math.abs(paddle.pos.y + paddle.size.y / 2 - gameStatus.ball.pos.y) < margin)
                return 0;

            return paddle.pos.y + paddle.size.y / 2 < gameStatus.ball.pos.y ? 1 : -1;
        }
        return 0;
    }
}

export class PongAI extends Controller {   
	_lastParamTime; // variable to store the time of the last update
    _lastTickTime; // variable to store the time of the last move
	_targetPos; // where the paddle should go (coordinates of the top of the paddle (same as the paddle coordinates))
	_gameStatus;
	_paddle;
    _result;

	constructor() {
		super();
	}

	/**
	 * Get the direction to move the paddle.
	 * @returns {number} - 1 to move up, 0 to stay, -1 to move down.
	 */
	getMove(paddleID, gameStatus) {		
		const now = performance.now() / 1000; // milliseconds
		const margin = 1.0; // How far the paddle can be from the target position
		const dt = this._lastTickTime ? now - this._lastTickTime : 0;
		this._lastTickTime = now;
		// Calculate the target position of the paddle every second
		if (this._lastParamTime == undefined || now - this._lastParamTime > 1.0) {
			this._lastParamTime = now;
			this._gameStatus = JSON.parse(JSON.stringify(gameStatus));
			this._paddle = (paddleID == "left") ? this._gameStatus.paddleLeft : this._gameStatus.paddleRight;
			this._targetPos = this._calculateTargetPos(
				this._gameStatus.canvas,
				this._gameStatus.paddleOffset,
				this._gameStatus.ball.pos.x + this._gameStatus.ball.size.x / 2,
				this._gameStatus.ball.pos.y + this._gameStatus.ball.size.y / 2,
				this._gameStatus.ball.v.x,
				this._gameStatus.ball.v.y
            ) - this._paddle.size.y / 2; // substract the height so the targetPos is equal to the top of the paddle
        }
		
		// Guess the position of the paddle
        if (this._result) {
			this._paddle.pos.y = this._paddle.pos.y + dt * this._paddle.moveSpeed * this._result;
            if (this._paddle.pos.y < 0)
                this._paddle.pos.y = 0;
			if (this._paddle.pos.y > this._gameStatus.canvas.height - this._paddle.size.y)
                this._paddle.pos.y = this._gameStatus.canvas.height - this._paddle.size.y;
		}

		if (isNaN(this._targetPos))
			this._result = 0;
		else if (Math.abs(this._paddle.pos.y - this._targetPos) < this._paddle.moveSpeed * dt * margin)
			this._result =  0;
		else if (this._paddle.pos.y > this._targetPos)
			this._result = -1;
		else
			this._result = 1;
		return this._result;
	}
	
	/**
	 * Calculate the target position of the paddle by predicting where the ball will be.
	 * @param {number} x - The x position of the ball.
	 * @param {number} y - The y position of the ball.
	 * @param {number} vx - The x speed of the ball.
	 * @param {number} vy - The y speed of the ball.
	 * @returns {number} - The y position of the paddle when the ball reaches it.
	 */
	_calculateTargetPos(canvas, paddleOffset, x, y, vx, vy) {
		// Calculate the time it will take the ball to reach the paddle
		let timeToPaddle;
		if (vx > 0)
			timeToPaddle = (canvas.width - paddleOffset - x) / vx;
		else
			timeToPaddle = (paddleOffset - x) / vx;

		// Calculate the time it will take the ball to reach a wall
		let timeToWall;
		if (vy > 0)
			timeToWall = (canvas.height - y) / vy;
		else
		    timeToWall = (0 - y) / vy;

        // if NaN return NaN
		if (isNaN(timeToPaddle) || isNaN(timeToWall))
			return NaN;
		// If the ball hits a wall, reverse the direction and calculate next colision
		if (timeToWall < timeToPaddle)
			return this._calculateTargetPos(canvas, paddleOffset, x + vx * timeToWall, y + vy * timeToWall, vx, -vy);
		// If the ball hits the other paddle, keep bouncing
		if ((vx > 0) == (this._paddle.pos.x < canvas.width / 2))
			return this._calculateTargetPos(canvas, paddleOffset, x + vx * timeToPaddle, y + vy * timeToPaddle, -vx, vy);
		// If the ball hits this paddle, return the position
		return y + vy * timeToPaddle;
	}
}
