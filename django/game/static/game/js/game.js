// Select the canvas and set up the drawing context
let canvas;  // Dynamically set the canvas
let context;  // The drawing context

//Game already started
let gameStarted = false;

// Define the paddle properties
const paddleWidth = 10, paddleHeight = 100;
let leftPaddleY = 150, rightPaddleY = 150;
const paddleSpeed = 5;

// Define square "ball" properties
let ballX;
let ballY;
let ballSize = 10;  // Size of the square "ball"
let ballSpeedX = 5;  // Ball velocity in X direction
let ballSpeedY = 5;  // Ball velocity in Y direction
const initialBallSpeed = 5;  // Initial ball speed
const ballSpeedIncrement = 0.2;  // How much to increase speed on each paddle hit

// Scoring system variables
let player1Score = 0;  // Left player score
let player2Score = 0;  // Right player score
const winningScore = 5;
let gameOver = false;  // To track if the game is over

// Define variables to track paddle movement
let leftPaddleMovingUp = false;
let leftPaddleMovingDown = false;
let rightPaddleMovingUp = false;
let rightPaddleMovingDown = false;

// Function to draw the paddles, the square ball, the scores, and winner message if game is over
function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas

    // Draw left paddle (Player 1)
    context.fillStyle = "white";
    context.fillRect(10, leftPaddleY, paddleWidth, paddleHeight);

    // Draw right paddle (Player 2)
    context.fillRect(canvas.width - 20, rightPaddleY, paddleWidth, paddleHeight);

    // Draw the square "ball" if the game is not over
    if (!gameOver) {
        context.fillRect(ballX, ballY, ballSize, ballSize);
    }

    // Draw the scores
    context.font = "30px Arial";
    context.fillText(player1Score, canvas.width / 4, 50);  // Player 1 score on the left
    context.fillText(player2Score, (canvas.width / 4) * 3, 50);  // Player 2 score on the right

    // If the game is over, display the winning message
    if (gameOver) {
        let winner = player1Score === winningScore ? player1 : player2;
        context.fillText(winner + " Wins!", canvas.width / 2 - 70, canvas.height / 2);
		if (canvas.id === 'pongTournamentGame') {
			document.getElementById('nextMatchButton').style.display = 'inline';  // Show "Next Match" button after match
		}
    }
}

function normalizeVector(vector) {
	const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
	return {x: vector.x / length, y: vector.y / length};
}

function paddleTiltFunction(h) {
	return (h - paddleHeight/2)/(paddleHeight/2) * 0.26; // max 15 degrees tilt on edges
}

function reflectVector(incident, normal) {
	const dot = incident.x * normal.x + incident.y * normal.y;
	
	// Calcula el vector reflejado usando la fórmula
	return {
	  x: incident.x - 2 * dot * normal.x,
	  y: incident.y - 2 * dot * normal.y
	};
}

// Function to update ball position and check for collisions
function updateBall() {
	ballX += ballSpeedX;
	ballY += ballSpeedY;

	// Check for collision with top or bottom walls
	if (ballY < 0 || ballY + ballSize > canvas.height) {
		ballSpeedY = -ballSpeedY;  // Reverse direction in Y
	}

	// Check for collision with left paddle (Player 1)
	const angleLimit = 10 / 180 * Math.PI;
	if (ballX < 20 && ballY + ballSize > leftPaddleY && ballY < leftPaddleY + paddleHeight) {
		const N = normalizeVector({x: 1, y: paddleTiltFunction(ballY + ballSize/2 - leftPaddleY)})
		const V = reflectVector({x: ballSpeedX, y: ballSpeedY}, N);
		if (V.x < 0 || Math.abs(V.x/V.y) < Math.tan(angleLimit)) // if bounces back or too vertical
		{
			const mod = Math.sqrt(V.x * V.x + V.y * V.y);
			V.x = Math.cos(angleLimit) * mod;
			V.y = Math.sin(angleLimit) * mod * (V.y > 0 ? 1 : -1);
		}
		ballSpeedX = V.x;
		ballSpeedY = V.y;
		ballX = 20;  // Push the ball outside of the paddle
		increaseBallSpeed();  // Increase the ball speed on paddle hit
	}
	// Check for collision with right paddle (Player 2)
	if (ballX > canvas.width - 20 && ballY + ballSize > rightPaddleY && ballY < rightPaddleY + paddleHeight) {
		const N = normalizeVector({x: -1, y: paddleTiltFunction(ballY + ballSize/2 - rightPaddleY)})
		const V = reflectVector({x: ballSpeedX, y: ballSpeedY}, N);
		if (V.x > 0 || Math.abs(V.x/V.y) < Math.tan(angleLimit)) // if bounces back or too vertical
		{
			const mod = Math.sqrt(V.x * V.x + V.y * V.y);
			V.x = - Math.cos(angleLimit) * mod;
			V.y = Math.sin(angleLimit) * mod * (V.y > 0 ? 1 : -1);
		}
		ballSpeedX = V.x;
		ballSpeedY = V.y;
		ballX = canvas.width - 20 - ballSize;  // Push the ball outside of the paddle
		increaseBallSpeed();  // Increase the ball speed on paddle hit
	}

	// Check if the ball goes out of bounds (left or right)
	if (ballX < 0) {
		player2Score++;  // Player 2 scores if the ball goes off the left side
		if (player2Score === winningScore) {
			gameOver = true;  // Player 2 wins
		}
		ballSpeedX = initialBallSpeed;  // Reset ball speed
		if (player2Score % 2 === 0) {
			ballSpeedY = -initialBallSpeed;  // Reverse direction in Y
		}
		else {
			ballSpeedY = initialBallSpeed;  // Reverse direction in Y
		}
		resetParams();  // Reset the ball after a score
	} else if (ballX + ballSize > canvas.width) {
		player1Score++;  // Player 1 scores if the ball goes off the right side
		if (player1Score === winningScore) {
			gameOver = true;  // Player 1 wins
		}
		ballSpeedX = -initialBallSpeed;  // Reset ball speed
		if (player1Score % 2 === 0) {
			ballSpeedY = initialBallSpeed;  // Reverse direction in Y
		}
		else {
			ballSpeedY = -initialBallSpeed;  // Reverse direction in Y
		}
		resetParams();  // Reset the ball after a score
	}
}

// Function to increase the ball speed after a paddle hit
function increaseBallSpeed() {
	let L = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
	ballSpeedX = ballSpeedX / L * (L + ballSpeedIncrement);
	ballSpeedY = ballSpeedY / L * (L + ballSpeedIncrement);
}

// Function to reset the ball to the center
function resetParams() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
	leftPaddleY = 150;
    rightPaddleY = 150;
}

// Function to update paddle positions based on movement
function updatePaddles() {
    if (!gameOver) {
        // Move left paddle (Player 1)
        if (leftPaddleMovingUp && leftPaddleY > 0) {
            leftPaddleY -= paddleSpeed;
        }
        if (leftPaddleMovingDown && leftPaddleY < canvas.height - paddleHeight) {
            leftPaddleY += paddleSpeed;
        }

        // Move right paddle (Player 2)
        if (rightPaddleMovingUp && rightPaddleY > 0) {
            rightPaddleY -= paddleSpeed;
        }
        if (rightPaddleMovingDown && rightPaddleY < canvas.height - paddleHeight) {
            rightPaddleY += paddleSpeed;
        }
    }
}

// Function to handle the game loop
function gameLoop() {
    if (!gameOver && gameStarted) {
		updatePaddles();  // Update paddle positions
        updateBall();     // Update ball position and collisions
        draw();           // Redraw the canvas with updated positions
        requestAnimationFrame(gameLoop);  // Keep the loop running if the game is not over
    }
}

// Event listener for key presses (keydown) to start movement
document.addEventListener('keydown', (event) => {
    if (!gameOver) {
        // Player 1 (left paddle) controls
        if (event.key === 'w') {
            leftPaddleMovingUp = true;
        } else if (event.key === 's') {
            leftPaddleMovingDown = true;
        }

        // Player 2 (right paddle) controls
        if (event.key === 'ArrowUp') {
            rightPaddleMovingUp = true;
        } else if (event.key === 'ArrowDown') {
            rightPaddleMovingDown = true;
        }
    }
});

// Event listener for key releases (keyup) to stop movement
document.addEventListener('keyup', (event) => {
    // Player 1 (left paddle) controls
    if (event.key === 'w') {
        leftPaddleMovingUp = false;
    } else if (event.key === 's') {
        leftPaddleMovingDown = false;
    }

    // Player 2 (right paddle) controls
    if (event.key === 'ArrowUp') {
        rightPaddleMovingUp = false;
    } else if (event.key === 'ArrowDown') {
        rightPaddleMovingDown = false;
    }
});

//Function to restart the game
function resetGame(selectedCanvas) {
	// Set the canvas
	canvas = selectedCanvas;
	// Get the drawing context
	context = canvas.getContext("2d");
    // Reset positions
    leftPaddleY = 150;
    rightPaddleY = 150;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    
    // Reset ball speed and direction
    ballSpeedX = initialBallSpeed;
    ballSpeedY = initialBallSpeed;
    
    // Reset scores
    player1Score = 0;
    player2Score = 0;
    
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset any game state flags
    gameOver = false;
	gameStarted = false;
}


// Function to start the game
function startGame(selectedCanvas) {
	// Set the canvas
	canvas = selectedCanvas;
	// Get the drawing context
	context = canvas.getContext("2d");
	ballX = canvas.width / 2;
	ballY = canvas.height / 2;
    if (gameOver) {
        // Reset scores and the game state
        player1Score = 0;
        player2Score = 0;
        gameOver = false;
        ballSpeedX = 5;  // Reset ball speed
        ballSpeedY = 5;
		leftPaddleY = 150;
   		rightPaddleY = 150;
		gameStarted = false;
    }
	if (!gameStarted) {
		gameStarted = true;
		gameLoop();  // Start the game loop
	}
}
