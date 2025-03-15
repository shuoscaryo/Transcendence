import Path from "/static/js/utils/Path.js";
import createPongGameComponent from "/static/js/components/game.js";
import { PongAI, PlayerController } from "/static/js/utils/Controller.js";
import { navigate } from '/static/js/utils/router.js';
import addMatch from "/static/js/utils/api/addMatch.js";

export default async function getView(isLogged, path) {
    const css = [
        Path.css("main/game.css"),
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
    else 
        return {status: 404};
    const [game, pong] = createPongGameComponent(data);
    component.appendChild(game);

    const onDestroy = () => {
        if (pong)
            pong.stop();
        if (isLogged){
            data = {
                playerLeft: data.playerLeft.name,
                playerRight: data.playerRight.name,
                scoreLeft: game.playerLeft.score,
                scoreRight: game.playerRight.score,
            }
            const response = fetch('/api/add-match', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.status !== 200)
                console.error(response);
        }
    }
    return {status: 200, component, css, onDestroy};
}
