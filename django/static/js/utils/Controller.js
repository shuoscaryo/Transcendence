"use strict";
import KeyStates from "/static/js/utils/KeyStates.js";
import WebSocketService from '/static/js/utils/WebSocketService.js';
import ViewScope from '/static/js/utils/ViewScope.js';

export class Controller {
    constructor() {
		if (new.target === Controller) {
            throw new Error("Cannot instantiate abstract class Controller directly");
        }
    }

    getMove(paddleID, gameStatus) {
        throw new Error("Must override getMove()");
    }

	start() { // Called on game start if needed
		// Do nothing
	}

	stop() { // Called on game stop if needed
		// Do nothing
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
    _localMove = 0;

    constructor(upKey, downKey) {
        super();
        this._upKey = upKey;
        this._downKey = downKey;
		this._started = false;
    }

    _setupKeyListeners() {
        const updateMove = () => {
            let move = 0;
            if (KeyStates.get(this._upKey)) {
                move = -1;
            } else if (KeyStates.get(this._downKey)) {
                move = 1;
            }
            this._localMove = move;
			WebSocketService.send("move", { move: move });
        };

        this._downKeyRmCallback = ViewScope.addEventListener(document, 'keydown', updateMove);
        this._upKeyRmCallBack = ViewScope.addEventListener(document, 'keyup', updateMove);
    }

    getMove(paddleID, gameStatus) {
        return this._localMove;
    }

	start() {
		if (this._started)
			return;
		this._setupKeyListeners();
		this._started = true;
	}

	stop() {
		if (!this._started)
			return;
		this._downKeyRmCallback?.();
		this._upKeyRmCallBack?.();
		this._downKeyRmCallback = null;
		this._upKeyRmCallBack = null;
		this._localMove = 0;
		this._started = false;
	}
}

// Controlador para la paleta derecha (recibe datos a través de su propio socket)
export class RemoteControllerIncoming extends Controller {
    _currentMove = 0; // Movimiento recibido del servidor

    constructor() {
        super();
		this.rmCallback = null;
    }

    getMove(paddleID, gameStatus) {
        return this._currentMove; // Devuelve el movimiento recibido del servidor
    }

	start() {
		if (this.rmCallback)
			return;
		this.rmCallback = WebSocketService.addCallback("move_p", (message) => {
			if (message.move !== undefined)
				this._currentMove = message.move;
			else
				console.error("Error: move not defined in message move_p");
		});
	}

	stop () {
		if (this.rmCallback)
			this.rmCallback();
		this.rmCallback = null;
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
