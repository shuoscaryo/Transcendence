import Path from "/static/js/utils/Path.js";
import createPongGameComponent from "/static/js/components/game.js";
import { PongAI, PlayerController, RemoteControllerOutgoing, RemoteControllerIncoming } from "/static/js/utils/Controller.js";
import { navigate } from '/static/js/utils/router.js';
import WebSocketService from '/static/js/utils/WebSocketService.js';
import ViewScope from '/static/js/utils/ViewScope.js';
import getDefaultButton from "/static/js/components/defaultButton.js";
import newElement from "/static/js/utils/newElement.js";

const OnlineStates = {
  INIT: "Init",
  FIND_MATCH: "FindMatch",
  WAIT_START: "WaitStart",
  GAME: "Game",
  GAME_OVER: "GameOver",
};

class OnlineState {
    constructor(component, data) {
        this.component = component;
        this.data = data;
        this.state = null;
        this.cleanupFns = [];
        this.pong = null;
        this.statusMessage = null;
        ViewScope.onDestroy(() => this._cleanup());

        // Global WebSocket callbacks
        WebSocketService.addCallback("match_found", (msg) => this._onMatchFound(msg));
        WebSocketService.addCallback("start_game", (msg) => this._onStartGame(msg));
        WebSocketService.addCallback("game_over", (msg) => this._onGameOver(msg));
        WebSocketService.addCallback("pause_game", () => this._onPauseGame());

        // onDestroy call disconnect if in game or waiting,
        // or cancel find_match if in find_match
        ViewScope.onDestroy(() => {
            if (this.state === OnlineStates.WAIT_START || this.state === OnlineStates.GAME)
                WebSocketService.send("disconnected");
            else if (this.state === OnlineStates.FIND_MATCH)
                WebSocketService.send("stop_find_match");
        });

        this.go(OnlineStates.WAIT_START);
    }

    go(stateName, { clearHtml = true } = {}) {
        this._cleanup();
        this.state = stateName;
        if (clearHtml)
            this.component.innerHTML = "";
        const method = this[`_state${stateName}`];
        if (typeof method === "function")
            method.call(this);
        else
            console.warn(`Unknown state: ${stateName}`);
    }

    addCleanup(fn) {
        this.cleanupFns.push(fn);
        return () => { this.cleanupFns = this.cleanupFns.filter(f => f !== fn); };
    }

    _cleanup() {
        this.cleanupFns.forEach(fn => fn());
        this.cleanupFns = [];
    }

    // WebSocket event handlers check current state
    _onMatchFound(msg) {
        if (this.state !== OnlineStates.FIND_MATCH)
            return;

        this.go(OnlineStates.WAIT_START);
    }

    _onStartGame(msg) {
        if (this.state !== OnlineStates.WAIT_START)
            return;
        this.go(OnlineStates.GAME, { clearHtml: false });
    }

    _onGameOver(msg) {
        if (this.state !== OnlineStates.GAME && this.state !== OnlineStates.WAIT_START)
            return;
        this.game_over_msg = msg.reason;
        this.go(OnlineStates.GAME_OVER, {clearHtml: false});
    }

    _onPauseGame() {
        if (this.state !== OnlineStates.GAME)
            return;
        this.pong.stop();
        this.go(OnlineStates.WAIT_START, { clearHtml: false });
    }

    // State methods
    _stateInit() {
        const btnDiv = newElement("div", { parent: this.component, id: "play-container" });
        newElement("img", { parent: btnDiv, id: "arrow-img", src: Path.img("play_arrows.png") });
        const playBtn = getDefaultButton({
            bgColor: 'var(--color-lime)', content: 'Play',
            onClick: () => {
                WebSocketService.send("find_match");
                this.go(OnlineStates.FIND_MATCH);
            }
        });
        btnDiv.append(playBtn);
    }

    _stateFindMatch() {
        // Counter
        const counter = newElement("p", {
            parent: this.component,
            textContent: "0s",
            style: "text-align:center;"
        });
        let seconds = 0;
        const interval = setInterval(
            () => {counter.textContent = `${++seconds}s`;},
            1000
        );
        this.addCleanup(() => clearInterval(interval));

        // Cancel button
        const cancelBtn = getDefaultButton({
            bgColor: 'var(--color-lime)', content: 'Cancel',
            onClick: () => {
                WebSocketService.send("stop_find_match");
                this.go(OnlineStates.INIT);
            }
        });
        this.component.append(cancelBtn);
    }

    async _stateWaitStart() {
        // fetch game state
        const res = await ViewScope.request('GET', Path.API.GET_GAME_STATE);
        if (!res || res.status !== 200)
        {
            console.warn("Couldn't fetch game state");
            navigate("/");
            return;
        }
        if (res.data.in_game !== true) {
            this.go(OnlineStates.INIT);
            return;
        }

        if (!this.pong) {
            // setup players and controllers
            this.data.playerLeft = {
                name: res.data.player_left.display_name,
                uid: res.data.player_left.uid,
                score: res.data.game_state.playerLeft?.score ?? 0,
            };
            this.data.playerRight = {
                name: res.data.player_right.display_name,
                uid: res.data.player_right.uid,
                score: res.data.game_state.playerRight?.score ?? 0,
            };
            this.data.type = res.data.role;
            if (res.data.role === 'host') {
                this.data.playerLeft.controller = new PlayerController("w","s");
                this.data.playerRight.controller = new RemoteControllerIncoming();
                this.data.onGameEnd = (game) => {
                    sendMatchResult('online', game);
                    WebSocketService.send("game_over");
                };
            } else if (res.data.role === 'client') {
                this.data.playerLeft.controller = null;
                this.data.playerRight.controller = new RemoteControllerOutgoing("w","s");
            } else
                console.error(`Unknown role: ${res.data.role}`);
            // create pong
            const [pongComponent, pong] = createPongGameComponent(this.data);
            ViewScope.onDestroy(() => { pong.stop(); });
            this.statusMessage = newElement("p", { parent: this.component, style: "text-align:center;" });
            this.component.append(pongComponent);
            this.pong = pong;
        }

        // merge game_state (we lose controllers but have already been used)
        this.data = { ...this.data, ...res.data.game_state };
        this.data.playerLeft = res.data.player_left.display_name;
        this.data.playerRight = res.data.player_right.display_name;
        // update pong
        this.pong.setGameStatus(this.data);
        this.pong._draw();

        // status message
            
        this.statusMessage.textContent = "Game ends in 10...";
        let sec = 10;
        const interval = setInterval(() => {
            if (--sec > 0)
                this.statusMessage.textContent = `Game ends in ${sec}...`;
            else {
                clearInterval(interval);
                cancelCleanup();
                this.statusMessage.textContent = '';
            }
        }, 1000);
        const cancelCleanup = this.addCleanup(() => clearInterval(interval));

        // send ready
        WebSocketService.send("ready");
    }

    _stateGame() {
        this.statusMessage.textContent = "Game starting in 3...";
        let sec = 3;
        const interval = setInterval(() => {
            if (--sec > 0)
                this.statusMessage.textContent = `Game starting in ${sec}...`;
            else {
                clearInterval(interval);
                cancelCleanup();
                this.statusMessage.textContent = '';
                this.pong.start();
            }
        }, 1000);
        const cancelCleanup = this.addCleanup(() => clearInterval(interval));
    }

    _stateGameOver() {
        const text = this.game_over_msg === 'no_players' ? 'Game cancelled' : 'Game over';
        this.statusMessage.textContent = text;
        this.pong.stop();
        this.pong = null;
    }
}


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
        ViewScope.onMount(() => {
		    const onlineState = new OnlineState(component, data);
        });
	}

    return { status: 200, component, css};
}