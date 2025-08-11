const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001; // Use a different port than your React app

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- PostgreSQL Database Configuration ---
const dbClient = new Client({
  user: 'postgres', // Replace with your PostgreSQL user
  host: 'localhost',    // Replace with your database host
  database: 'bloodshareieee', // Replace with your database name
  password: 'root', // Replace with your PostgreSQL password
  port: 5432,
});

async function connectToDb() {
  try {
    await dbClient.connect();
    console.log('Successfully connected to PostgreSQL database!');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}
connectToDb();

// --- API Endpoint for Donor Registration ---
app.post('/api/register', async (req, res) => {
  const { 
    walletAddress, 
    fullName, 
    age, 
    bloodGroup, 
    city, 
    email, 
    phoneNumber, 
    emergencyContact, 
    medicalCondition,
    emergencyAvailability
  } = req.body;
  
  // The INSERT query is simplified to add a new row, as there's no unique
  // constraint on wallet_address for the ON CONFLICT clause to target.
  const insertQuery = `
    INSERT INTO donors (
      wallet_address, full_name, age, blood_group, city, email, phone_number,
      emergency_contact, medical_condition, emergency_availability, is_approved
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE)
    RETURNING *
  `;
  const values = [
    walletAddress, fullName, age, bloodGroup, city, email, phoneNumber,
    emergencyContact, medicalCondition, emergencyAvailability
  ];

  try {
    const result = await dbClient.query(insertQuery, values);
    console.log(`Successfully saved donor to database: ${fullName}`);
    res.status(201).json({ message: "Donor data saved successfully.", donor: result.rows[0] });
  } catch (error) {
    console.error('Error saving data to database:', error);
    res.status(500).json({ error: "Failed to save donor data." });
  }
});

// --- Basic Express Server ---
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
