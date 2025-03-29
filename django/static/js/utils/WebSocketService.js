class WebSocketService {
    constructor() {
        this.ws = null;
        this.pageListeners = new Map(); // Listeners for page-level events
        this.viewListeners = new Map(); // Listeners for view-level events
        this.specificListeners = new Map(); // Listeners for specific events
        this.reconnect = false;
        // Predefine internal listeners
        this.specificListeners.set('error', [(message) => {
            console.error('[WebSocketService] got error message:', message.message);
        }]);
        this.specificListeners.set('ping', [(message) => {
            this.send('pong');
        }]);
        // Add listener when page unloads
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }

    connect() {
        console.log('WebSocketService connect'); //XXX
        if (this.ws)
            return;
    
        this.reconnect = true;
        const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        this.ws = new WebSocket(protocol + window.location.host + "/ws/game/");
    
        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };
    
        this.ws.onmessage = (event) => this._handleMessage(event.data);

        this.ws.onclose = () => {
            if (!this.reconnect) return;
            console.log(`[${new Date().toISOString()}] WebSocket disconnected, reconnecting...`);
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
            this.ws.close();
            this.ws = null;
        }
    }

    _handleMessage(data) {
        const jsonData = JSON.parse(data);
        if (!jsonData.msg_type) {
            console.error('Invalid message:', jsonData);
            return;
        }
        const { msg_type, ...msg } = jsonData;
        console.log(`WSS receive: ${msg_type}`); //XXX
        // Notify specific listeners
        const specificCallbacks = this.specificListeners.get(msg_type) || [];
        specificCallbacks.forEach(callback => callback(msg));
        // Notify page listeners
        const pageCallbacks = this.pageListeners.get(msg_type) || [];
        pageCallbacks.forEach(callback => callback(msg));
        // Notify view listeners
        const viewCallbacks = this.viewListeners.get(msg_type) || [];
        viewCallbacks.forEach(callback => callback(msg));
    }

    // general function to add a callback to a listener (not the specificListeners)
    _addCallback(msg_type, callback, listener) {
        if (this.specificListeners.has(msg_type))
            throw new Error(`Cannot subscribe to specific message type: ${msg_type}. Try another name.`);
        if (!listener.has(msg_type)) {
            listener.set(msg_type, []);
        }
        listener.get(msg_type).push(callback);
    }

    // Subscribe to a msg_type at page level
    addPageCallback(msg_type, callback) { // TODO Rename the function to something more descriptive
        console.log(`Adding page callback ${msg_type}`); //XXX
        this._addCallback(msg_type, callback, this.pageListeners);
        return () => this.offPage(msg_type, callback); // Return unsubscribe function
    }
    
    // Subscribe to a msg_type at view level
    addViewCallback(msg_type, callback) { // TODO Rename the function to something more descriptive
        console.log(`Adding view callback ${msg_type}`); //XXX
        this._addCallback(msg_type, callback, this.viewListeners);
        return () => this.offView(msg_type, callback); // Return unsubscribe function
    }

    // Unsubscribe from a msg_type at page level
    offPage(msg_type, callback) { // TODO Rename the function to something more descriptive
        const callbacks = this.pageListeners.get(msg_type) || [];
        this.pageListeners.set(msg_type, callbacks.filter(cb => cb !== callback));
    }

    // Unsubscribe from a msg_type at view level
    offView(msg_type, callback) { // TODO Rename the function to something more descriptive
        const viewCallbacks = this.viewListeners.get(msg_type) || [];
        this.viewListeners.set(msg_type, viewCallbacks.filter(cb => cb !== callback));
    }

    // Clear all page-level listeners
    clearPageListeners() {
        console.log('Clearing page listeners'); //XXX
        this.pageListeners.clear();
    }

    // Clear all view-level listeners
    clearViewListeners() {
        console.log('Clearing view listeners'); //XXX
        this.viewListeners.clear();
    }

    // Send a message
    send(msg_type, data = {}) {
        console.log(`WSS send: ${msg_type}`); //XXX
        if (this.isConnected()) {
            this.ws.send(JSON.stringify({ msg_type, ...data }));
        } else {
            console.warn('WebSocket not open, message dropped:', { msg_type, ...data });
        }
    }
}

export default new WebSocketService(); // Singleton instance