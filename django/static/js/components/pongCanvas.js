
export function getPongCanvas()
{
    const component = document.createElement('canvas');
    component.id = 'pong-canvas';
    
    return component;
}

class PongGame
{
    constructor(canvasid)
    {
        this.canvas = document.getElementById(canvasid);
        this.paddle1 = new Paddle();
        this.paddle2 = new Paddle();
        this.ball = new Ball();
        this.player1_name = null;
        this.player2_name = null;
        this.player1_score = 0;
        this.player2_score = 0;
        this.max_score = 5;
    }

    update()
    {
        this.paddle1.update();
        this.paddle2.update();
        this.ball.update();
        this.#checkColision();
        this.#draw();
    }

    #draw()
    {
    }

    #checkColision()
    {
    }

    setPlayer1Name(name)
    {
        this.player1_name = name;
    }

    setPlayer2Name(name)
    {
        this.player2_name = name;
    }
    
    start()
    {}

    stop()
    {}

    reset()
    {}
}