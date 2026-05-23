export class WebSocketClient {
  constructor(url, messageHandler) {
    this.url = url;
    this.ws = null;
    this.messageHandler = messageHandler;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.state = 'disconnected';
    this.messageQueue = [];
  }

  connect() {
    this.state = 'connecting';
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.state = 'connected';
      this.reconnectAttempts = 0;
      console.log('WebSocket connected');
      this.flushQueue();
      // Start heartbeat
      this.heartbeatInterval = setInterval(() => this.send('ping', {}), 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.messageHandler) {
          this.messageHandler(data);
        }
      } catch (e) {
        console.error('Failed to parse message', event.data);
      }
    };

    this.ws.onclose = () => {
      this.state = 'disconnected';
      clearInterval(this.heartbeatInterval);
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  send(action, data) {
    const payload = JSON.stringify({ action, ...data });
    if (this.state === 'connected' && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.messageQueue.push(payload);
    }
  }

  flushQueue() {
    while (this.messageQueue.length > 0 && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(this.messageQueue.shift());
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.state = 'reconnecting';
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnect attempts reached. Please refresh.');
    }
  }
}
