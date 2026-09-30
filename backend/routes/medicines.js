const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');

// Get all medicines
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const medicines = await Medicine.find({ user: userId });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a medicine
router.post('/', async (req, res) => {
  const medicine = new Medicine({
    name: req.body.name,
    dosage: req.body.dosage,
    frequency: req.body.frequency,
    time: req.body.time,
    user: req.body.userId || 'default_user',
  });

  try {
    const newMedicine = await medicine.save();
    res.status(201).json(newMedicine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a medicine
router.put('/:id', async (req, res) => {
  try {
    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        dosage: req.body.dosage,
        frequency: req.body.frequency,
        time: req.body.time,
      },
      { new: true }
    );
    res.json(updatedMedicine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a medicine
router.delete('/:id', async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Medicine deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Log medicine history
router.post('/:id/history', async (req, res) => {
  try {
    const { date, time, status } = req.body;
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    
    // Check if entry already exists
    const existingEntryIndex = medicine.history.findIndex(h => h.date === date && h.time === time);
    
    if (existingEntryIndex > -1) {
      // Update existing entry
      medicine.history[existingEntryIndex].status = status;
    } else {
      // Add new entry
      medicine.history.push({ date, time, status });
    }
    
    await medicine.save();
    res.json(medicine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
