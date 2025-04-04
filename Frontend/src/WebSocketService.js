class WebSocketService {
    static instance = null;

    callbacks = {};
    isConnecting = false;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectDelay = 500;

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
        // Prevent multiple connection attempts
        if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
            if (onOpenCallback) onOpenCallback();
            return;
        }

        this.isConnecting = true;

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;

            // More robust URL handling
            let wsUrl;
            if (backendUrl) {
                if (backendUrl.startsWith('https://')) {
                    wsUrl = backendUrl.replace('https://', 'wss://');
                } else if (backendUrl.startsWith('http://')) {
                    wsUrl = backendUrl.replace('http://', 'ws://');
                } else {
                    wsUrl = `ws://${backendUrl}`;
                }
            } else {
                // Fallback to localhost if VITE_BACKEND_URL is not defined
                wsUrl = 'ws://localhost:5000';
            }

            console.log('Connecting to WebSocket:', wsUrl);
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log('WebSocket connected successfully');
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                if (onOpenCallback) {
                    onOpenCallback();
                }
            };

            this.socket.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.socket.onclose = (event) => {
                this.isConnecting = false;
                console.log(`WebSocket closed: ${event.code} - ${event.reason}`);

                // Only attempt reconnect if not a normal closure
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

                    // Exponential backoff for reconnection
                    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
                    setTimeout(() => this.connect(), delay);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                // Don't do anything here - let the onclose handle reconnection
            };
        } catch (err) {
            this.isConnecting = false;
            console.error('Failed to create WebSocket connection:', err);
        }
    }

    disconnect() {
        if (this.socket) {
            // Prevent automatic reconnection when explicitly disconnecting
            this.reconnectAttempts = this.maxReconnectAttempts;
            try {
                // Only close if the connection is open
                if (this.socket.readyState === WebSocket.OPEN) {
                    this.socket.close(1000, 'Normal closure');
                }
            } catch (err) {
                console.error('Error closing WebSocket:', err);
            }
            this.socket = null;
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

    // Check if currently connected
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    // Send a message safely
    send(message) {
        if (this.isConnected()) {
            try {
                this.socket.send(typeof message === 'string' ? message : JSON.stringify(message));
                return true;
            } catch (err) {
                console.error('Error sending WebSocket message:', err);
                return false;
            }
        }
        return false;
    }
}

export default WebSocketService.getInstance();