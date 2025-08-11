// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const Donor = require('./models/Donor');

// 1. Import and configure Twilio with environment variables
const twilio = require('twilio');
// SECURITY ISSUE: Move these to environment variables!
const accountSid = process.env.TWILIO_ACCOUNT_SID || "ACb6a3223d0de34fe4c5ddb8bc137bc9cc";
const authToken = process.env.TWILIO_AUTH_TOKEN || "037505d8639ef4a0eb67be5cdaacb101";
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

const twilioClient = new twilio(accountSid, authToken);

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
    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // If number starts with 91, use as is
    if (cleanNumber.startsWith('91')) {
        return `whatsapp:+${cleanNumber}`;
    }
    
    // If 10-digit number, add India country code
    if (cleanNumber.length === 10) {
        return `whatsapp:+91${cleanNumber}`;
    }
    
    // If already has country code but no 91 prefix
    if (cleanNumber.length > 10) {
        return `whatsapp:+${cleanNumber}`;
    }
    
    throw new Error(`Invalid phone number format: ${phoneNumber}`);
}

app.post('/api/emergency', async (req, res) => {
    try {
        const { patientName, contactPerson, phone, bloodGroup, unitsNeeded, hospital, city, urgencyLevel, additionalInfo } = req.body;

        console.log('📋 Emergency request received:', {
            patientName,
            contactPerson,
            phone,
            bloodGroup,
            unitsNeeded,
            hospital,
            city,
            urgencyLevel
        });

        // Validation
        if (!patientName || !contactPerson || !phone || !bloodGroup || !unitsNeeded || !hospital || !city || !urgencyLevel) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // 2. Find all approved donors (only filter by approval status)
        const approvedDonors = await Donor.find({ 
            is_approved: true
        });

        console.log(`🔍 Found ${approvedDonors.length} approved donors across all cities`);
        
        // Debug: Log all approved donors
        console.log('📋 All approved donors:');
        approvedDonors.forEach((donor, index) => {
            console.log(`${index + 1}. ${donor.fullName} - ${donor.phoneNumber} - ${donor.bloodGroup} - ${donor.city} - Approved: ${donor.is_approved}`);
        });

        // Also get compatible blood group donors for priority messaging
        const compatibleBloodGroups = getCompatibleBloodGroups(bloodGroup);
        const compatibleDonors = approvedDonors.filter(donor => 
            compatibleBloodGroups.includes(donor.bloodGroup)
        );

        console.log(`🩸 Found ${compatibleDonors.length} compatible blood group donors (${compatibleBloodGroups.join(', ')})`);

        if (approvedDonors.length === 0) {
            return res.status(404).json({ message: "No approved donors found." });
        }

        // 3. Prepare the WhatsApp message template
        const urgencyLabels = {
            critical: "CRITICAL (Within 2 hours)",
            urgent: "URGENT (Within 6 hours)",
            moderate: "MODERATE (Within 24 hours)"
        };

        // 3. Create message template functions
        const createCompatibleDonorMessage = (donorBloodGroup) => `🚨 *URGENT BLOOD REQUEST* - You can help! 🚨

*Patient:* ${patientName}
*Blood Group Required:* ${bloodGroup} (${unitsNeeded} units)
*YOUR BLOOD GROUP (${donorBloodGroup}) CAN HELP!*
*Urgency:* ${urgencyLabels[urgencyLevel] || urgencyLevel.toUpperCase()}
*Hospital:* ${hospital}
*City:* ${city}

*Contact Person:* ${contactPerson}
*Contact Phone:* ${phone}

${additionalInfo ? `*Additional Info:* ${additionalInfo}` : ''}

⚡ *You can directly donate! Please contact them immediately.*

Your donation can save a life! ❤️
- BloodShare Team`;

        const generalDonorMessage = `🚨 *EMERGENCY BLOOD REQUEST* 🚨

*Patient:* ${patientName}
*Blood Group Required:* ${bloodGroup} (${unitsNeeded} units)
*Urgency:* ${urgencyLabels[urgencyLevel] || urgencyLevel.toUpperCase()}
*Hospital:* ${hospital}
*City:* ${city}

*Contact Person:* ${contactPerson}
*Contact Phone:* ${phone}

${additionalInfo ? `*Additional Info:* ${additionalInfo}` : ''}

🩸 *Please share this with friends/family who might be able to help! Compatible blood groups: ${compatibleBloodGroups.join(', ')}*

Please contact them directly if you can donate or know someone who can.
Your help can save a life! ❤️

- BloodShare Team`;

        console.log('📝 Messages prepared for all approved donors across all cities');

        // 4. Send messages to all approved donors with individual error handling
        const messageResults = [];
        let successCount = 0;
        let failCount = 0;

        for (const donor of approvedDonors) {
            try {
                console.log(`📞 Attempting to send WhatsApp to: ${donor.fullName} (${donor.phoneNumber}) - Blood Group: ${donor.bloodGroup} - City: ${donor.city}`);
                
                const formattedPhone = formatPhoneForWhatsApp(donor.phoneNumber);
                console.log(`📱 Formatted phone: ${formattedPhone}`);

                // Choose message based on blood compatibility
                const isCompatible = compatibleBloodGroups.includes(donor.bloodGroup);
                const messageBody = isCompatible 
                    ? createCompatibleDonorMessage(donor.bloodGroup)
                    : generalDonorMessage;

                const message = await twilioClient.messages.create({
                    from: twilioPhoneNumber,
                    to: formattedPhone,
                    body: messageBody
                });

                console.log(`✅ ${isCompatible ? 'PRIORITY' : 'GENERAL'} message sent to ${donor.fullName} in ${donor.city}. SID: ${message.sid}`);
                messageResults.push({
                    donor: donor.fullName,
                    phone: donor.phoneNumber,
                    bloodGroup: donor.bloodGroup,
                    city: donor.city,
                    compatible: isCompatible,
                    status: 'success',
                    sid: message.sid
                });
                successCount++;

            } catch (error) {
                console.error(`❌ Failed to send message to ${donor.fullName} in ${donor.city} (${donor.phoneNumber}):`, error);
                messageResults.push({
                    donor: donor.fullName,
                    phone: donor.phoneNumber,
                    bloodGroup: donor.bloodGroup,
                    city: donor.city,
                    status: 'failed',
                    error: error.message,
                    code: error.code
                });
                failCount++;
            }
        }

        // Log results summary
        const compatibleNotified = messageResults.filter(r => r.status === 'success' && r.compatible).length;
        const generalNotified = successCount - compatibleNotified;
        
        console.log(`📊 Message sending complete: ${successCount} successful (${compatibleNotified} compatible donors, ${generalNotified} general donors), ${failCount} failed`);
        console.log('📋 Detailed results:', messageResults);

        if (successCount === 0) {
            return res.status(500).json({ 
                message: "Failed to send messages to any donors.", 
                details: messageResults 
            });
        }

        res.status(200).json({ 
            message: `Emergency request sent successfully. ${successCount}/${approvedDonors.length} approved donors notified nationwide.`,
            results: {
                total: approvedDonors.length,
                successful: successCount,
                failed: failCount,
                compatibleDonorsNotified: compatibleNotified,
                generalDonorsNotified: generalNotified,
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