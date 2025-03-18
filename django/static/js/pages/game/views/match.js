import Path from "/static/js/utils/Path.js";
import createPongGameComponent from "/static/js/components/game.js";
import { PongAI, PlayerController } from "/static/js/utils/Controller.js";
import { navigate } from '/static/js/utils/router.js';

export default async function getView(isLogged, path) {
    const css = [
        Path.css("game/match.css"),
        Path.css("components/game.css"),
    ];
    const component = document.createElement("div");

    const data = {
        playerLeft: {
            name: "Player 1",
            controller: new PlayerController("w", "s"),
        },
        onContinueButton: () => {navigate("/");},
        maxScore: 3,
        onGameEnd: (game) => {
            if (game.playerRight.score > game.playerLeft.score)
                addRatonMiltonVideo();
        },
    };
    if (path.subPath === "/AI") {
        data.playerRight = {
                name: "AI",
                controller: new PongAI(),
        };
    }
    else if (path.subPath === "/local") {
        data.playerRight = {
            name: "Random Chump",
            controller: new PlayerController("ArrowUp", "ArrowDown"),
        };
    }
    else if (path.subPath === "/online") {
        const outgoingSocket = new WebSocket('wss://example.com/pong/outgoing');
        const incomingSocket = new WebSocket('wss://example.com/pong/incoming');
        data.playerLeft = {
            name: 'me',
            controller: new RemoteControllerOutgoing(outgoingSocket, "ArrowUp", "ArrowDown"),
        };
        data.playerRight = {
            name: 'friend',
            controller: new RemoteControllerIncoming(incomingSocket),
        };
    }
    else 
        return {status: 404};
    const [game, pong] = createPongGameComponent(data);
    component.append(game);

    const onDestroy = () => {
        if (pong)
            pong.stop();
    }
    return {status: 200, component, css, onDestroy};
}
