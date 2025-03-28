"use strict";
import KeyStates from "/static/js/utils/KeyStates.js";
import WebSocketService from '/static/js/utils/WebSocketService.js';

class Controller {
    constructor() {
		if (new.target === Controller) {
            throw new Error("Cannot instantiate abstract class Controller directly");
        }
    }

    getMove(paddleID, params) {
        throw new Error("Must override getMove()");
    }
}

export class PlayerController extends Controller {
    constructor(upKey, downKey) {
        super();
		this.upKey = upKey;
		this.downKey = downKey;
    }

    getMove(paddleID, params) {
        if (KeyStates.get(this.upKey))
            return -1;
    	else if (KeyStates.get(this.downKey))
            return 1;
        else
            return 0;
    }
}
export class RemoteControllerOutgoing extends Controller {
    #upKey;
    #downKey;
    #localMove = 0; // Movimiento local basado en teclas

    constructor(upKey, downKey) {
        super();
        this.#upKey = upKey;
        this.#downKey = downKey;
        this.#setupKeyListeners();
    }

    #setupKeyListeners() {
        const updateMove = () => {
            let move = 0;
            if (KeyStates.get(this.#upKey)) {
                move = -1;
            } else if (KeyStates.get(this.#downKey)) {
                move = 1;
            }
            this.#localMove = move; // Actualiza el movimiento local
            this.#sendMove(move);   // Envía al servidor
        };

        document.addEventListener('keydown', updateMove);
        document.addEventListener('keyup', updateMove);
    }

    #sendMove(move) {
        try {
            WebSocketService.send("move", { move: move });
        } catch (error) {
            console.error('Error sending move:', error);
        }
    }

    getMove(paddleID, params) {
        return this.#localMove; // Devuelve el movimiento local directamente
    }
}

// Controlador para la paleta derecha (recibe datos a través de su propio socket)
export class RemoteControllerIncoming extends Controller {
    #currentMove = 0; // Movimiento recibido del servidor

    constructor() {
        super();
		WebSocketService.addViewCallback("move_p", (message) => {
			console.log("Recibido movimiento del servidor:", message);
			if (message.move !== undefined)
				this.#currentMove = message.move;
			else
				console.error("Error: No se recibió move en move");
		});
    }

    getMove(paddleID, params) {
        return this.#currentMove; // Devuelve el movimiento recibido del servidor
    }
}

export class DemoAI extends Controller {
    constructor() {
        super();
    }

    getMove(paddleID, params) {
		const paddle = paddleID == "left" ? params.leftPaddle : params.rightPaddle;
        // if the ball is moving away from the paddle, don't move
        if ((paddleID == "left") == (params.ball.speed.x < 0)) {
            const margin = 10;
            if (Math.abs(paddle.pos.y + paddle.height / 2 - params.ball.pos.y) < margin)
                return 0;

            return paddle.pos.y + paddle.height / 2 < params.ball.pos.y ? 1 : -1;
        }
        return 0;
    }
}

export class PongAI extends Controller {   
	#lastParamTime; // variable to store the time of the last update
    #lastTickTime; // variable to store the time of the last move
	#targetPos; // where the paddle should go (coordinates of the top of the paddle (same as the paddle coordinates))
	#params;
	#paddle;
    #result;

	constructor() {
		super();
	}

	/**
	 * Get the direction to move the paddle.
	 * @returns {number} - 1 to move up, 0 to stay, -1 to move down.
	 */
	getMove(paddleID, params) {		
		const now = performance.now() / 1000; // milliseconds
		const margin = 1.0; // How far the paddle can be from the target position
		const dt = this.#lastTickTime ? now - this.#lastTickTime : 0;
		this.#lastTickTime = now;

		// Calculate the target position of the paddle every second
		if (this.#lastParamTime == undefined || now - this.#lastParamTime > 1.0) {
			this.#params = JSON.parse(JSON.stringify(params));
			this.#paddle = (paddleID == "left") ? this.#params.leftPaddle : this.#params.rightPaddle;
			this.#lastParamTime = now;
			this.#targetPos = this.#calculateTargetPos(
				this.#params.canvas,
				this.#params.ball.pos.x + this.#params.ball.size / 2,
				this.#params.ball.pos.y + this.#params.ball.size / 2,
				this.#params.ball.speed.x,
				this.#params.ball.speed.y
            ) - this.#paddle.height / 2; // substract the height so the targetPos is equal to the top of the paddle
        }
		
		// Guess the position of the paddle
        if (this.#result) {
			this.#paddle.pos.y = this.#paddle.pos.y + dt * this.#paddle.moveSpeed * this.#result;
            if (this.#paddle.pos.y < 0)
                this.#paddle.pos.y = 0;
			if (this.#paddle.pos.y > this.#params.canvas.height - this.#paddle.height)
                this.#paddle.pos.y = this.#params.canvas.height - this.#paddle.height;
		}

		if (isNaN(this.#targetPos))
			this.#result = 0;
		else if (Math.abs(this.#paddle.pos.y - this.#targetPos) < this.#paddle.moveSpeed * dt * margin)
			this.#result =  0;
		else if (this.#paddle.pos.y > this.#targetPos)
			this.#result = -1;
		else
			this.#result = 1;
		return this.#result;
	}
	
	/**
	 * Calculate the target position of the paddle by predicting where the ball will be.
	 * @param {number} x - The x position of the ball.
	 * @param {number} y - The y position of the ball.
	 * @param {number} vx - The x speed of the ball.
	 * @param {number} vy - The y speed of the ball.
	 * @returns {number} - The y position of the paddle when the ball reaches it.
	 */
	#calculateTargetPos(canvas, x, y, vx, vy) {
		// Calculate the time it will take the ball to reach the paddle
		let timeToPaddle;
		if (vx > 0)
			timeToPaddle = (canvas.width - canvas.paddleOffset - x) / vx;
		else
			timeToPaddle = (canvas.paddleOffset - x) / vx;

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
			return this.#calculateTargetPos(canvas, x + vx * timeToWall, y + vy * timeToWall, vx, -vy);
		// If the ball hits the other paddle, keep bouncing
		if ((vx > 0) == (this.#paddle.pos.x < canvas.width / 2))
			return this.#calculateTargetPos(canvas, x + vx * timeToPaddle, y + vy * timeToPaddle, -vx, vy);
		// If the ball hits this paddle, return the position
		return y + vy * timeToPaddle;
	}
}
