// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const Donor = require('./models/Donor');

// 1. Twilio Imports & Hardcoded Credentials
const twilio = require('twilio');
const accountSid = "ACb6a3223d0de34fe4c5ddb8bc137bc9cc"; 
const authToken = "037505d8639ef4a0eb67be5cdaacb101"; 
const twilioPhoneNumber = 'whatsapp:+14155238886'; // Your Twilio WhatsApp number
const twilioClient = new twilio(accountSid, authToken);

// 2. Resend Imports & Hardcoded Credentials
const { Resend } = require('resend');
const resendApiKey = "re_KeGn1MTf_7N7YUgQJ371M9TmA3HZagJD6";
const resend = new Resend(resendApiKey);

// 3. Hardcoded Resend Verified Sender Email
const resendFromEmail = 'onboarding@resend.dev'; // Resend's default sandbox email

const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- MongoDB Configuration ---
const MONGODB_URI = 'mongodb://localhost:27017/bloodshareieee';

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

// Helper function to create the email body
const createEmailBody = (data, compatibleGroups, isCompatible) => {
    const urgencyLabels = {
        critical: "CRITICAL (Within 2 hours)",
        urgent: "URGENT (Within 6 hours)",
        moderate: "MODERATE (Within 24 hours)"
    };
    
    const heading = isCompatible 
        ? `EMERGENCY: Blood Needed! Your Blood Group Can Help!`
        : `EMERGENCY: Blood Needed in Your City!`;

    const bodyText = `
    Hello,

    An emergency blood request has been submitted on BloodShare. 
    A patient in your city needs blood urgently.

    Patient: ${data.patientName}
    Blood Group Required: ${data.bloodGroup} (${data.unitsNeeded} units)
    Urgency Level: ${urgencyLabels[data.urgencyLevel] || data.urgencyLevel.toUpperCase()}
    Hospital: ${data.hospital}
    City: ${data.city}

    Contact Person: ${data.contactPerson}
    Contact Phone: ${data.phone}

    ${isCompatible ? `Your blood group (${data.bloodGroup}) can help directly!` : `Compatible blood groups are: ${compatibleGroups.join(', ')}`}

    ${data.additionalInfo ? `Additional Information: ${data.additionalInfo}` : ''}

    Please contact the person directly if you can help or share this with someone who can.

    Thank you for being a part of our community.

    Best regards,
    The BloodShare Team
    `;

    return { heading, bodyText };
};

app.post("/api/test",async (req,res)=>{
resend.emails.send({
  from: 'onboarding@resend.dev',
  to: '@gmail.com',
  subject: 'Bhadwa',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});
})
app.post('/api/emergency', async (req, res) => {
    try {
        const { patientName, contactPerson, phone, bloodGroup, unitsNeeded, hospital, city, urgencyLevel, additionalInfo } = req.body;

        if (!patientName || !contactPerson || !phone || !bloodGroup || !unitsNeeded || !hospital || !city || !urgencyLevel) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const approvedDonors = await Donor.find({ 
            is_approved: true,
            emergencyAvailability: true
        });

        const compatibleBloodGroups = getCompatibleBloodGroups(bloodGroup);
        
        let successCount = 0;
        let failCount = 0;
        
        const notificationPromises = approvedDonors.map(async (donor) => {
            const isCompatible = compatibleBloodGroups.includes(donor.bloodGroup);
            const { heading, bodyText } = createEmailBody(req.body, compatibleBloodGroups, isCompatible);
            
            // Send WhatsApp message
            try {
                const formattedPhone = formatPhoneForWhatsApp(donor.phoneNumber);
                await twilioClient.messages.create({
                    from: twilioPhoneNumber,
                    to: formattedPhone,
                    body: bodyText
                });
                console.log(`✅ WhatsApp sent to ${donor.fullName} (${donor.phoneNumber})`);
                successCount++;
            } catch (whatsappError) {
                console.error(`❌ Failed to send WhatsApp to ${donor.fullName} (${donor.phoneNumber}):`, whatsappError.message);
                failCount++;
            }

            // Send Resend email
            try {
                // Use the provided Resend template here
                await resend.emails.send({
                    from: 'onboarding@resend.dev',
                    to: "athrudev@gmail.com",
                    subject: heading,
                    html: `<p>${bodyText.replace(/\n/g, '<br>')}</p>`,
                });
                console.log(`✅ Email sent to ${donor.fullName} (${donor.email})`);
            } catch (emailError) {
                console.error(`❌ Failed to send email to ${donor.fullName} (${donor.email}):`, emailError.message);
                failCount++;
            }
        });
        
        await Promise.allSettled(notificationPromises);

        res.status(200).json({
            message: `Emergency request sent. ${successCount} donors notified.`,
            results: {
                successful: successCount,
                failed: failCount,
                total: approvedDonors.length,
                compatibleBloodGroups: compatibleBloodGroups
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

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Successfully connected to MongoDB database!');
}).catch(error => {
    console.error('❌ Error connecting to MongoDB:', error);
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

// --- DEBUG: Endpoint to check all donors in database ---
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
        // Test with your own number first
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

// Basic route
app.get('/', (req, res) => {
  res.send('BloodShare Backend Server is running!');
});

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});