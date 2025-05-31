const Task = require('../models/Task');

exports.getTasks = async (req, res) => { 
  const tasks = await Task.find();
  const count = await Task.countDocuments(); 
  res.json({ tasks, count });
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

