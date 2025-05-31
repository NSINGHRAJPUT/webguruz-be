# WebGuruz Backend

## Socket.IO Implementation for User Session Management

This application uses Socket.IO to handle immediate user logout when an admin changes a user's status.

## Testing Socket.IO Connection

To test the Socket.IO connection:

1. Start the server:
   ```
   npm start
   ```

2. Open the test page in your browser:
   ```
   http://localhost:5000/socket-test.html
   ```

3. Click "Connect" to establish a Socket.IO connection
4. Enter a user ID and click "Authenticate" to join that user's room
5. Use the test page to monitor events in real-time

## Client-Side Integration

### Basic Integration

Include the Socket.IO client in your frontend application:

```html
<script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
```

Connect to the Socket.IO server:

```javascript
const socket = io();

// After user logs in and you have the JWT
const userId = getUserIdFromJWT(); // Extract user ID from JWT
socket.emit('authenticate', userId);

// Listen for force-logout events
socket.on('force-logout', (data) => {
  console.log(data.message);
  localStorage.removeItem('token'); // Clear token
  window.location.href = '/login'; // Redirect to login
});
```

### Advanced Integration

For a more robust implementation, use the provided `SocketManager` class:

```javascript
// Import the SocketManager class
import { SocketManager } from './socket-client-example.js';

// Create and initialize socket manager
const socketManager = new SocketManager();
socketManager.connect();

// Add event listeners
socketManager.on('force-logout', (data) => {
  console.log('Custom force logout handler:', data);
  // Show a message to the user
  alert('Your session has been terminated by an administrator.');
});

// Authenticate after login
function onLoginSuccess(userData) {
  socketManager.authenticate(userData.id);
}
```

## Troubleshooting

If you're not receiving Socket.IO events:

1. Check browser console for connection errors
2. Verify that the client is connecting to the correct server URL
3. Ensure the user ID used for authentication matches the one in the database
4. Check server logs for connection and room join messages
5. Use the socket-test.html page to verify server connectivity

## How It Works

1. **Token Versioning**: Each user has a `tokenVersion` field that increments when their status changes.
2. **JWT Authentication**: The JWT token includes the user's `tokenVersion`, which is verified on each request.
3. **Real-time Logout**: When an admin changes a user's status, Socket.IO emits a `force-logout` event to that specific user.
4. **Room-Based Targeting**: Each authenticated user joins a room with their user ID, allowing targeted notifications.