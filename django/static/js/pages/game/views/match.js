import Path from "/static/js/utils/Path.js";
import createPongGameComponent from "/static/js/components/game.js";
import { PongAI, PlayerController, RemoteControllerOutgoing, RemoteControllerIncoming } from "/static/js/utils/Controller.js";
import { navigate } from '/static/js/utils/router.js';
import WebSocketService from '/static/js/utils/WebSocketService.js';
import request from '/static/js/utils/request.js';

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
        const [game, pong] = createPongGameComponent(data);
        gameComponent = game;
        pongInstance = pong;
    } else if (path.subPath === "/local") {
        data.playerLeft = { name: displayName ?? "Me" , controller: new PlayerController("w", "s") };
        data.playerRight = { name: "Random Chump", controller: new PlayerController("ArrowUp", "ArrowDown") };
        const [game, pong] = createPongGameComponent(data);
        gameComponent = game;
        pongInstance = pong;
    } else if (path.subPath === "/online") {
        let playerRole = null;
        let gameStarted = false;

        component.innerHTML = "<p>Esperando al segundo jugador...</p>";

		WebSocketService.send("init");
		WebSocketService.send("get_role");
		WebSocketService.addViewCallback("initial_status", (message) => {
			playerRole = message.initial_status;
			console.log(`Soy el jugador: ${playerRole}, conectados: ${message.players_connected}`);
			gameStarted = false;
		});

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
		
		WebSocketService.addViewCallback("start_game", (message) => {
			if (gameStarted)
				return;
			if (!playerRole) {
				console.error("Error: No se recibió initial_status antes de start");
				return;
			}
			gameStarted = true;
			if (playerRole === 'first') {
				data.playerLeft = {
					name: displayName ?? "Me",
					controller: new PlayerController("w", "s"),
				};
				data.playerRight = {
					name: 'friend',
					controller: new RemoteControllerIncoming(),
				};
				data.type = 'host';
			} else if (playerRole === 'second') {
				data.playerLeft = {
					name: 'friend',
					controller: null,
				};
				data.playerRight = {
					name: 'me',
					controller: new RemoteControllerOutgoing("w", "s"),
				};
				data.type = 'client';
			}
			const [game, pong] = createPongGameComponent(data);
			gameComponent = game;
			pongInstance = pong;
			component.innerHTML = "";
			component.append(gameComponent);
			const tmp = document.createElement("p"); // XXX temporal
			tmp.textContent = data.type; // XXX temporal
			component.append(tmp); // XXX temporal
			
			console.log("¡Juego iniciado!");
		});
		
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