// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const Donor = require('./models/Donor');
const hospitalsData = require('./data.json'); 


// 1. Twilio Imports - USE ENVIRONMENT VARIABLES
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID || "ACb6a3223d0de34fe4c5ddb8bc137bc9cc"; 
const authToken = process.env.TWILIO_AUTH_TOKEN || "d2f043fb9ec6f791351f13b03fac4792"; 
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const twilioClient = new twilio(accountSid, authToken);

// 2. Resend Imports - USE ENVIRONMENT VARIABLES
const { Resend } = require('resend');
const resendApiKey = process.env.RESEND_API_KEY || "re_KeGn1MTf_7N7YUgQJ371M9TmA3HZagJD6";
const resend = new Resend(resendApiKey);

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());

// --- MongoDB Configuration ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodshareieee';

// Helper function to get compatible blood groups
function getCompatibleBloodGroups(requiredBloodGroup) {
    const compatibility = {
        'O-': ['O-'],
        'O+': ['O-', 'O+'],
        'A-': ['O-', 'A-'],
        'A+': ['O-', 'O+', 'A-', 'A+'],
        'B-': ['O-', 'B-'],
        'B+': ['O-', 'O+', 'B-', 'B+'],
        'AB-': ['O-', 'A-', 'B-', 'AB-'],
        'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
    };
    return compatibility[requiredBloodGroup] || [];
}

function formatPhoneForWhatsApp(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('91')) {
        return `whatsapp:+${cleanNumber}`;
    }
    if (cleanNumber.length === 10) {
        return `whatsapp:+91${cleanNumber}`;
    }
    if (cleanNumber.length > 10) {
        return `whatsapp:+${cleanNumber}`;
    }
    throw new Error(`Invalid phone number format: ${phoneNumber}`);
}

// Helper function to create the message body for both email and WhatsApp
const createMessageBody = (data, compatibleGroups, isCompatible) => {
    const urgencyLabels = {
        critical: "CRITICAL (Within 2 hours)",
        urgent: "URGENT (Within 6 hours)",
        moderate: "MODERATE (Within 24 hours)"
    };
    
    const heading = isCompatible 
        ? `EMERGENCY: Blood Needed! Your Blood Group Can Help!`
        : `EMERGENCY: Blood Needed in Your City!`;

    // This is the simplified, updated message body
    const bodyText = `
*BLOOD DONATION ALERT* 🩸

An emergency blood request has been submitted on BloodShare. 

*Patient Name*: ${data.patientName}
*Required Blood Group*: ${data.bloodGroup}
*Units Needed*: ${data.unitsNeeded}
*Urgency Level*: ${urgencyLabels[data.urgencyLevel] || data.urgencyLevel.toUpperCase()}
*Hospital*: ${data.hospital}, ${data.city}

*Contact Person*: ${data.contactPerson}
*Contact Phone*: ${data.phone}

${isCompatible ? `Your blood group can help directly!` : `Compatible blood groups are: ${compatibleGroups.join(', ')}`}

Please contact the person directly if you can help. Thank you! 🙏
    `;

    return { heading, bodyText };
};

// FIXED EMERGENCY ENDPOINT
app.post('/api/emergency', async (req, res) => {
    try {
        console.log('🚨 Emergency request received:', req.body);
        
        const { patientName, contactPerson, phone, bloodGroup, unitsNeeded, hospital, city, urgencyLevel, additionalInfo } = req.body;

        // Validation
        if (!patientName || !contactPerson || !phone || !bloodGroup || !unitsNeeded || !hospital || !city || !urgencyLevel) {
            console.error('❌ Missing required fields');
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.error('❌ Database not connected');
            return res.status(500).json({ message: "Database connection error" });
        }

        // Find approved donors
        const approvedDonors = await Donor.find({ 
            is_approved: true,
            emergencyAvailability: true
        });

        console.log(`📊 Found ${approvedDonors.length} approved donors available for emergency`);

        if (approvedDonors.length === 0) {
            return res.status(404).json({ 
                message: "No approved donors available for emergency notifications." 
            });
        }

        const compatibleBloodGroups = getCompatibleBloodGroups(bloodGroup);
        console.log(`🩸 Compatible blood groups: ${compatibleBloodGroups.join(', ')}`);
        
        let whatsappSuccess = 0;
        let emailSuccess = 0;
        let whatsappFailed = 0;
        let emailFailed = 0;
        
        // Process each donor
        for (const donor of approvedDonors) {
            const isCompatible = compatibleBloodGroups.includes(donor.bloodGroup);
            const { heading, bodyText } = createMessageBody(req.body, compatibleBloodGroups, isCompatible);
            
            // Send WhatsApp message with the old message body
            try {
                const formattedPhone = formatPhoneForWhatsApp(donor.phoneNumber);
                await twilioClient.messages.create({
                    from: twilioPhoneNumber,
                    to: formattedPhone,
                    body: bodyText.trim()
                });
                console.log(`✅ WhatsApp sent to ${donor.fullName} (${donor.phoneNumber})`);
                whatsappSuccess++;
            } catch (whatsappError) {
                console.error(`❌ WhatsApp failed for ${donor.fullName}:`, whatsappError.message);
                whatsappFailed++;
            }

            // Send Email
            try {
                await resend.emails.send({
                    from: 'onboarding@resend.dev',
                    to: "athrudev@gmail.com",
                    subject: heading,
                    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${bodyText.replace(/\n/g, '<br>')}</div>`,
                });
                console.log(`✅ Email sent to ${donor.fullName} (${donor.email})`);
                emailSuccess++;
            } catch (emailError) {
                console.error(`❌ Email failed for ${donor.fullName}:`, emailError.message);
                emailFailed++;
            }

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const totalSuccess = Math.max(whatsappSuccess, emailSuccess);
        
        res.status(200).json({
            message: `Emergency request processed. ${totalSuccess} donors notified successfully.`,
            results: {
                successful: totalSuccess,
                failed: Math.min(whatsappFailed, emailFailed),
                total: approvedDonors.length,
                compatibleBloodGroups: compatibleBloodGroups,
                whatsapp: { success: whatsappSuccess, failed: whatsappFailed },
                email: { success: emailSuccess, failed: emailFailed }
            }
        });

    } catch (error) {
        console.error("❌ Error in emergency endpoint:", error);
        res.status(500).json({ 
            message: "Failed to process emergency request.", 
            details: error.message 
        });
    }
});

// MongoDB Connection with better error handling
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Successfully connected to MongoDB database!');
}).catch(error => {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
});

// Donor Registration Endpoint
app.post('/api/register', async (req, res) => {
    try {
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
            is_approved: false,
        });

        console.log(`✅ Successfully saved donor to MongoDB: ${newDonor.fullName}`);
        res.status(201).json({ message: "Donor data saved successfully.", donor: newDonor });
    } catch (error) {
        console.error('❌ Error saving data to MongoDB:', error);
        res.status(500).json({ error: "Failed to save donor data.", details: error.message });
    }
});

// Get approved donors
app.get('/api/donors/approved', async (req, res) => {
    try {
        const donors = await Donor.find({ is_approved: true });
        res.status(200).json(donors);
    } catch (error) {
        console.error('❌ Error fetching approved donors:', error);
        res.status(500).json({ message: 'Failed to fetch approved donors.' });
    }
});

// Get pending donors
app.get('/api/donors/pending', async (req, res) => {
    try {
        const donors = await Donor.find({ is_approved: false });
        res.status(200).json(donors);
    } catch (error) {
        console.error('❌ Error fetching pending donors:', error);
        res.status(500).json({ message: 'Failed to fetch pending donors.' });
    }
});

// Approve donor
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// DEBUG: Endpoint to check all donors in database
app.get('/api/debug/donors', async (req, res) => {
    try {
        const allDonors = await Donor.find({});
        const approvedDonors = await Donor.find({ is_approved: true });
        
        console.log('🔍 DEBUG: All donors in database:');
        allDonors.forEach((donor, index) => {
            console.log(`${index + 1}. ${donor.fullName} - ${donor.phoneNumber} - ${donor.city} - Approved: ${donor.is_approved} - Emergency: ${donor.emergencyAvailability}`);
        });
        
        res.json({
            total: allDonors.length,
            approved: approvedDonors.length,
            donors: allDonors.map(donor => ({
                name: donor.fullName,
                phone: donor.phoneNumber,
                city: donor.city,
                bloodGroup: donor.bloodGroup,
                approved: donor.is_approved,
                emergencyAvailable: donor.emergencyAvailability
            }))
        });
    } catch (error) {
        console.error('❌ Error fetching donors for debug:', error);
        res.status(500).json({ message: 'Failed to fetch donors.' });
    }
});

// Test endpoint for Twilio
app.get('/api/test-twilio', async (req, res) => {
    try {
        const testMessage = await twilioClient.messages.create({
            from: twilioPhoneNumber,
            to: 'whatsapp:+919876543210', // Replace with your WhatsApp number for testing
            body: 'Test message from BloodShare app!'
        });
        
        res.json({ 
            success: true, 
            message: 'Test message sent successfully!', 
            sid: testMessage.sid 
        });
    } catch (error) {
        console.error('Twilio test error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            code: error.code
        });
    }
});



// --- NEW: Endpoint to get nearby donors based on coordinates ---
app.get('/api/donors/nearby', async (req, res) => {
  const { lat, lon, radius = 20 } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ message: 'Latitude and longitude are required for nearby search.' });
  }
  const longitude = parseFloat(lon);
  const latitude = parseFloat(lat);
  const radiusInMeters = parseFloat(radius) * 1000;
  try {
    const nearbyDonors = await Donor.find({
      is_approved: true,
      emergencyAvailability: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusInMeters,
        },
      },
    });
    res.status(200).json(nearbyDonors);
  } catch (error) {
    console.error('❌ Error fetching nearby donors:', error);
    res.status(500).json({ message: 'Failed to fetch nearby donors.', details: error.message });
  }
});
// Mock Hospital Data - In a real app, this would be a separate collection

// --- NEW: Endpoint to get nearby hospitals ---
// --- NEW: Endpoint to get nearby hospitals ---
// --- NEW: Endpoint to get nearby hospitals ---
app.get('/api/hospitals/nearby', (req, res) => {
  const { lat, lon, radius = 20 } = req.query; // Radius in km
  if (!lat || !lon) {
    return res.status(400).json({ message: 'Latitude and longitude are required.' });
  }
  const userLat = parseFloat(lat);
  const userLon = parseFloat(lon);
  const radiusKm = parseFloat(radius);

  // Simple filter for mock data
  const nearbyHospitals = hospitalsData.filter(hospital => {
    const R = 6371; // Radius of Earth in km
    const dLat = (hospital.location.coordinates[1] - userLat) * Math.PI / 180;
    const dLon = (hospital.location.coordinates[0] - userLon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(userLat * Math.PI / 180) * Math.cos(hospital.location.coordinates[1] * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance <= radiusKm;
  });

  res.status(200).json(nearbyHospitals);
});



// Basic route
app.get('/', (req, res) => {
    res.send('BloodShare Backend Server is running! 🚀');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 BloodShare Backend Server listening on port ${port}`);
    console.log(`📱 Health check: http://localhost:${port}/api/health`);
});

module.exports = app;