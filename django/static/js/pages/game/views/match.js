import Path from "/static/js/utils/Path.js";
import createPongGameComponent from "/static/js/components/game.js";
import { PongAI, PlayerController, RemoteControllerOutgoing, RemoteControllerIncoming } from "/static/js/utils/Controller.js";
import { navigate } from '/static/js/utils/router.js';
import WebSocketService from '/static/js/utils/WebSocketService.js';
import ViewScope from '/static/js/utils/ViewScope.js';
import getDefaultButton from "/static/js/components/defaultButton.js";
import newElement from "/static/js/utils/newElement.js";

async function sendMatchResult(type, game) {
	ViewScope.request("POST", Path.API.ADD_MATCH, {
		body: {
			player_left: game.getPlayerLeft().name,
			player_right: game.getPlayerRight().name,
			match_type: type,
			score_left: game.getPlayerLeft().score,
			score_right: game.getPlayerRight().score,
			duration: game.getDuration(),
		},
		onResolve: (res) => {
			if (res.status !== 200)
				console.error(`Error: ${res.data.error}`);
		},
	});
}

function waitingMatchView(component, data) {
	component.innerHTML = "";

	const rmCallback = WebSocketService.addCallback("match_found",
		(msg) => {
			const gameData = data;
			console.log(msg);
			if (msg.player_role === 'first') {
				gameData.playerLeft = {
					name: msg.player_left,
					controller: new PlayerController("w", "s"),
				};
				gameData.playerRight = {
					name: msg.player_right,
					controller: new RemoteControllerIncoming(),
				};
				gameData.onGameEnd = (game) => {sendMatchResult("online", game);};
				gameData.type = 'host';
			} else if (msg.player_role === 'second') {
				gameData.playerLeft = {
					name: msg.player_left,
					controller: null,
				};
				gameData.playerRight = {
					name: msg.player_right,
					controller: new RemoteControllerOutgoing("w", "s"),
				};
				gameData.type = 'client';
			}
			else {
				console.error(`Error: player_role not valid (${msg.player_role})`);
				onlinePlayView(component, data);
			}
			component.innerHTML = "";
			const [game, pong] = createPongGameComponent(gameData);
			ViewScope.onDestroy(() => { pong.stop(); });
			component.append(game);
		},
		{ once: true }
	);

	const playButton = getDefaultButton({
		bgColor: 'var(--color-lime)',
		content: 'Cancel',
		onClick: () => {
			rmCallback();
			WebSocketService.send("stop_find_match");
			onlinePlayView(component, data);
		}
	});
	component.append(playButton);
}

function onlinePlayView(component, data) {
	component.innerHTML = "";

	const buttonDiv = newElement("div", {parent: component, id: "play-container"});
	newElement("img", {parent: buttonDiv, id: "arrow-img", src: Path.img("play_arrows.png")});
	const playButton = getDefaultButton({
		bgColor: 'var(--color-lime)',
		content: 'Play',
		onClick: () => {
			WebSocketService.send("find_match");
			waitingMatchView(component, data);
		}
	});
	buttonDiv.append(playButton);
}

export default async function getView(isLogged, path) {
	if (path.subPath !== "/AI" && path.subPath !== "/local" && path.subPath !== "/online")
		return { status: 404, error: "Not found" };
	if (path.subPath === "/online" && !isLogged)
		return { status: 300, redirect: "/login" };

    const css = [
        Path.css("game/match.css"),
        Path.css("game/match.css"),
        Path.css("components/game.css"),
    ];
    const component = document.createElement("div");

	// Get the player name if logged in
	let displayName = null;
	if (isLogged) {
		const response = await ViewScope.request("GET", Path.API.PROFILE);
		if (!response)
			return { status: 500, error: "Error fetching profile" };
		if (response.status === 200)
			displayName = response.data.display_name ?? null;
		else
			console.warn(`Error fetching profile: ${response.data.error}`);
	}

	// General game data
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

    if (path.subPath === "/AI") {
        data.playerLeft = { name: displayName ?? "Me", controller: new PlayerController("w", "s") };
        data.playerRight = { name: "AI", controller: new PongAI() };
		data.onGameEnd = (game) => {if (isLogged) sendMatchResult("AI", game);};
        const [game, pong] = createPongGameComponent(data);
        component.append(game);
        ViewScope.onDestroy(() => { pong.stop(); });
    } else if (path.subPath === "/local") {
		data.playerLeft = { name: displayName ?? "Me" , controller: new PlayerController("w", "s") };
        data.playerRight = { name: "Random Chump", controller: new PlayerController("ArrowUp", "ArrowDown") };
		data.onGameEnd = (game) => {if (isLogged) sendMatchResult("local", game);};
        const [game, pong] = createPongGameComponent(data);
        component.append(game);
        ViewScope.onDestroy(() => { pong.stop(); });
    } else if (path.subPath === "/online")
		onlinePlayView(component, data);

    return { status: 200, component, css};
}