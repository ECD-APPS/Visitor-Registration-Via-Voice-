const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const Visitor = require('./models/Visitor');

const app = express();
const PORT = process.env.PORT || 4000;
const CRM_ENDPOINT = process.env.CRM_ENDPOINT || 'https://example.com/crm-webhook';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/visitor-registration';

app.use(cors());
app.use(express.json());

const requiredFields = [
  'visitor_name',
  'company_name',
  'visiting_person',
  'pass_number',
  'visiting_department',
  'employee_tag',
  'mobile_number',
  'email_address',
  'visit_start_date',
  'visit_end_date'
];

function validatePayload(payload) {
  const missing = requiredFields.filter(field => !payload[field]);
  if (missing.length) {
    return `Missing required fields: ${missing.join(', ')}`;
  }

  if (!/^EAP\w{10}$/.test(payload.pass_number)) {
    return 'pass_number must start with EAP and contain 13 total characters.';
  }

  if (!/^\+?\d{7,15}$/.test(payload.mobile_number)) {
    return 'mobile_number must be a valid international phone number.';
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email_address)) {
    return 'email_address must be a valid email address.';
  }

  const startDate = new Date(payload.visit_start_date);
  const endDate = new Date(payload.visit_end_date);

  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    return 'visit_start_date and visit_end_date must be valid dates.';
  }

  if (startDate > endDate) {
    return 'visit_end_date must be equal to or after visit_start_date.';
  }

  return null;
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(error => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Visitor registration backend is running.' });
});

app.post('/api/visitor/voice-register', async (req, res) => {
  const payload = req.body;
  const error = validatePayload(payload);

  if (error) {
    return res.status(400).json({ success: false, error });
  }

  const visitorData = {
    ...payload,
    visit_start_date: new Date(payload.visit_start_date),
    visit_end_date: new Date(payload.visit_end_date)
  };

  try {
    const visitorDoc = new Visitor(visitorData);
    await visitorDoc.save();

    const crmResponse = await axios.post(CRM_ENDPOINT, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    return res.status(200).json({
      success: true,
      message: 'Visitor registration saved to MongoDB and synced to CRM.',
      databaseId: visitorDoc._id,
      crmStatus: crmResponse.status,
      crmData: crmResponse.data
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      error: 'Failed to save visitor data or forward it to CRM.',
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Visitor registration backend listening on port ${PORT}`);
});
