// models/Camp.js
const mongoose = require('mongoose');

const campSchema = new mongoose.Schema({
  title: { type: String, required: true },
  organizer: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  expectedDonors: { type: Number, required: true },
  contact: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Upcoming', 'Completed'], default: 'Upcoming' },
}, { timestamps: true });

const Camp = mongoose.model('Camp', campSchema);

module.exports = Camp;