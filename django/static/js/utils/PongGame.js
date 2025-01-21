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

class Object
{
    constructor() {
        this.pos = new Vector2D();
        this.speed = new Vector2D();
        this.size = new Vector2D();
    }

    update(dt) {
        this.pos.x = this.pos.x + this.speed.x * dt;
        this.pos.y = this.pos.y + this.speed.y * dt;
    }

    draw(ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
    }

    print() {
        console.log(
            `pos: [${this.pos.x}, ${this.pos.y}], 
            speed: [${this.speed.x}, ${this.speed.y}], 
            size: [${this.size.x}, ${this.size.y}]`
        );
    }
}

class Paddle extends Object
{
    constructor(width = 10, height = 100, moveSpeed = 200) {
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
        this.speed.y = this.direction * this.moveSpeed;
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

// configurable:
// - playerLeft.controller
// - playerRight.controller
// - playerLeft.name
// - playerRight.name
// - maxScore
// - onGoal
// - onGameEnd
export default class PongGame
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.canvas.pongInstance = this;
        this.ctx = this.canvas.getContext('2d');

        this.ball = new Ball(10);
        this.paddleLeft = new Paddle(10, 100, 200);
        this.paddleRight = new Paddle(10, 100, 200);
        this.playerLeft = new Player();
        this.playerRight = new Player();

        this.maxScore = 5;
        this.onGameEnd = null;
        this.onGoal = null;
        
        this.#startPosition();
        this.#draw();
    }

    destructor() {
        this.stop();
    }

    #startPosition() {
        const distanceFromWall = this.paddleLeft.size.x * 2;
        this.paddleLeft.pos.x = distanceFromWall;
        this.paddleLeft.pos.y = this.canvas.height / 2 - this.paddleLeft.size.y / 2;
        this.paddleRight.pos.x = this.canvas.width - distanceFromWall - this.paddleRight.size.x;
        this.paddleRight.pos.y = this.canvas.height / 2 - this.paddleRight.size.y / 2;

        const ratio = 0.2;
        this.paddleLeft.size.y = ratio * this.canvas.height;
        this.paddleLeft.moveSpeed = this.canvas.height;
        this.paddleRight.size.y = ratio * this.canvas.height;
        this.paddleRight.moveSpeed = this.canvas.height;

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
            this.paddleLeft.move(this.playerLeft.controller.getMove("left", this.getState()));
        if (this.playerRight.controller)
            this.paddleRight.move(this.playerRight.controller.getMove("right", this.getState()));

        this.paddleLeft.update(dt);
        this.paddleRight.update(dt);
        this.ball.update(dt, [this.paddleLeft, this.paddleRight]);
        this.#checkCollisions();
        this.#draw();

        // Check goal
        if (this.ball.pos.x + this.ball.size.x < 0) {
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
        this.goalFlag = false;
    }

    // Don't use outside of #update
    updateGoal(dt) {
        const now = performance.now() / 1000;

        if (now - this.goalTimer > 1) {
            if (this.playerLeft.score >= this.maxScore || this.playerRight.score >= this.maxScore) {
                this.state = "End";
                return;
            }
            this.state = "Playing";
            return;
        }

        if (!this.goalFlag && now - this.goalTimer > 0.5
            && this.playerLeft.score < this.maxScore && this.playerRight.score < this.maxScore
        ) {
            this.#startPosition();
            this.goalFlag = true;
        }
        if (this.playerLeft.controller)
            this.paddleLeft.move(this.playerLeft.controller.getMove("left", this.getState()));
        if (this.playerRight.controller)
            this.paddleRight.move(this.playerRight.controller.getMove("right", this.getState()));
        this.paddleLeft.update(dt);
        this.paddleRight.update(dt);
        this.#checkCollisions();
        this.#draw();
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
        this.ball.draw(this.ctx);
        this.paddleLeft.draw(this.ctx);
        this.paddleRight.draw(this.ctx);
    }

    #checkCollisions()
    {
        // Collision with top and bottom walls
        if (this.ball.pos.y < 0 || this.ball.pos.y + this.ball.size.x > this.canvas.height) {
            this.ball.speed.y = -this.ball.speed.y;
            this.ball.pos.y = this.ball.pos.y < 0 ? 0 : this.canvas.height - this.ball.size.x;
        }

        // Colisión de la pelota con la paleta izquierda
        if (
            this.ball.pos.x < this.paddleLeft.pos.x + this.paddleLeft.size.x &&
            this.ball.pos.y + this.ball.size.x > this.paddleLeft.pos.y &&
            this.ball.pos.y < this.paddleLeft.pos.y + this.paddleLeft.size.y
        ) {
            this.ball.speed.x = -this.ball.speed.x;
            this.ball.pos.x = this.paddleLeft.pos.x + this.paddleLeft.size.x;
        }

        // Colisión de la pelota con la paleta derecha
        if (
            this.ball.pos.x + this.ball.size.x > this.paddleRight.pos.x &&
            this.ball.pos.y + this.ball.size.x > this.paddleRight.pos.y &&
            this.ball.pos.y < this.paddleRight.pos.y + this.paddleRight.size.y
        ) {
            this.ball.speed.x = -this.ball.speed.x; // Rebote en X
            this.ball.pos.x = this.paddleRight.pos.x - this.ball.size.x; // Corregir posición
        }

        // Check paddles collision with walls
        if (this.paddleLeft.pos.y < 0)
            this.paddleLeft.pos.y = 0;
        else if (this.paddleLeft.pos.y + this.paddleLeft.size.y > this.canvas.height)
            this.paddleLeft.pos.y = this.canvas.height - this.paddleLeft.size.y;

        if (this.paddleRight.pos.y < 0)
            this.paddleRight.pos.y = 0;
        else if (this.paddleRight.pos.y + this.paddleRight.size.y > this.canvas.height)
            this.paddleRight.pos.y = this.canvas.height - this.paddleRight.size.y;
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
                size: this.ball.size.x
            },
            leftPaddle: {
                pos: this.paddleLeft.pos,
                speed: this.paddleLeft.speed,
                moveSpeed: this.paddleLeft.moveSpeed,
                height: this.paddleLeft.size.y
            },
            rightPaddle: {
                pos: this.paddleRight.pos,
                speed: this.paddleRight.speed,
                moveSpeed: this.paddleRight.moveSpeed,
                height: this.paddleRight.size.y
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