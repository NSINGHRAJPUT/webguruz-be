const express = require('express');
const {  getTasks, bulkUpdateTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/', protect, getTasks);
router.patch('/bulk', protect, bulkUpdateTasks);

module.exports = router;  