import Path from "/static/js/utils/Path.js";
import createPongGameComponent from "/static/js/components/game.js";
import { PongAI, PlayerController, RemoteControllerOutgoing, RemoteControllerIncoming } from "/static/js/utils/Controller.js";
import { navigate } from '/static/js/utils/router.js';

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
        const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        const gameSocket = new WebSocket(protocol + window.location.host + "/ws/game/");

        let playerRole = null;
        let gameStarted = false;

        component.innerHTML = "<p>Esperando al segundo jugador...</p>";

        gameSocket.onmessage = function(event) {
            const message = JSON.parse(event.data);
            console.log("Mensaje recibido:", message);

            if (message.initial_status) {
                playerRole = message.initial_status;
                console.log(`Soy el jugador: ${playerRole}, conectados: ${message.players_connected}`);
            }

            if (message.start && !gameStarted) {
                if (!playerRole) {
                    console.error("Error: No se recibió initial_status antes de start");
                    return;
                }
                console.log(message.message);
                gameStarted = true;

                if (playerRole === 'first') {
                    data.playerLeft = {
                        name: 'me',
                        controller: new RemoteControllerOutgoing(gameSocket, "w", "s"),
                    };
                    data.playerRight = {
                        name: 'friend',
                        controller: new RemoteControllerIncoming(gameSocket),
                    };
                } else if (playerRole === 'second') {
                    data.playerLeft = {
                        name: 'friend',
                        controller: new RemoteControllerIncoming(gameSocket),
                    };
                    data.playerRight = {
                        name: 'me',
                        controller: new RemoteControllerOutgoing(gameSocket, "w", "s"),
                    };
                }

                const [game, pong] = createPongGameComponent(data);
                gameComponent = game;
                pongInstance = pong;
                component.innerHTML = "";
                component.append(gameComponent);
                console.log("¡Juego iniciado!");
            }

            if (message.waiting) {
                console.log(message.message);
                gameStarted = false;
                if (pongInstance) {
                    pongInstance.stop();
                }
                delete data.playerLeft;
                delete data.playerRight;
                component.innerHTML = "<p>Esperando al segundo jugador...</p>";
            }

            if (message.move && gameStarted) {
                console.log(`Movimiento recibido: ${message.move}`);
            }
        };

        gameSocket.onopen = function() {
            console.log("Conexión WebSocket establecida");
            playerRole = null; // Reiniciar el rol al abrir la conexión
        };

        gameSocket.onerror = function(error) {
            console.error("Error en WebSocket:", error);
        };

        gameSocket.onclose = function() {
            console.log("Conexión WebSocket cerrada");
            if (pongInstance) {
                pongInstance.stop();
            }
            component.innerHTML = "<p>Conexión perdida. Por favor, recarga la página.</p>";
        };
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