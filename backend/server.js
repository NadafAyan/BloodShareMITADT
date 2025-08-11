// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose'); // Import Mongoose

// server.js
// ...
const Donor = require('./models/Donor'); // Import the Donor model
// ...

const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- MongoDB Configuration ---
const MONGODB_URI = 'mongodb://localhost:27017/bloodshareieee'; // Replace with your MongoDB URI

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Successfully connected to MongoDB database!');
}).catch(error => {
  console.error('❌ Error connecting to MongoDB:', error);
});

// --- API Endpoint for Donor Registration ---
// (This part will be updated in the next step)

// server.js
app.post('/api/register', async (req, res) => {
  try {
    // Create a new donor document using the Mongoose model
    const newDonor = await Donor.create({
      walletAddress: req.body.walletAddress,
      fullName: req.body.fullName,
      age: req.body.age,
      bloodGroup: req.body.bloodGroup,
      city: req.body.city,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      emergencyContact: req.body.emergencyContact,
      medicalCondition: req.body.medicalCondition,
      emergencyAvailability: req.body.emergencyAvailability,
      is_approved: false, // Explicitly set to false on registration
    });

    console.log(`✅ Successfully saved donor to MongoDB: ${newDonor.fullName}`);
    res.status(201).json({ message: "Donor data saved successfully.", donor: newDonor });
  } catch (error) {
    console.error('❌ Error saving data to MongoDB:', error);
    res.status(500).json({ error: "Failed to save donor data.", details: error.message });
  }
});

// ...






// --- NEW: Endpoint to get all approved donors ---
app.get('/api/donors/approved', async (req, res) => {
    try {
        const donors = await Donor.find({ is_approved: true });
        res.status(200).json(donors);
    } catch (error) {
        console.error('❌ Error fetching approved donors:', error);
        res.status(500).json({ message: 'Failed to fetch approved donors.' });
    }
});

// --- NEW: Endpoint to get all pending donors (for Admin page) ---
app.get('/api/donors/pending', async (req, res) => {
    try {
        const donors = await Donor.find({ is_approved: false });
        res.status(200).json(donors);
    } catch (error) {
        console.error('❌ Error fetching pending donors:', error);
        res.status(500).json({ message: 'Failed to fetch pending donors.' });
    }
});

// --- NEW: Endpoint to approve a donor ---
app.put('/api/donors/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedDonor = await Donor.findByIdAndUpdate(id, { is_approved: true }, { new: true });
        
        if (!updatedDonor) {
            return res.status(404).json({ message: 'Donor not found.' });
        }
        res.status(200).json({ message: 'Donor approved successfully.', donor: updatedDonor });
    } catch (error) {
        console.error('❌ Error approving donor:', error);
        res.status(500).json({ message: 'Failed to approve donor.' });
    }
});


















// --- Basic Express Server ---
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});