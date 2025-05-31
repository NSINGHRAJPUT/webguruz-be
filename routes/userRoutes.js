const express = require('express');
const { register, login, listUsers, updateStatus } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
// GET /api/users - Get paginated users list
// Query params: page, limit, status, role, search
router.get('/', protect, listUsers);
router.put('/status', protect, updateStatus);
 
module.exports = router; 