const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  visitor_name: { type: String, required: true },
  company_name: { type: String, required: true },
  visiting_person: { type: String, required: true },
  pass_number: { type: String, required: true },
  visiting_department: { type: String, required: true },
  employee_tag: { type: String, default: 'Visitor' },
  mobile_number: { type: String, required: true },
  email_address: { type: String, required: true },
  visit_start_date: { type: Date, required: true },
  visit_end_date: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visitor', VisitorSchema);
