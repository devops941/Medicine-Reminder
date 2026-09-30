const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  time: { type: String, required: true },
  user: { type: String, default: 'default_user' },
  history: [{
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['taken', 'skipped'], default: 'taken' }
  }]
});

module.exports = mongoose.model('Medicine', MedicineSchema);
