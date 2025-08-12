// models/Donor.js
const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  // walletAddress is no longer unique, allowing for multiple test users
  walletAddress: { type: String, required: true },
  fullName: { type: String, required: true },
  age: { type: Number, required: true },
  bloodGroup: { type: String, required: true },
  city: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  medicalCondition: { type: String },
  emergencyAvailability: { type: Boolean, default: false },
  is_approved: { type: Boolean, default: false },
}, { timestamps: true });

const Donor = mongoose.model('Donor', donorSchema);

module.exports = Donor;