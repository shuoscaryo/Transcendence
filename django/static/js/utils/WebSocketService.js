// /static/js/utils/WebSocketService.js
class WebSocketService {
    constructor() {
        this.ws = null;
        this.pageListeners = new Map(); // Listeners for page-level events
        this.viewListeners = new Map(); // Listeners for view-level events
        this.connect();
    }

    connect() {
		const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        this.ws = new WebSocket(protocol + window.location.host + "/ws/game/");
        this.ws.onopen = () => console.log('WebSocket connected');
        this.ws.onmessage = (event) => this.handleMessage(event.data);
        this.ws.onclose = () => this.handleClose();
        this.ws.onerror = (error) => console.error('WebSocket error:', error);
    }

    handleMessage(data) {
        const message = JSON.parse(data);
        // Notify page listeners
        const pageCallbacks = this.pageListeners.get(message.type) || [];
        pageCallbacks.forEach(callback => callback(message));
        // Notify view listeners
        const viewCallbacks = this.viewListeners.get(message.type) || [];
        viewCallbacks.forEach(callback => callback(message));
    }

    handleClose() {
        console.log('WebSocket disconnected, reconnecting...');
        setTimeout(() => this.connect(), 1000); // Simple reconnection logic
    }

    // Subscribe to a message type at page level
    onPage(type, callback) {
        if (!this.pageListeners.has(type)) {
            this.pageListeners.set(type, []);
        }
        this.pageListeners.get(type).push(callback);
        return () => this.offPage(type, callback); // Return unsubscribe function
    }

    // Subscribe to a message type at view level
    onView(type, callback) {
        if (!this.viewListeners.has(type)) {
            this.viewListeners.set(type, []);
        }
        this.viewListeners.get(type).push(callback);
        return () => this.offView(type, callback); // Return unsubscribe function
    }

    // Unsubscribe from a message type at page level
    offPage(type, callback) {
        const callbacks = this.pageListeners.get(type) || [];
        this.pageListeners.set(type, callbacks.filter(cb => cb !== callback));
    }

    // Unsubscribe from a message type at view level
    offView(type, callback) {
        const viewCallbacks = this.viewListeners.get(type) || [];
        this.viewListeners.set(type, viewCallbacks.filter(cb => cb !== callback));
    }

    // Clear all page-level listeners
    clearPageListeners() {
        this.pageListeners.clear();
    }

    // Clear all view-level listeners
    clearViewListeners() {
        this.viewListeners.clear();
    }

    // Send a message
    send(type, data = {}) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, ...data }));
        } else {
            console.warn('WebSocket not open, message dropped:', { type, ...data });
        }
    }
}

export default new WebSocketService(); // Singleton instance