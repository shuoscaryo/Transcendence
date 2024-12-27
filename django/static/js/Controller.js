"use strict";
import KeyStates from "/static/js/KeyStates.js";

class Controller {
    constructor(paddle = null, getParamsFunction = null) {
        this.paddle = paddle; // Reference to the paddle object
        this.getParams = getParamsFunction; // Function to get the parameters of the game, no inputs, returns a dictionary
    }

    getMove() {
        throw new Error("Must override getMove()");
    }
}

export class PlayerController extends Controller {
    constructor() {
        super();
    }

    getMove() {
        if (KeyStates.get('w')) {
            console.log("w");
            return -1;
        } else if (KeyStates.get('s')) {
            console.log("s");
            return 1;
        } else {
            return 0;
        }
    }
}

export class DemoAI extends Controller {
    constructor(paddle, getParamsFunction) {
        super(paddle, getParamsFunction);
    }

    getMove() {
        let params = this.getParams();
        // if the ball is moving away from the paddle, don't move
        if (params.ball.speed.x > 0 == this.paddle.pos.x > params.canvas.width / 2)
        {
            const margin = 10;
            if (Math.abs(this.paddle.pos.y + this.paddle.height / 2 - params.ball.pos.y) < margin)
                return 0;

            return this.paddle.pos.y + this.paddle.height / 2 < params.ball.pos.y ? 1 : -1;
        }
        return 0;
    }
}

/**
 * This class is used to control a paddle in the pong game. It fetches the
 * state of the game every second when the game is running.
 * To use it, create an instance of this class and call the start method.
 * A getParamsFunction and a movePaddleFunction must be passed to the
 * constructor.
 * The getParamsFunction must return an object with the following structure:
 * {
 * 		paddle: {
 * 			y: number, // the position at the top of the paddle (lowest y)
 * 			height: number, // how tall is the paddle (in pixels)
 * 			v: number // the speed of the paddle (in pixels per tick)
 * 		},
 * 		ball: {
 * 			x: number, // the x position of the ball (in pixels)
 * 			y: number, // the y position of the ball (in pixels)
 * 			vx: number, // the x speed of the ball (pixels per tick) (positive is right)
 * 			vy: number // the y speed of the ball (pixels per tick) (positive is down)
 * 		},
 * 		map: {
 * 			width: number, // the width of the map (in pixels)
 * 			height: number, // the height of the map (in pixels)
 * 			paddleOffset: number // how far the paddle is from the wall (in pixels)
 * 		}
 * }
 * The movePaddleFunction must accept a number as a parameter, which will be
 * the direction to move the paddle. 1 means up, 0 means stay, -1 means down.
 * 
 * Before deleting the object remember to call the stop method.
 */
export class PongAI extends Controller {   
	#lastParamTime; // variable to store the time of the last update
    #lastTickTime; // variable to store the time of the last move
	#targetPos; // variable to store the target position of the paddle (so its not recalculated every time)
	#currentPos; // variable to store the predicted position of the paddle
	#params;
    #lastResult;
	/**
	 * Create a new PongAI instance.
	 * @param {object} paddle - The paddle object.
	 * @param {function} getParamsFunction - The function to get the parameters of the game.
	 */
	constructor(paddle, getParamsFunction) {
		super(paddle, getParamsFunction);
	}

	/**
	 * Get the direction to move the paddle.
	 * @returns {number} - 1 to move up, 0 to stay, -1 to move down.
	 */
	getMove() {
		const margin = this.paddle.moveSpeed * 0.1; // How far the paddle can be from the target position
		const now = performance.now() / 1000; // seconds
		const dt = this.#lastTickTime ? now - this.#lastTickTime : 0;
        this.#lastTickTime = now;
        
		// Calculate the target position of the paddle every second
		if (this.#lastParamTime == undefined || now - this.#lastParamTime > 1) {
            console.log(now);
            this.#params = this.getParams();
			this.#targetPos = this.#calculateTargetPos(
                this.#params.canvas,
				this.#params.ball.pos.x + this.#params.ball.size / 2,
				this.#params.ball.pos.y + this.#params.ball.size / 2,
				this.#params.ball.speed.x,
				this.#params.ball.speed.y
            );
            this.#currentPos = this.paddle.pos.y;
            this.#lastParamTime = now;
        }

        // Guess the position of the paddle
        if (this.#lastResult)
        {
            this.#currentPos = this.#currentPos + dt * this.paddle.moveSpeed * this.#lastResult;
            if (this.#currentPos < this.paddle.height / 2)
                this.#currentPos = this.paddle.height / 2;
            if (this.#currentPos > this.#params.canvas.height - this.paddle.height / 2)
                this.#currentPos = this.#params.canvas.height - this.paddle.height / 2;
        }

		if (isNaN(this.#targetPos))
			return 0;

		// calculate where to move the paddle this tick
		let result;
		if (this.#currentPos + this.paddle.height / 2 > this.#targetPos)
			result = -1;
		else if (Math.abs(this.#currentPos - this.#targetPos) < margin)
			result =  0;
		else
			result = 1;
        this.#lastResult = result;

		return result;
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
		if (vx > 0 == this.paddle.pos.x < canvas.width / 2)
			return this.#calculateTargetPos(canvas, x + vx * timeToPaddle, y + vy * timeToPaddle, -vx, vy);
		// If the ball hits this paddle, return the position
		return y + vy * timeToPaddle;
	}
}
