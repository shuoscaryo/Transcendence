"use strict";

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
class PongAI {   
	#paddle; // dictionary with the paddle position, height and speed
    #map; // dictionary with the map size and paddle offset
    #ball; // dictionary with the ball position and speed
    #tick; // counter of the ticks that passed since the last update (to predict the paddle position)
	#time; // variable to store the time of the last update
	#targetPos; // variable to store the target position of the paddle (so its not recalculated every time)
	#start; // flag to know if the game is running
	#getParamsFunction; // function to get the parameters of the game
	#movePaddleFunction; // function to move the paddle

	/**
	 * Create a new PongAI instance.
	 * @param {function} getParamsFunction - A function that returns the game parameters.
	 * @param {function} movePaddleFunction - A function that moves the paddle.
	 */
	constructor(getParamsFunction, movePaddleFunction)
	{
		this.#getParamsFunction = getParamsFunction;
		this.#movePaddleFunction = movePaddleFunction;
	}

	/**
	 * Update the parameters of the game.
	 * This method should be called outside of the class only when an event
	 * like a gol happens. (the 1 second timer is handled inside the class)
	 */
	updateParams() {
		const params = this.#getParamsFunction();
		
		// Copy and not reference
		this.#paddle = { ...params.paddle };
		this.#map = { ...params.map };
		this.#ball = { ...params.ball };
		
		// Change y to be the middle of the paddle
		this.#paddle.y = this.#paddle.y + this.#paddle.height / 2;
		
		// Save the current tick and time
		this.#tick = Ticker.now();
		this.#time = performance.now();
		this.#targetPos = null;
	}
	
	/**
	 * Start the AI
	 * Remember to stop it!
	 */
	start() {
		this.#start = true;
		this.#time = performance.now();
		this.updateParams();
		requestAnimationFrame(() => this.#loop());
	}
	
	/**
	 * Stop the AI
	 * Remember to start it!
	 */
	stop() {
		this.#start = false;
	}
	
	/**
	 * Get the direction to move the paddle.
	 * @returns {number} - 1 to move up, 0 to stay, -1 to move down.
	 */
	#getMove() {
		// How far the paddle can be from the target position
		const margin = this.#paddle.v * 0.75;

		// if the target position is not calculated, calculate it (resets with updateParams)
		if (!this.#targetPos)
			this.#targetPos = this.#calculateTargetPos(this.#ball.x, this.#ball.y, this.#ball.vx, this.#ball.vy);
		if (isNaN(this.#targetPos))
			return 0;
		
		// update the paddle position (its a prediction, not looking at the game)
		const newTick = Ticker.now();
		if (this.#paddle.lastResult != undefined)
		{
			this.#paddle.y = this.#paddle.y + (newTick - this.#tick) * this.#paddle.v * (-this.#paddle.lastResult);
			if (this.#paddle.y < this.#paddle.height / 2)
				this.#paddle.y = this.#paddle.height / 2;
			if (this.#paddle.y > this.#map.height - this.#paddle.height / 2)
				this.#paddle.y = this.#map.height - this.#paddle.height / 2;
		}
		this.#tick = newTick;

		// calculate where to move the paddle this tick
		let result;
		if (this.#paddle.y > this.#targetPos + margin)
			result = 1;
		else if (this.#paddle.y > this.#targetPos - margin
			&& this.#paddle.y < this.#targetPos + margin)
			result =  0;
		else
			result = -1;
		this.#paddle.lastResult = result;

		return result;
	}
	
	/**
	 * Loop to keep the AI running
	 */
	#loop() {
		if (this.#start !== true)
			return;
		
		if (performance.now() - this.#time > 1000) {
			this.updateParams();
			this.#time = performance.now();
		}
		
		this.#movePaddleFunction(this.#getMove());
		requestAnimationFrame(() => this.#loop());
	}
	
	/**
	 * Calculate the target position of the paddle.
	 * @param {number} x - The x position of the ball.
	 * @param {number} y - The y position of the ball.
	 * @param {number} vx - The x speed of the ball.
	 * @param {number} vy - The y speed of the ball.
	 * @returns {number} - The y position of the paddle when the ball reaches it.
	 */
	#calculateTargetPos(x, y, vx, vy) {
		// Calculate the time it will take the ball to reach the paddle
		let ticksToPaddle;
		if (vx > 0)
			ticksToPaddle = (this.#map.width - this.#map.paddleOffset - x) / vx;
		else
			ticksToPaddle = (this.#map.paddleOffset - x) / vx;
		// Calculate the time it will take the ball to reach a wall
		let ticksToWall;
		if (vy > 0)
			ticksToWall = (this.#map.height - y) / vy;
		else
		ticksToWall = (0 - y) / vy;
		// if NaN return NaN
		if (isNaN(ticksToPaddle) || isNaN(ticksToWall))
			return NaN;
		// If the ball hits a wall, reverse the direction and calculate next colision
		if (ticksToWall < ticksToPaddle)
			return this.#calculateTargetPos(x + vx * ticksToWall, y + vy * ticksToWall, vx, -vy);
		// If the ball hits the left paddle, keep bouncing
		if (vx < 0)
			return this.#calculateTargetPos(x + vx * ticksToPaddle, y + vy * ticksToPaddle, -vx, vy);
		// If the ball hits the right paddle, return the position
		return y + vy * ticksToPaddle;
	}
}
