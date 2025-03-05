import Path from "/static/js/utils/Path.js";
import createPongGameComponent from "/static/js/components/game.js";
import { PongAI, PlayerController } from "/static/js/utils/Controller.js";
import { navigate } from '/static/js/utils/router.js';

function addRatonMiltonVideo() {
    const component = document.getElementById('view');
    // ID del video de YouTube
    const videoId = "qS0HlqjQHnk";

    // Crea el iframe del video con autoplay activado
    const iframe = document.createElement("iframe");
    iframe.width = "560"; // Ancho del video
    iframe.height = "315"; // Alto del video
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&showinfo=0&rel=0`; // autoplay agregado aquí
    iframe.title = "YouTube video player";
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.allow = "autoplay"; // Asegura que el autoplay esté permitido en algunos navegadores

    // Limpia el contenido del componente y añade el iframe
    component.appendChild(iframe);
}

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
    }
    return {status: 200, component, css, onDestroy};
}
