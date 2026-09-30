require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your MongoDB connection string if not using local
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/medicine-reminder';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
const medicineRoutes = require('./routes/medicines');
const authRoutes = require('./routes/auth');
app.use('/api/medicines', medicineRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} across the local network`));
