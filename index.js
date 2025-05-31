const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const socketMiddleware = require('./middleware/socketMiddleware');

dotenv.config();
const app = express();
const server = http.createServer(app); 
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling']
});

// Make io accessible to our controllers
app.set('io', io);
app.use(socketMiddleware(io));

app.use(cors());
app.use(express.json()); 

// Serve static files from the public directory
app.use(express.static('public'));

// Routes
app.use('/api/users', userRoutes); 
app.use('/api/tasks', taskRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
  // Store user ID when they authenticate
  socket.on('authenticate', (userId) => {
    console.log(`User ${userId} authenticated with socket ${socket.id}`);
    socket.join(userId);
    
    // Send confirmation to client
    socket.emit('authenticated', { 
      success: true, 
      message: 'Socket authenticated successfully' 
    });
  });
  
  // Test event for debugging
  socket.on('test', (data) => {
    console.log('Test event received:', data);
    socket.emit('test-response', { 
      received: data, 
      message: 'Test response from server' 
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT, () => 
      {
        console.log(`Server running on port ${process.env.PORT}`)
      }
    );
  })
  .catch(err => console.log(err));