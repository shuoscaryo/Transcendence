import Path from "/static/js/utils/Path.js";
import PongGame from "/static/js/utils/PongGame.js";
import Storage from "/static/js/utils/Storage.js";
import gameComponent from "/static/js/components/game.js";

export default async function getView(component, loadCssFunction, data) {
    await loadCssFunction([
    ]);

    component.appendChild(gameComponent(data));
}