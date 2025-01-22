import Path from "/static/js/utils/Path.js";
import createPongGameComponent from "/static/js/components/game.js";

export default async function getView(component, loadCssFunction, data) {
    await loadCssFunction([
        Path.css("main/game.css"),
        Path.css("components/game.css"),
    ]);
    const [game, pong] = createPongGameComponent(data);
    data.onGameEnd = (game) => {
        if (data.onGameEnd)
            data.onGameEnd(game);
    };
    component.appendChild(game);
}