import WebSocketService from '/static/js/utils/WebSocketService.js';
import { Controller } from '/static/js/utils/Controller.js';

class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // Configure the vector using polar coordinates
    setPolar(magnitude, angle) {
        this.x = magnitude * Math.cos(angle);
        this.y = magnitude * Math.sin(angle);
    }

    // Returns the legnth of the vector
    module() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    // Returns the angle of the vector
    getAngle() {
        return Math.atan2(this.y, this.x);
    }

    // Scales the vector by a factor
    scale(factor) {
        this.x *= factor;
        this.y *= factor;
    }

    // Returns a new vector with the same direction but with a magnitude of 1
    unitary() {
        const magnitude = this.module();
        if (magnitude === 0) return new Vector2D(0, 0); // Avoid division by zero
        return new Vector2D(this.x / magnitude, this.y / magnitude);
    }

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
    }

    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
    }

    dotProduct(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    getValues() {
        return { x: this.x, y: this.y };
    }

    setValues(data) {
        if (!data) return;
        this.x = data.x ?? this.x;
        this.y = data.y ?? this.y;
    }
}

function reflectVector(incident, normal) {
	const dot = incident.x * normal.x + incident.y * normal.y;
	
	return new Vector2D (
	  incident.x - 2 * dot * normal.x,
	  incident.y - 2 * dot * normal.y
    );
}

class Object {
    constructor() {
        this.pos = new Vector2D();
        this.v = new Vector2D();
        this.size = new Vector2D();
    }

    update(dt) {
        this.pos.x = this.pos.x + this.v.x * dt;
        this.pos.y = this.pos.y + this.v.y * dt;
    }

    draw(ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
    }

    getValues() {
        return {
            pos: this.pos.getValues(),
            v: this.v.getValues(),
            size: this.size.getValues()
        };
    }

    setValues(data) {
        if (!data) return;
        this.pos.setValues(data.pos);
        this.v.setValues(data.v);
        this.size.setValues(data.size);
    }
}

class Ball extends Object {
    constructor(size = 10) {
        super();
        this.size.x = size;
        this.size.y = size;
    }

    increaseSpeed(amount) {
        let L = this.v.module();
        this.v.x = this.v.x / L * (L + amount);
        this.v.y = this.v.y / L * (L + amount);
    }
}

class Paddle extends Object {
    constructor(width, height, moveSpeed) {
        super();
        this.size.x = width;
        this.size.y = height;
        this.direction = 0; // -1 for up, 1 for down, 0 for stop
        this.moveSpeed = moveSpeed;
    }

    move(direction) {
        this.direction = Math.sign(direction);
    }

    update(dt) {
        this.v.y = this.direction * this.moveSpeed;
        super.update(dt);
    }

    getValues() {
        return {
            ...super.getValues(),
            direction: this.direction,
            moveSpeed: this.moveSpeed
        };
    }

    setValues(data) {
        if (!data) return;
        super.setValues(data);
        this.direction = data.direction ?? this.direction;
        this.moveSpeed = data.moveSpeed ?? this.moveSpeed;
    }
}

class Player {
    constructor() {
        this.name = null;
        this.score = 0;
        this.controller = null;
    }

    getValues() {
        return {
            name: this.name,
            score: this.score
        };
    }
}

export default class PongGame {
    // Private variables
    _canvas; // Canvas element where the game is drawn (DOM element)
    _ctx; // Variable to draw on the canvas
    _ball; // Ball object
    _ballSpeedIncrease; // [Configurable] How much the ball speed increases when it hits a paddle (current V + increase pixels/s)
    _ballMaxAngle; // Maximum angle the ball can have when moving (from the horizontal) (in degrees)
    _paddleLeft; // Left paddle object
    _paddleRight; // Right paddle object
    _playerLeft; // [Configurable .controller .name] Player object for the left player
    _playerRight; // [Configurable .controller .name] Player object for the right player
    _maxScore; // [Configurable] Score limit to end the game
    _onGameEnd; // [Configurable] Function to call when the game ends (takes the gameStatus as a parameter)
    _onGoal; // [Configurable] Function to call when a goal is scored (takes the gameStatus as a parameter)
    _type;  // 'offline': no websocket used
            // 'host': Sends gameState through Websocket (leftPlayer.controller: playerController, rightPlayer.controller: remoteControllerIncoming)
            // 'client' receives gameState through Websocket (leftPlayer.controller: null, rightPlayer.controller: remoteControllerOutgoing)
    _state; // 'Playing', 'Goal', 'End'
    _lastState; // State of the last update
    _goalTimer; // Temporary timer used when a goal is scored to wait until the next round (seconds)
    _goalFlag; // Flag that triggers to reset paddles after a goal before the next round
    _animationFrameId; // variable to start and stop the game loop
    _lastTime; // variable to store the time of the last update call (milliseconds)
    _paddleOffset; // Distance from the paddle to the wall (pixels)
    _rmStateCallback; // Function to remove the callback from the WebSocketService when the game stops
    _ballInitialSpeed; // [configurable] Initial speed of the ball (pixels/s)
    _startTime; // Time when the game started (seconds)
    _matchDuration; // Duration of the match (seconds)

    constructor(canvas, type = 'offline') { // type: 'offline', 'host', 'client'
        if (!(canvas instanceof HTMLCanvasElement))
            throw new Error("canvas must be an instance of HTMLCanvasElement");
        if (type !== 'offline' && type !== 'host' && type !== 'client')
            throw new Error("PongGame type must be 'offline', 'host' or 'client'");
        this._type = type;
        this._state = 'Start';
        this._canvas = canvas;
        this._ctx = this._canvas.getContext('2d');
        this._ball = new Ball(10);
        this._ballInitialSpeed = this._canvas.width / 2;
        this._ballSpeedIncrease = 0;
        this._ballMaxAngle = 60;
        this._paddleLeft = new Paddle(10, 100, this._canvas.height / 3);
        this._paddleRight = new Paddle(10, 100, this._canvas.height / 3);
        this._paddleOffset = this._paddleLeft.size.x * 2;
        this._playerLeft = new Player();
        this._playerRight = new Player();
        this._maxScore = 5;
        this._onGameEnd = null;
        this._onGoal = null;
        this._startTime = null;
        this._duration = null;
        
        this._startPosition();
        this._draw();
    }

    setLeftController(controller) {
        if (controller != null && !(controller instanceof Controller))
            throw new Error("controller must be derived from Controller or null");
        this._playerLeft.controller = controller;
    }

    setLeftName(name) {
        if (typeof name !== "string")
            throw new Error("name must be a string");
        this._playerLeft.name = name;
    }

    setRightController(controller) {
        if (controller != null && !(controller instanceof Controller))
            throw new Error("controller must be derived from Controller or null");
        this._playerRight.controller = controller;
    }

    setRightName(name) {
        if (typeof name !== "string")
            throw new Error("name must be a string");
        this._playerRight.name = name;
    }

    setMaxScore(score) {
        if (typeof score !== "number" || score < 1)
            throw new Error("score must be a number greater than 0");
        this._maxScore = score;
    }

    onGoal(callback) {
        if (typeof callback !== "function")
            throw new Error("callback must be a function");
        this._onGoal = callback;
    }

    onGameEnd(callback) {
        if (typeof callback !== "function")
            throw new Error("callback must be a function");
        this._onGameEnd = callback;
    }

    setBallSpeedIncrease(amount) {
        if (typeof amount !== "number" || amount < 0)
            throw new Error("amount must be a number greater than or equal to 0");
        this._ballSpeedIncrease = amount;
    }

    setBallInitialSpeed(speed) {
        if (typeof speed !== "number" || speed <= 0)
            throw new Error("speed must be a number greater than 0");
        this._ballInitialSpeed = speed;
    }

    getPlayerLeft() {
        return { name: this._playerLeft.name, score: this._playerLeft.score };
    }

    getPlayerRight() {
        return { name: this._playerRight.name, score: this._playerRight.score };
    }

    getDuration() {
        return this._duration;
    }


    start() {
        // If game already running don't start again
        if (this._animationFrameId)
            return;

        // If game ended already, reset it and continue
        if (this._state === "End")
            this.reset();

        // If start state, init parameters and skip to playing
        if (this._state === "Start") {
            this._state = "Playing";
            this._startPosition();
            this._draw();
            this._lastTime = null;
            this._startTime = performance.now() / 1000;
        }

        // Annoying addition to enable and disable callbacks of controllers
        this._playerLeft.controller?.start();
        this._playerRight.controller?.start();
        
        // If client, add callback to receive game state
        if (this._type === 'client')
            this._rmStateCallback = WebSocketService.addViewCallback('game_state', (data) => {
                this._receivedState = data;
            });
        
        // This is the main loop of the game
        const gameLoop = (timestamp) => {
            // Update the game state synchronously
            if (this._receivedState) {
                this.setGameStatus(this._receivedState);
                this._receivedState = null;
            }

            // Calculate the time since the last update
            if (this._lastTime == null) //TODO _lastTime is not updated in callback, check if it doesn't do weird things
                this._lastTime = timestamp;
            const dt = (timestamp - this._lastTime) / 1000;
            this._lastTime = timestamp;
            
            // Update the game state
            this._update(dt);
            
            // Send the game state to the clients if host
            if (this._type === 'host')
                WebSocketService.send('game_state', JSON.parse(JSON.stringify(this.getGameStatus())));

            // Draw the game in the canvas
            this._draw();

            // If the loop hasn't been stopped, request another frame
            if (this._animationFrameId)
                this._animationFrameId = requestAnimationFrame(gameLoop);
        };

        this._animationFrameId = requestAnimationFrame(gameLoop);
    }

    stop() {
        // Remove the callback from the game_state message
        if (this._rmStateCallback)
            this._rmStateCallback();
        this._rmStateCallback = null;

        // Stop the controllers
            this._playerLeft.controller?.stop();
            this._playerRight.controller?.stop();
        this._lastTime = null;
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    }

    reset() {
        this.stop();
        this._startPosition();
        this._playerLeft.score = 0;
        this._playerRight.score = 0;
        this._state = "Start";
        this._startTime = null;
        this._duration = null;
        this._draw();
    }
    
    getGameStatus() {
        const status = {
            canvas: {
                width: this._canvas.width,
                height: this._canvas.height
            },
            ball: this._ball.getValues(),
            ballSpeedIncrease: this._ballSpeedIncrease,
            ballMaxAngle: this._ballMaxAngle,
            ballInitialSpeed: this._ballInitialSpeed,
            paddleLeft: this._paddleLeft.getValues(),
            paddleRight: this._paddleRight.getValues(),
            playerLeft: this._playerLeft.getValues(),
            playerRight: this._playerRight.getValues(),
            maxScore: this._maxScore,
            state: this._state,
            lastState: this._lastState,
            goalTimer: this._goalTimer,
            goalFlag: this._goalFlag,
            lastTime: this._lastTime,
            paddleOffset: this._paddleOffset
        };
        return status;
    }

    setGameStatus(status) {
        if (!status) return;
        
        this._canvas.width = status.canvas?.width ?? this._canvas.width;
        this._canvas.height = status.canvas?.height ?? this._canvas.height;
        if (status.ball)
            this._ball.setValues(status.ball);
        this._ballSpeedIncrease = status.ballSpeedIncrease ?? this._ballSpeedIncrease;
        this._ballMaxAngle = status.ballMaxAngle ?? this._ballMaxAngle;
        this._ballInitialSpeed = status.ballInitialSpeed ?? this._ballInitialSpeed;
        if (status.paddleLeft)
            this._paddleLeft.setValues(status.paddleLeft);
        if (status.paddleRight)
            this._paddleRight.setValues(status.paddleRight);
        this._playerRight.score = status.playerRight?.score ?? this._playerRight.score;
        this._playerLeft.score = status.playerLeft?.score ?? this._playerLeft.score;
        this._maxScore = status.maxScore ?? this._maxScore;
        this._state = status.state ?? this._state;
        this._lastState = status.lastState ?? this._lastState;
        this._goalFlag = status.goalFlag ?? this._goalFlag;
        this._paddleOffset = status.paddleOffset ?? this._paddleOffset;
    }

    _startPosition() {
        this._paddleLeft.pos.x = this._paddleOffset;
        this._paddleLeft.pos.y = this._canvas.height / 2 - this._paddleLeft.size.y / 2;
        this._paddleRight.pos.x = this._canvas.width - this._paddleOffset - this._paddleRight.size.x;
        this._paddleRight.pos.y = this._canvas.height / 2 - this._paddleRight.size.y / 2;

        const ratio = 0.2;
        this._paddleLeft.size.y = ratio * this._canvas.height;
        this._paddleLeft.moveSpeed = this._canvas.height;
        this._paddleRight.size.y = ratio * this._canvas.height;
        this._paddleRight.moveSpeed = this._canvas.height;

        this._ball.v.setPolar(this._ballInitialSpeed, Math.PI / 8);
        this._ball.pos.x = this._canvas.width / 2;
        this._ball.pos.y = this._canvas.height / 2;
    }

    _update(dt) {
        // Each state has its own update method
        // If no method is found, it skips the update and the state change has to be done manually
        const methodName = `_update${this._state}`;
        const methodInitName = methodName + "Init";
        if (this._lastState !== this._state) {
            this._lastState = this._state;
            if (typeof this[methodInitName] === "function")
                this[methodInitName]();
        }

        if (typeof this[methodName] === "function")
            this[methodName](dt);

    }

    _updatePlaying(dt) {
        if (this._playerLeft.controller)
            this._paddleLeft.move(this._playerLeft.controller.getMove("left", this.getGameStatus()));
        if (this._playerRight.controller)
            this._paddleRight.move(this._playerRight.controller.getMove("right", this.getGameStatus()));

        this._updatePaddle(this._paddleLeft, dt);
        this._updatePaddle(this._paddleRight, dt);
        this._updateBall(this._ball, dt);

        // Check goal
        if (this._ball.pos.x + this._ball.size.x < 0) {
            this._playerRight.score++;
            if (this._onGoal)
                this._onGoal(this);
            this._state = "Goal";
            return;
        }
        if (this._ball.pos.x > this._canvas.width) {
            this._playerLeft.score++;
            if (this._onGoal)
                this._onGoal(this);
            this._state = "Goal";
            return;
        }
    }

    _updateGoalInit() {
        this._goalTimer = performance.now() / 1000; // TODO check if this timer in "client" mode is working properly (not updated in callback)
        this._goalFlag = false;
    }

    _updateGoal(dt) {
        const now = performance.now() / 1000;

        if (now - this._goalTimer > 1) {
            if (this._playerLeft.score >= this._maxScore || this._playerRight.score >= this._maxScore) {
                this._state = "End";
                return;
            }
            this._state = "Playing";
            return;
        }

        if (!this._goalFlag && now - this._goalTimer > 0.5
            && this._playerLeft.score < this._maxScore && this._playerRight.score < this._maxScore
        ) {
            this._startPosition();
            this._goalFlag = true;
        }
        if (this._playerLeft.controller)
            this._paddleLeft.move(this._playerLeft.controller.getMove("left", this.getGameStatus()));
        if (this._playerRight.controller)
            this._paddleRight.move(this._playerRight.controller.getMove("right", this.getGameStatus()));

        this._updatePaddle(this._paddleLeft, dt);
        this._updatePaddle(this._paddleRight, dt);
    }

    _updateEnd(dt) {
        this.stop();
        this._duration = performance.now() / 1000 - this._startTime;
        if (this._onGameEnd)
            this._onGameEnd(this);
    }

    _updateBall(ball, dt) {
        const ignorePaddles = ball.pos.x < this._paddleLeft.pos.x + this._paddleLeft.size.x
            || ball.pos.x + ball.size.x > this._paddleRight.pos.x;

        ball.update(dt);

        // Collision with top and bottom walls
        if (ball.pos.y < 0 || ball.pos.y + ball.size.y > this._canvas.height)
            ball.v.y = ball.pos.y < 0 ? Math.abs(ball.v.y) : -Math.abs(ball.v.y);

        if (ignorePaddles)
            return;

        // Maximum angle the ball can have when moving (80º from the horizontal)
        const angleLimit = this._ballMaxAngle / 180 * Math.PI;
        // Function to calculate normal vector of the paddle based on the y position
        const paddleNormalVector = (y, paddle, isPositiveX) => {
            return new Vector2D(
                isPositiveX ? 1: -1, // X
                (y - paddle.pos.y - paddle.size.y / 2) / (paddle.size.y / 2) * 0.26 // Y
            ).unitary();
        }
        // Check for collision with left paddle
        if (ball.pos.x < this._paddleLeft.pos.x + this._paddleLeft.size.x
            && ball.pos.y + ball.size.y / 2 > this._paddleLeft.pos.y
            && ball.pos.y - ball.size.y / 2 < this._paddleLeft.pos.y + this._paddleLeft.size.y
        ) {
            const N = paddleNormalVector(ball.pos.y + ball.size.y / 2, this._paddleLeft, true);
            const V = reflectVector(ball.v, N);
            if (V.x < 0 || Math.abs(V.y / V.x) > Math.tan(angleLimit))
            {
                const mod = V.module();
                V.x = Math.cos(angleLimit) * mod;
                V.y = Math.sin(angleLimit) * mod * (V.y > 0 ? 1 : -1);
            }
            ball.v = V;
            ball.pos.x = this._paddleLeft.pos.x + this._paddleLeft.size.x;
            ball.increaseSpeed(this._ballSpeedIncrease);
        }

        // Check for collision with right paddle
        if (ball.pos.x + ball.size.x > this._paddleRight.pos.x
            && ball.pos.y + ball.size.y / 2 > this._paddleRight.pos.y
            && ball.pos.y - ball.size.y / 2 < this._paddleRight.pos.y + this._paddleRight.size.y
        ) {
            const N = paddleNormalVector(ball.pos.y + ball.size.y / 2, this._paddleRight, false);
            const V = reflectVector(ball.v, N);
            if (V.x > 0 || Math.abs(V.y / V.x) > Math.tan(angleLimit))
            {
                const mod = V.module();
                V.x = -Math.cos(angleLimit) * mod;
                V.y = Math.sin(angleLimit) * mod * (V.y > 0 ? 1 : -1);
            }
            ball.v = V;
            ball.pos.x = this._paddleRight.pos.x - ball.size.x;
            ball.increaseSpeed(this._ballSpeedIncrease);
        }
    }

    _updatePaddle(paddle, dt) {
        paddle.update(dt);

        // Check paddles collision with walls
        if (paddle.pos.y < 0)
            paddle.pos.y = 0;
        else if (paddle.pos.y + paddle.size.y > this._canvas.height)
            paddle.pos.y = this._canvas.height - paddle.size.y;
    }

    _draw() {
        this._ctx.fillStyle = '#111111';
        this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
        this._ball.draw(this._ctx);
        this._paddleLeft.draw(this._ctx);
        this._paddleRight.draw(this._ctx);
    }
}
