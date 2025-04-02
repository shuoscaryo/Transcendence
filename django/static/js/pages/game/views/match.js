import Path from "/static/js/utils/Path.js";
import createPongGameComponent from "/static/js/components/game.js";
import { PongAI, PlayerController, RemoteControllerOutgoing, RemoteControllerIncoming } from "/static/js/utils/Controller.js";
import { navigate } from '/static/js/utils/router.js';
import WebSocketService from '/static/js/utils/WebSocketService.js';
import request from '/static/js/utils/request.js';

async function sendMatchResult(type, game) {
	request("POST", Path.API.ADD_MATCH, {
		player_left: game.getPlayerLeft().name,
		player_right: game.getPlayerRight().name,
		match_type: type,
		score_left: game.getPlayerLeft().score,
		score_right: game.getPlayerRight().score,
		duration: game.getDuration(),
	}).then(response => {
		if (response.status !== 200)
			console.error(`Error: ${response.error}`);
	}).catch(error => {
		console.error(`Request failed: ${error}`);
	});
}

export default async function getView(isLogged, path) {
    const css = [
        Path.css("game/match.css"),
        Path.css("game/match.css"),
        Path.css("components/game.css"),
    ];
    const component = document.createElement("div");

	let displayName = null;
	if (isLogged) {
		const response = await request("GET", Path.API.PROFILE);
		if (response.status === 200)
			displayName = response.data.display_name ?? null;
	}

	const canvasWidth = 800;
	const ballInitialSpeed = canvasWidth / 4;
    const data = {
        onContinueButton: () => { navigate("/"); },
        maxScore: 3,
		ballSpeedIncrease: ballInitialSpeed / 4,
		ballInitialSpeed: ballInitialSpeed,
		canvas: {
			width: canvasWidth,
			height: 600,
		}
    };

    let gameComponent;
    let pongInstance;

    if (path.subPath === "/AI") {
        data.playerLeft = { name: displayName ?? "Me", controller: new PlayerController("w", "s") };
        data.playerRight = { name: "AI", controller: new PongAI() };
		data.onGameEnd = (game) => {if (isLogged) sendMatchResult("AI", game);};
        const [game, pong] = createPongGameComponent(data);
        gameComponent = game;
        pongInstance = pong;
    } else if (path.subPath === "/local") {
        data.playerLeft = { name: displayName ?? "Me" , controller: new PlayerController("w", "s") };
        data.playerRight = { name: "Random Chump", controller: new PlayerController("ArrowUp", "ArrowDown") };
		data.onGameEnd = (game) => {if (isLogged) sendMatchResult("local", game);};
        const [game, pong] = createPongGameComponent(data);
        gameComponent = game;
        pongInstance = pong;
    } else if (path.subPath === "/online") {
        let playerRole = null;
        let gameStarted = false;

        component.innerHTML = "<p>Esperando al segundo jugador...</p>";

		WebSocketService.send("init");
		WebSocketService.send("get_role");
		WebSocketService.addCallback("initial_status", (message) => {
			playerRole = message.initial_status;
			console.log(`Soy el jugador: ${playerRole}, conectados: ${message.players_connected}`);
			gameStarted = false;
		}, { once: true });

		if (!gameStarted) {
			// Mostrar botón "Start"
			component.innerHTML = "";
			const startButton = document.createElement("button");
			startButton.textContent = "Start";
			startButton.onclick = () => {
				WebSocketService.send("player_ready", { ready: true });
				startButton.disabled = true;
				startButton.textContent = "Esperando al otro jugador...";
			};
			component.append(startButton);
		}
		
		WebSocketService.addCallback("start_game", (message) => {
			if (gameStarted)
				return;
			if (!playerRole) {
				console.error("Error: No se recibió initial_status antes de start");
				return;
			}
			gameStarted = true;
			if (playerRole === 'first') {
				data.playerLeft = {
					name: message.player_left,
					controller: new PlayerController("w", "s"),
				};
				data.playerRight = {
					name: message.player_right,
					controller: new RemoteControllerIncoming(),
				};
				data.onGameEnd = (game) => {if (isLogged) sendMatchResult("online", game);};
				data.type = 'host';
			} else if (playerRole === 'second') {
				data.playerLeft = {
					name: message.player_left,
					controller: null,
				};
				data.playerRight = {
					name: message.player_right,
					controller: new RemoteControllerOutgoing("w", "s"),
				};
				data.type = 'client';
			}
			const [game, pong] = createPongGameComponent(data);
			gameComponent = game;
			pongInstance = pong;
			component.innerHTML = "";
			component.append(gameComponent);
			
			console.log("¡Juego iniciado!");
		}, { once: true });
		
    } else {
        return { status: 404 };
    }

    if (gameComponent) {
        component.append(gameComponent);
    }

    const onDestroy = () => {
        if (pongInstance) {
            pongInstance.stop();
        }
    };

    return { status: 200, component, css, onDestroy };
}