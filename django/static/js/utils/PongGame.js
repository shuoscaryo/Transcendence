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

    print() {
        console.log(`[${this.x}, ${this.y}]`);
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

    print() {
        console.log(
            `pos: [${this.pos.x}, ${this.pos.y}], 
            v: [${this.v.x}, ${this.v.y}], 
            size: [${this.size.x}, ${this.size.y}]`
        );
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
}

class Player {
    constructor() {
        this.name = null;
        this.score = 0;
        this.controller = null;
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

    constructor(canvas, type = 'offline') { // type: 'offline', 'host', 'client'
        this._canvas = canvas;
        this._ctx = this._canvas.getContext('2d');
        this._ball = new Ball(10);
        this._paddleLeft = new Paddle(10, 100, 200);
        this._paddleRight = new Paddle(10, 100, 200);
        this._playerLeft = new Player();
        this._playerRight = new Player();
        this._ballSpeedIncrease = 0;
        this._ballMaxAngle = 60;
        this._maxScore = 5;
        this._onGameEnd = null;
        this._onGoal = null;
        this._type = type;
        this._state = 'Playing';
        this._paddleOffset = this._paddleLeft.size.x * 2;

        // NOTE Does this break update loop if gets triggered during update?
        if (this._type === 'client')
            WebSocketService.addPageCallback('gameState', (data) => {
                this.setGameStatus(data);
                this._draw();
            });
        
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

    start() {
        if (this._animationFrameId)
            return;
        if (this._state === "End")
            this.reset();
        this._lastTime = null;
        const gameLoop = (timestamp) => {
            if (this._lastTime === null)
                this._lastTime = timestamp;

            const dt = (timestamp - this._lastTime) / 1000;
            this._lastTime = timestamp;

            this._update(dt);
            // If the loop hasn't been stopped, request another frame
            if (this._animationFrameId)
                this._animationFrameId = requestAnimationFrame(gameLoop);
        };

        this._animationFrameId = requestAnimationFrame(gameLoop);
    }

    stop() {
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
        this._state = "Playing";
        this._draw();
    }
    
    getGameStatus() {
        const status = {
            canvas: {
                width: this._canvas.width,
                height: this._canvas.height
            },
            ball: this._ball,
            ballSpeedIncrease: this._ballSpeedIncrease,
            ballMaxAngle: this._ballMaxAngle,
            paddleLeft: this._paddleLeft,
            paddleRight: this._paddleRight,
            playerLeft: this._playerLeft,
            playerRight: this._playerRight,
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
        this._ball = status.ball ?? this._ball;
        this._ballSpeedIncrease = status.ballSpeedIncrease ?? this._ballSpeedIncrease;
        this._ballMaxAngle = status.ballMaxAngle ?? this._ballMaxAngle;
        this._paddleLeft = status.paddleLeft ?? this._paddleLeft;
        this._paddleRight = status.paddleRight ?? this._paddleRight;
        this._playerLeft = status.playerLeft ?? this._playerLeft;
        this._playerRight = status.playerRight ?? this._playerRight;
        this._maxScore = status.maxScore ?? this._maxScore;
        this._state = status.state ?? this._state;
        this._lastState = status.lastState ?? this._lastState;
        this._goalTimer = status.goalTimer ?? this._goalTimer;
        this._goalFlag = status.goalFlag ?? this._goalFlag;
        this._lastTime = status.lastTime ?? this._lastTime;
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

        this._ball.v.setPolar(this._canvas.height, Math.PI / 4);
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

        if (this._type === 'host')
            WebSocketService.send('gameState', JSON.stringify(this.getGameStatus()));

    }

    _updatePlaying(dt) {
        if (this._playerLeft.controller)
            this._paddleLeft.move(this._playerLeft.controller.getMove("left", this.getGameStatus()));
        if (this._playerRight.controller)
            this._paddleRight.move(this._playerRight.controller.getMove("right", this.getGameStatus()));

        this._updatePaddle(this._paddleLeft, dt);
        this._updatePaddle(this._paddleRight, dt);
        this._updateBall(this._ball, dt);
        this._draw();

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
        this._goalTimer = performance.now() / 1000;
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
        this._draw();
    }

    _updateEnd(dt) {
        this.stop();
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
