/**
 * Socket.IO Client Integration Example
 * 
 * This file demonstrates how to integrate Socket.IO with your frontend application
 * to handle real-time events like force logout when user status changes.
 */

class SocketManager {
  constructor(serverUrl = null) {
    this.socket = null;
    this.userId = null;
    this.serverUrl = serverUrl;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = {};
  }

  /**
   * Initialize the socket connection
   */
  connect() {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    // Connect to the Socket.IO server
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000
    });

    // Set up connection event handlers
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Re-authenticate if we have a user ID
      if (this.userId) {
        this.authenticate(this.userId);
      }
      
      // Trigger any connect listeners
      this._triggerListeners('connect', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.isAuthenticated = false;
      
      // Trigger any disconnect listeners
      this._triggerListeners('disconnect', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.socket.disconnect();
      }
      
      // Trigger any error listeners
      this._triggerListeners('error', { error: error.message });
    });

    // Set up custom event handlers
    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
      this.isAuthenticated = true;
      this._triggerListeners('authenticated', data);
    });

    this.socket.on('force-logout', (data) => {
      console.log('Force logout received:', data);
      this._triggerListeners('force-logout', data);
      
      // Default behavior: clear token and redirect
      this._handleForceLogout(data);
    });

    this.socket.on('admin-notification', (data) => {
      console.log('Admin notification received:', data);
      this._triggerListeners('admin-notification', data);
    });
  }

  /**
   * Authenticate the socket connection with a user ID
   */
  authenticate(userId) {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot authenticate: Socket not connected');
      return false;
    }

    this.userId = userId;
    this.socket.emit('authenticate', userId);
    console.log('Authentication request sent for user:', userId);
    return true;
  }

  /**
   * Disconnect the socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isAuthenticated = false;
    }
  }

  /**
   * Add an event listener
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove an event listener
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Trigger event listeners
   */
  _triggerListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Handle force logout (default implementation)
   */
  _handleForceLogout(data) {
    // Clear authentication token
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
    // Remove any cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    // Redirect to login page
    window.location.href = '/login';
  }
}

// Example usage:
/*
// Create and initialize socket manager
const socketManager = new SocketManager();
socketManager.connect();

// Add event listeners
socketManager.on('force-logout', (data) => {
  console.log('Custom force logout handler:', data);
  // Show a message to the user
  alert('Your session has been terminated by an administrator. Please log in again.');
});

// Authenticate after login
function onLoginSuccess(userData) {
  // Extract user ID from JWT or user data
  const userId = userData.id || getUserIdFromJWT();
  socketManager.authenticate(userId);
}

// Get user ID from JWT
function getUserIdFromJWT() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return payload.id;
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
}
*/