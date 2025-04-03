class WebSocketService {
    static instance = null;

    callbacks = {};

    static getInstance() {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    constructor() {
        this.socket = null;
    }

    connect(onOpenCallback) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL
        const replacedBackendUrl = backendUrl.replace('http', 'ws')
        this.socket = new WebSocket(replacedBackendUrl);

        this.socket.onopen = () => {
            console.log('WebSocket connected');
            if (onOpenCallback) {
                onOpenCallback();
            }
        };

        this.socket.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            setTimeout(() => this.connect(), 1000); // Reconnect
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }

    handleMessage(message) {
        try {
            const messageObj = JSON.parse(message);
            const { type, ...data } = messageObj;

            if (this.callbacks[type]) {
                this.callbacks[type].forEach(callback => callback(data));
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    on(type, callback) {
        if (!this.callbacks[type]) {
            this.callbacks[type] = [];
        }
        this.callbacks[type].push(callback);
    }

    off(type, callback) {
        if (this.callbacks[type]) {
            this.callbacks[type] = this.callbacks[type].filter(cb => cb !== callback);
        }
    }
}

export default WebSocketService.getInstance();