const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const [tasks, count] = await Promise.all([
      Task.find().skip(skip).limit(limit),
      Task.countDocuments()
    ]);

    res.json({ tasks, count });
  } catch (err) {
    console.error('Error fetching paginated tasks:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.bulkUpdateTasks = async (req, res) => {
  const updates = req.body;
  const bulkOps = updates.map(update => ({
    updateOne: {
      filter: { _id: update.id },
      update: { status: update.status }
    }
  }));
  await Task.bulkWrite(bulkOps);
  res.json({ message: 'Tasks updated' });
};

