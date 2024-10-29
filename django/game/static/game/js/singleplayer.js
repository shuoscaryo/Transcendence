class Ticker {
/* Global tick count, use Ticker.now() to get the current tick count */
	static #count = 0;

	static {
		Ticker.#iniciarCuenta();
	}

    static #iniciarCuenta() {
        Ticker.#count++;
        requestAnimationFrame(() => Ticker.#iniciarCuenta());
    }

    static now() {
        return Ticker.#count;
    }
}

class pongAI
{   
	#paddle;
    #map;
    #ball;
    #tick;
	#targetPos;
	/*
	 * params = {
	 *		paddleY:
	 * 			y (paddle_y is the bottom of the paddle currently)
	 *			height
	 *			v (speed of the paddle when moving)
	 *		ball: 
	 * 			x
	 *			y
	 *			vx
	 *			vy
	 * 		map:
	 *			width
	 *			height
	 			paddleOffset (how far the paddle is from the wall)
	*/
	constructor(params)
	{
		this.updateParams(params);
	}

	getMove() // call this all time to get the move (1 up, 0, -1 down)
	{
		const margin = this.#paddle.v * 0.5;

		// if the target position is not calculated, calculate it (resets with updateParams)
		if (!this.#targetPos)
			this.#targetPos = this.#calculateTargetPos(this.#ball.x, this.#ball.y, this.#ball.vx, this.#ball.vy);
		if (isNaN(this.#targetPos))
			return 0;
		
		// update the paddle position (its a prediction, not looking at the game)
		const newTick = Ticker.now();
		if (this.#paddle.lastResult != undefined)
		{
			this.#paddle.y = this.#paddle.y + (newTick - this.#tick) * this.#paddle.v * this.#paddle.lastResult;
			if (this.#paddle.y < this.#paddle.height / 2)
				this.#paddle.y = this.#paddle.height / 2;
			if (this.#paddle.y > this.#map.height - this.#paddle.height / 2)
				this.#paddle.y = this.#map.height - this.#paddle.height / 2;
		}
		this.#tick = newTick;

		// calculate where to move the paddle this tick
		let result;
		if (this.#paddle.y > this.#targetPos + margin)
			result = -1;
		else if (this.#paddle.y > this.#targetPos - margin
			&& this.#paddle.y < this.#targetPos + margin)
			result =  0;
		else
			result = 1;
		this.#paddle.lastResult = result;
		return result;
	}

	updateParams(params) // call this once per second (subject requirement)
	{
		// Copy and not reference
		this.#paddle = { ...params.paddle };
		this.#map = { ...params.map };
		this.#ball = { ...params.ball };
		
		// Change y to be the middle of the paddle
		this.#paddle.y = this.#paddle.y + this.#paddle.height / 2;

		// Save the current tick and time
		this.#tick = Ticker.now();
		this.#targetPos = null;
	}

	#calculateTargetPos(x, y, vx, vy)
	{
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

// Temporal functions, should be done pretty :)
// don't use this one outside the file
function getParams()
{
	canvas  = document.getElementById('pongSingleGame');
	return {
		paddle: {
			y: rightPaddleY,
			height: paddleHeight,
			v: paddleSpeed
		},
		ball: {
			x: ballX,
			y: ballY,
			vx: ballSpeedX,
			vy: ballSpeedY
		},
		map: {
			width: canvas.width,
			height: canvas.height,
			paddleOffset: 20
		}
	};
}

// don't use this one outside the file
function loopAI(ai, init = false)
{
	if (gameOver)
		return;
	
	if (init)
	{
		loopAI.time = performance.now();
		loopAI.playersScore = 0;
	}
	
	if (performance.now() - loopAI.time > 1000 || loopAI.playersScore != player2Score + player1Score)
	{
		ai.updateParams(getParams());
		loopAI.time = performance.now();
		loopAI.playersScore = player2Score + player1Score;
	}
		
	move = ai.getMove();
	
	rightPaddleMovingUp = move < 0;
	rightPaddleMovingDown = move > 0;
	requestAnimationFrame(() => loopAI(ai, false));
}
	
	
// this one!
function startAI()
{
	ai = new pongAI(getParams());
	requestAnimationFrame(() => loopAI(ai, true));
}


