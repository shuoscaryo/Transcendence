import Path from "/static/js/utils/Path.js";
import createPongGameComponent from "/static/js/components/game.js";
import { PongAI, PlayerController, RemoteControllerOutgoing, RemoteControllerIncoming } from "/static/js/utils/Controller.js";
import { navigate } from '/static/js/utils/router.js';
import WebSocketService from '/static/js/utils/WebSocketService.js';

export default async function getView(isLogged, path) {
    const css = [
        Path.css("game/match.css"),
        Path.css("game/match.css"),
        Path.css("components/game.css"),
    ];
    const component = document.createElement("div");

    const data = {
        onContinueButton: () => { navigate("/"); },
        maxScore: 3,
        onGameEnd: (game) => {
            if (game.playerRight.score > game.playerLeft.score)
                addRatonMiltonVideo();
        },
    };

    let gameComponent;
    let pongInstance;

    if (path.subPath === "/AI") {
        data.playerLeft = { name: "Player 1", controller: new PlayerController("w", "s") };
        data.playerRight = { name: "AI", controller: new PongAI() };
        const [game, pong] = createPongGameComponent(data);
        gameComponent = game;
        pongInstance = pong;
    } else if (path.subPath === "/local") {
        data.playerLeft = { name: "Player 1", controller: new PlayerController("w", "s") };
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
		WebSocketService.onView("initial_status", (message) => {
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
		
		WebSocketService.onView("start_game", (message) => {
			if (gameStarted)
				return;
			if (!playerRole) {
				console.error("Error: No se recibió initial_status antes de start");
				return;
			}
			gameStarted = true;

			if (playerRole === 'first') {
				data.playerLeft = {
					name: 'me',
					controller: new RemoteControllerOutgoing("w", "s"),
				};
				data.playerRight = {
					name: 'friend',
					controller: new RemoteControllerIncoming(),
				};
			} else if (playerRole === 'second') {
				data.playerLeft = {
					name: 'friend',
					controller: new RemoteControllerIncoming(),
				};
				data.playerRight = {
					name: 'me',
					controller: new RemoteControllerOutgoing("w", "s"),
				};
			}

			const [game, pong] = createPongGameComponent(data);
			gameComponent = game;
			pongInstance = pong;
			component.innerHTML = "";
			component.append(gameComponent);
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