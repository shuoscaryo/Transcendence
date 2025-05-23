import ViewScope from '/static/js/utils/ViewScope.js';

const DEBUG = false;
function log(...args) {
	if (DEBUG) {
		log(...args);
	}
}

class WebSocketService {
	constructor() {
		this.ws = null;
		this.listeners = new Map();         // Persistent
		this.oneTimeListeners = new Map();  // One-time
		this.specificListeners = new Map(); // Secret callbacks

        // Add specific listeners
        this.specificListeners.set('error', [(msg) => {
			console.error('[WebSocketService] error:', msg?.message);
		}]);
		this.specificListeners.set('ping', [() => {
			this.send('pong');
		}]);

        window.addEventListener('beforeunload', () => this.disconnect());
	}

	connect() {
		if (this.ws) return;

		this.reconnect = true;
		const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
		this.ws = new WebSocket(protocol + window.location.host + "/ws/game/");

		this.ws.onopen = () => log('WSS connected');
		this.ws.onmessage = (event) => this._handleMessage(event.data);

		this.ws.onclose = () => {
			if (!this.reconnect) return;
			log(`[${new Date().toISOString()}] WSS disconnected, reconnecting...`);
			this.ws = null;
			setTimeout(() => this.connect(), 1000);
		};

		this.ws.onerror = (error) => {
			console.error('WebSocket error:', error);
			this.ws = null;
		};
	}

	isConnected() {
		return this.ws && this.ws.readyState === WebSocket.OPEN;
	}

	disconnect() {
		this.reconnect = false;
		if (this.ws) {
            log('WSS disconnecting...');
			this.ws.close();
			this.ws = null;
		}
	}

	_handleMessage(data) {
		const json = JSON.parse(data);
		if (!json.msg_type) {
			console.error('Invalid message:', json);
			return;
		}
		log(`WSS receive: ${json.msg_type}`); //XXX

		(this.specificListeners.get(json.msg_type) || []).forEach(cb => cb(json.data));
		(this.listeners.get(json.msg_type) || []).forEach(cb => cb(json.data));
		(this.oneTimeListeners.get(json.msg_type) || []).forEach(cb => cb(json.data));
		this.oneTimeListeners.delete(json.msg_type);
	}

	addCallback(msg_type, callback, { once = false } = {}) {
        // Check if it's a specific message type
		if (this.specificListeners.has(msg_type))
			throw new Error(`Cannot subscribe to specific message type: ${msg_type}`);
		log(`WSS addCallback: ${msg_type}`); //XXX
	  
		// Add to listeners list (persistent or one-time)
		const target = once ? this.oneTimeListeners : this.listeners;
		if (!target.has(msg_type))
			target.set(msg_type, []);
		target.get(msg_type).push(callback);

		// Return remove function and also add it to auto-removal on view change
		const remover = () => this.rmCallback(msg_type, callback);
		ViewScope.onDestroy(remover);
		return remover;
	}

	// Remove callback
    rmCallback(msg_type, callback) {
		log(`WSS rmCallback: ${msg_type}`); //XXX
        // Delete from listeners
        const list = this.listeners.get(msg_type) || [];
        this.listeners.set(msg_type, list.filter(cb => cb !== callback));
        // Delete from one-time listeners
        const oneTimeList = this.oneTimeListeners.get(msg_type) || [];
        this.oneTimeListeners.set(msg_type, oneTimeList.filter(cb => cb !== callback));
    }

	// Clear everything except `specificListeners`
	clearCallbacks() {
		this.listeners.clear();
		this.oneTimeListeners.clear();
	}

	// Send
	send(msg_type, data = {}) {
		log(`WSS send: ${msg_type}`);
		if (this.isConnected()) {
			this.ws.send(JSON.stringify({ msg_type, ...data }));
		} else {
			console.warn('WebSocket not open, dropped:', { msg_type, ...data });
		}
	}
}


export default new WebSocketService();
