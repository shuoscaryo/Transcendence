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

function renderOnlineInGame(component, data) {
	console.log(data);
	newElement("p", {
		parent: component,
		textContent: data.room,
	});
	newElement("p2", {
		parent: component,
		textContent: data.player_role,
	});
	const [game, pong] = createPongGameComponent(data);
	ViewScope.onDestroy(() => { pong.stop(); });
	component.append(game);
}

// Used by the onlineStateRender function
function renderOnlineWaiting(component, data) {
	newElement("p", {
		parent: component,
		textContent: "Searching Match...",
		style: "font-size: 1.2em; margin-bottom: 10px; text-align: center;"
	});

	const counter = newElement("p", {
		parent: component,
		textContent: "0s",
		style: "text-align: center; margin-bottom: 15px;"
	});

	ViewScope.onMount(() => {
		try {
			let seconds = 0;
			setInterval(() => {
				seconds += 1;
				counter.textContent = `${seconds}s`;
			}, 1000);
		} catch (error) {
			if (error === ViewScope.VIEW_CHANGED)
				return;
		}
	});

	let unsubscribeStopFindMatch = null;
	ViewScope.onMount(() => {
		WebSocketService.send("find_match");
		// When leaving the page, automatically stop searching for a match
		unsubscribeStopFindMatch = ViewScope.onDestroy(() => {
			WebSocketService.send("stop_find_match");
		});
	});

	WebSocketService.addCallback("match_found",
		(msg) => {
			const gameData = {
				...data,
				playerLeft: {
					name: msg.player_left,
					controller: msg.player_role === 'first'
						? new PlayerController("w", "s")
						: null
				},
				playerRight: {
					name: msg.player_right,
					controller: msg.player_role === 'first'
						? new RemoteControllerIncoming()
						: new RemoteControllerOutgoing("w", "s")
				},
				type: msg.player_role === 'first' ? 'host' : 'client',
				onGameEnd: msg.player_role === 'first' ? (game) => {
					sendMatchResult("online", game);
					WebSocketService.send("match_end");
				}: undefined,
				room: msg.room,
				player_role: msg.player_role,
			};
			// Stop the onDestroy that sends stop_find_match
			if (unsubscribeStopFindMatch)
				unsubscribeStopFindMatch();
			onlineStateRender(component, "InGame", gameData);
		},
		{ once: true }
	);
	
	const playButton = getDefaultButton({
		bgColor: 'var(--color-lime)',
		content: 'Cancel',
		onClick: () => {
			onlineStateRender(component, "Init", data);
		}
	});


	component.append(playButton);
}

// Used by the onlineStateRender function
function renderOnlineInit(component, data) {
	const buttonDiv = newElement("div", {parent: component, id: "play-container"});
	newElement("img", {parent: buttonDiv, id: "arrow-img", src: Path.img("play_arrows.png")});
	const playButton = getDefaultButton({
		bgColor: 'var(--color-lime)',
		content: 'Play',
		onClick: () => {
			onlineStateRender(component, "Waiting", data)
		}
	});
	buttonDiv.append(playButton);
}

function onlineStateRender(component, state, data) {
	component.innerHTML = "";
	ViewScope.destroy();
	const functionName = `renderOnline${state}`;
	if (typeof eval(functionName) === "function") {
		eval(functionName)(component, data);
		ViewScope.mount();
	} else {
		console.error(`No renderer found for state: ${state}`);
	}
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
    } else if (path.subPath === "/online") {
		//const response = await ViewScope.request("GET", Path.API.GAME_STATE);
		//if (!response)
		//	return { status: 500, error: "Error fetching game state" };
		//if (response.status !== 200)
		//	return { status: 500, error: response.data.error };
		//if (!response.data.status)
		//	return { status: 500, error: "Game state not found" };
		//onlineStateRender(component, response.data.status, data);
		onlineStateRender(component, "Init", data);
	}

    return { status: 200, component, css};
}