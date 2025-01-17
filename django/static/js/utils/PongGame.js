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
    getMagnitude() {
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
    getUnitaryVector() {
        const magnitude = this.getMagnitude();
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

class movingObject
{
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.pos = new Vector2D();
        this.speed = new Vector2D();
    }

    update(dt) {
        this.pos.x = this.pos.x + this.speed.x * dt;
        this.pos.y = this.pos.y + this.speed.y * dt;
    }

    draw() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.pos.x, this.pos.y, 1, 1);
    }

    print() {
        console.log(`pos: [${this.pos.x}, ${this.pos.y}], speed: [${this.speed.x}, ${this.speed.y}]`);
    }
}

class Ball extends movingObject
{
    constructor(canvas) {
        super(canvas);
        this.size = 10;
    }

    draw() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
    }
}

class Paddle extends movingObject
{
    constructor(canvas) {
        super(canvas);
        this.width = 10;
        this.height = 100;
        this.moveSpeed = 200;
    }

    move(direction) { // direction: -1 for up, 1 for down, 0 for stop
        this.speed.y = Math.sign(direction) * this.moveSpeed;
    }

    draw() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
    }
}

class Player {
    constructor() {
        this.name = null;
        this.score = 0;
        this.controller = null;
    }
}

export default class PongGame
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');

        this.ball = new Ball(canvas);
        this.leftPaddle = new Paddle(canvas);
        this.rightPaddle = new Paddle(canvas);

        this.playerLeft = new Player();
        this.playerRight = new Player();
        this.playerLeft.score = 0;
        this.playerRight.score = 0;
        this.maxScore = 1;
        
        this.onGameEnd = null;
        this.onGoal = null;
        
        this.#startPosition();
        this.#draw();
    }

    destructor() {
        this.stop();
    }

    #startPosition() {
        this.leftPaddle.pos.x = 20;
        this.rightPaddle.pos.x = this.canvas.width - 20 - this.rightPaddle.width;
        this.rightPaddle.pos.y = this.canvas.height / 2 - this.rightPaddle.height / 2;
        this.leftPaddle.pos.y = this.canvas.height / 2 - this.leftPaddle.height / 2;

        const ratio = 0.2;
        this.leftPaddle.height = ratio * this.canvas.height;
        this.leftPaddle.moveSpeed = this.canvas.height;
        this.rightPaddle.height = ratio * this.canvas.height;
        this.rightPaddle.moveSpeed = this.canvas.height;

        this.ball.speed.setPolar(this.canvas.height, Math.PI / 4);
        this.ball.pos.x = this.canvas.width / 2;
        this.ball.pos.y = this.canvas.height / 2;
    }

    #update(dt) {
        // Each state has its own update method
        // If no method is found, it skips the update and the state change has to be done manually
        const methodName = `update${this.state}`;
        const methodInitName = methodName + "Init";

        if (this.lastState !== this.state) {
            this.lastState = this.state;
            if (typeof this[methodInitName] === "function")
                this[methodInitName]();
        }

        if (typeof this[methodName] === "function")
            this[methodName](dt);
    }

    // Don't use outside of #update
    updatePlaying(dt) {

        if (this.playerLeft.controller)
            this.leftPaddle.move(this.playerLeft.controller.getMove("left", this.getState()));
        if (this.playerRight.controller)
            this.rightPaddle.move(this.playerRight.controller.getMove("right", this.getState()));

        this.ball.update(dt);
        this.leftPaddle.update(dt);
        this.rightPaddle.update(dt);
        this.#checkCollisions();
        this.#draw();

        // Check goal
        if (this.ball.pos.x + this.ball.size < 0) {
            this.playerRight.score++;
            if (this.onGoal)
                this.onGoal(this);
            this.state = "Goal";
            return;
        }
        if (this.ball.pos.x > this.canvas.width) {
            this.playerLeft.score++;
            if (this.onGoal)
                this.onGoal(this);
            this.state = "Goal";
            return;
        }
    }

    // Don't use outside of #update
    updateGoalInit() {
        this.goalTimer = performance.now() / 1000;
    }

    // Don't use outside of #update
    updateGoal(dt) {
        const now = performance.now() / 1000;

        if (this.playerLeft.controller)
            this.leftPaddle.move(this.playerLeft.controller.getMove("left", this.getState()));
        if (this.playerRight.controller)
            this.rightPaddle.move(this.playerRight.controller.getMove("right", this.getState()));
        this.leftPaddle.update(dt);
        this.rightPaddle.update(dt);
        this.#checkCollisions();
        this.#draw();

        if (now - this.goalTimer > 1) {
            if (this.playerLeft.score >= this.maxScore || this.playerRight.score >= this.maxScore) {
                this.state = "End";
                return;
            }
            this.#startPosition();
            this.state = "Playing";
        }
    }

    // Don't use outside of #update
    updateEnd(dt) {
        this.stop();
        if (this.onGameEnd)
            this.onGameEnd(this);
    }

    #draw()
    {
        this.ctx.fillStyle = '#111111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ball.draw();
        this.leftPaddle.draw();
        this.rightPaddle.draw();
    }

    #checkCollisions()
    {
        if (this.ball.pos.y <= 0 || this.ball.pos.y + this.ball.size >= this.canvas.height) {
            this.ball.speed.y = -this.ball.speed.y;
            this.ball.pos.y = this.ball.pos.y < 0 ? 0 : this.canvas.height - this.ball.size;
        }

        // Colisión de la pelota con la paleta izquierda
        if (
            this.ball.pos.x <= this.leftPaddle.pos.x + this.leftPaddle.width &&
            this.ball.pos.y + this.ball.size >= this.leftPaddle.pos.y &&
            this.ball.pos.y <= this.leftPaddle.pos.y + this.leftPaddle.height
        ) {
            this.ball.speed.x = -this.ball.speed.x; // Rebote en X
            this.ball.pos.x = this.leftPaddle.pos.x + this.leftPaddle.width; // Corregir posición
        }

        // Colisión de la pelota con la paleta derecha
        if (
            this.ball.pos.x + this.ball.size >= this.rightPaddle.pos.x &&
            this.ball.pos.y + this.ball.size >= this.rightPaddle.pos.y &&
            this.ball.pos.y <= this.rightPaddle.pos.y + this.rightPaddle.height
        ) {
            this.ball.speed.x = -this.ball.speed.x; // Rebote en X
            this.ball.pos.x = this.rightPaddle.pos.x - this.ball.size; // Corregir posición
        }

        // Check paddles collision with walls
        if (this.leftPaddle.pos.y <= 0) {
            this.leftPaddle.pos.y = 0;
        } else if (this.leftPaddle.pos.y + this.leftPaddle.height >= this.canvas.height) {
            this.leftPaddle.pos.y = this.canvas.height - this.leftPaddle.height;
        }

        if (this.rightPaddle.pos.y <= 0) {
            this.rightPaddle.pos.y = 0;
        } else if (this.rightPaddle.pos.y + this.rightPaddle.height >= this.canvas.height) {
            this.rightPaddle.pos.y = this.canvas.height - this.rightPaddle.height;
        }
    }

    start()
    {
        if (this.animationFrameId)
            return;
        if (this.state === "End")
            this.reset();
        if (this.state == undefined)
            this.state = "Playing";
        this.lastTime = undefined;
        const gameLoop = (timestamp) => {
            if (!this.lastTime)
                this.lastTime = timestamp;

            const dt = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;

            this.#update(dt);
            // If the loop hasn't been stopped, request another frame
            if (this.animationFrameId)
                this.animationFrameId = requestAnimationFrame(gameLoop);
        };

        this.animationFrameId = requestAnimationFrame(gameLoop);
    }

    stop()
    {
        this.lastTime = undefined;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    reset()
    {
        this.stop();
        this.#startPosition();
        this.playerLeft.score = 0;
        this.playerRight.score = 0;
        this.state = "Playing";
        this.#draw();
    }
    
    getState() {
        return {
            ball: {
                pos: this.ball.pos,
                speed: this.ball.speed,
                size: this.ball.size
            },
            leftPaddle: {
                pos: this.leftPaddle.pos,
                speed: this.leftPaddle.speed,
                moveSpeed: this.leftPaddle.moveSpeed,
                height: this.leftPaddle.height
            },
            rightPaddle: {
                pos: this.rightPaddle.pos,
                speed: this.rightPaddle.speed,
                moveSpeed: this.rightPaddle.moveSpeed,
                height: this.rightPaddle.height
            },
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height,
                paddleOffset: 20
            },
            playerLeft: {
                name: this.playerLeft.name,
                score: this.playerLeft.score
            },
            playerRight: {
                name: this.playerRight.name,
                score: this.playerRight.score
            }
        }
    }
}