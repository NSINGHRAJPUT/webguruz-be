const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  ); 
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });
  res.status(201).json({ token: generateToken(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
    console.log('Login attempt for email:', email);

  const user = await User.findOne({ email });
  console.log('User found:', user ? 'Yes' : 'No');
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    console.log('Login failed - Invalid credentials');
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.status === 'inactive') {
    console.log('Login failed - Account inactive');
    return res.status(403).json({ message: 'Account is inactive' });
  }
  
  // Convert user document to object and remove password
  const userObject = user.toObject();
  delete userObject.password;
  
  console.log('Login successful for user:', userObject.name);
  res.json({ 
    token: generateToken(user),
    user: userObject
  });
};

exports.listUsers = async (req, res) => {
  // Parse pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Parse filter parameters
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Execute query with pagination
  const users = await User.find(filter, '-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  // Get total count for pagination
  const total = await User.countDocuments(filter);
  
  // Return paginated results with metadata
  res.json({
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
};

exports.updateStatus = async (req, res) => {
  try {
    let { id, status } = req.body;
    
    // If status is split into characters, join them back
    if (typeof status === 'undefined' && Object.keys(req.body).some(key => !isNaN(key))) {
      status = Object.keys(req.body)
        .filter(key => !isNaN(key))
        .sort((a,b) => a-b)
        .map(key => req.body[key])
        .join('');
    }

    const userId = id; // Use id from request body

    console.log("Parsed request:", {
      userId,
      status
    });

    // Validate status value
    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Update user status and increment token version to invalidate current tokens
    user.status = status;
    user.tokenVersion += 1;
    await user.save();
    
    // Use the Socket.IO instance from middleware
    // Emit a 'force-logout' event to the specific user
    console.log(`Attempting to emit force-logout to user ${userId.toString()}`);
    
    // Get all connected socket clients
    const connectedSockets = req.io.sockets.adapter.rooms.get(userId.toString());
    console.log(`Connected sockets for user ${userId.toString()}:`, connectedSockets ? [...connectedSockets] : 'none');
    
    // Emit to specific user room
    req.io.to(userId.toString()).emit('force-logout', { 
      message: 'Your account status has been changed by an administrator. Please log in again.',
      userId: userId.toString(),
      timestamp: new Date().toISOString()
    });
    
  
    // // Also broadcast to all clients (for testing)
    // req.io.emit('force-logout', {
    //   type: 'status-change',
    //   userId: userId.toString(),
    //   status: status,
    //   message: `User ${userId} status changed to ${status}`
    // });
    // Only broadcast to all clients when status is inactive
    if (status === 'inactive') {
      req.io.emit('force-logout', {
        type: 'status-change',
        userId: userId.toString(),
        status: status,
        message: `User ${userId} status changed to ${status}`
      });
    }
    
    res.json({ message: 'User status updated' });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
};
