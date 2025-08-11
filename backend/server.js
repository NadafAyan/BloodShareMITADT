const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001; // Use a different port than your React app

// --- Middleware ---
// Enable CORS for your React app to make requests.
app.use(cors());
// Parse incoming JSON requests.
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
// This endpoint receives donor data from the React frontend and saves it to the database.
app.post('/api/register', async (req, res) => {
  const { walletAddress, fullName, age, bloodGroup, city, email, phoneNumber, emergencyContact, medicalCondition } = req.body;
  
  // A real-world application would store file uploads on a service like IPFS or S3
  // and store the reference URL in the database.
  
  const insertQuery = `
    INSERT INTO donors (wallet_address, full_name, age, blood_group, city, email, phone_number, emergency_contact, medical_condition, is_approved)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)
    ON CONFLICT (wallet_address) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      age = EXCLUDED.age,
      blood_group = EXCLUDED.blood_group,
      city = EXCLUDED.city,
      email = EXCLUDED.email,
      phone_number = EXCLUDED.phone_number,
      emergency_contact = EXCLUDED.emergency_contact,
      medical_condition = EXCLUDED.medical_condition
    RETURNING *
  `;
  const values = [walletAddress, fullName, age, bloodGroup, city, email, phoneNumber, emergencyContact, medicalCondition];

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
