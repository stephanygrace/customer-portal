require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Helper to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// In-memory data stores (for POC)
let users = [];

// Messages file path
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Load messages from JSON file
function loadMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[Backend] Error loading messages:', error.message);
  }
  return [];
}

// Save messages to JSON file
function saveMessages(messages) {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
    console.log('[Backend] Messages saved to file');
  } catch (error) {
    console.error('[Backend] Error saving messages:', error.message);
  }
}

// Initialize messages
let messages = loadMessages();
console.log(`[Backend] Loaded ${messages.length} messages from file`);

// ServiceM8 API configuration
const SERVICEM8_API_BASE = 'https://api.servicem8.com/api_1.0';
const SERVICEM8_API_KEY = process.env.SERVICEM8_API_KEY || 'smk-f1aa2a-8894cd2347442d28-25b7dcfef39d25b9';

console.log('ServiceM8 API Configuration:');
console.log('  API Key:', SERVICEM8_API_KEY ? `${SERVICEM8_API_KEY.substring(0, 15)}...` : 'NOT SET');
console.log('  API Base:', SERVICEM8_API_BASE);

// Helper function to call ServiceM8 API with pagination
async function callServiceM8API(endpoint, method = 'GET', data = null) {
  let allData = [];
  let nextCursor = undefined;
  let pageCount = 0;

  try {
    do {
      pageCount++;
      const url = nextCursor 
        ? `${SERVICEM8_API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}cursor=${encodeURIComponent(nextCursor)}`
        : `${SERVICEM8_API_BASE}${endpoint}`;

      const config = {
        method,
        url,
        headers: {
          'X-API-Key': SERVICEM8_API_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      };
      if (data) config.data = data;

      const response = await axios(config);
      const responseData = response.data;

      if (Array.isArray(responseData)) allData.push(...responseData);
      else if (responseData && Array.isArray(responseData.jobs)) allData.push(...responseData.jobs);
      else if (responseData) allData.push(responseData);

      nextCursor = responseData?.next_cursor;
    } while (nextCursor);

    return { success: true, data: allData };
  } catch (error) {
    console.error('[ServiceM8 API] Error:', error.message);
    return { success: false, error: error.message, mock: true };
  }
}

// Initialize users and auto-match first job
async function initializeUsers() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Fetch first job from ServiceM8
  const result = await callServiceM8API('/job.json?$filter=active eq 1');
  let firstJobUuid = null;
  if (result.success && result.data.length > 0) {
    firstJobUuid = result.data[0].contact_uuid || result.data[0].contact?.uuid || result.data[0].contact;
  }

  users = [
    {
      id: 1,
      email: 'johnsmith@gmail.com',
      phone: '+61756117044',
      password: hashedPassword,
      name: 'John Smith',
      servicem8CustomerId: firstJobUuid || '12345'
    },
    {
      id: 2,
      email: 'stephanytayong@gmail.com',
      phone: '+61730595222',
      password: hashedPassword,
      name: 'Stephany Tayong',
      servicem8CustomerId: '67890'
    }
  ];
}

initializeUsers();

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  const { email, phone, password, name } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!email && !phone) return res.status(400).json({ error: 'At least one identifier is required' });

  const existingUser = users.find(u => (email && u.email === email) || (phone && u.phone === phone));
  if (existingUser) return res.status(409).json({ error: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, email: email || '', phone: phone || '', password: hashedPassword, name: name || 'Customer', servicem8CustomerId: `CUST${Date.now()}` };
  users.push(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, user: newUser, token });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { loginMethod, email, phone, password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });
  if (!loginMethod) return res.status(400).json({ error: 'Login method is required' });

  let user = null;
  if (loginMethod === 'email') user = users.find(u => u.email === email);
  else if (loginMethod === 'phone') user = users.find(u => u.phone === phone);
  else return res.status(400).json({ error: 'Invalid login method' });

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

  // Get full user object with servicem8CustomerId (exclude password)
  const fullUser = users.find(u => u.id === user.id);
  const { password: _, ...userWithoutPassword } = fullUser;
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, user: userWithoutPassword, token });
});

// Fetch all jobs (protected)
app.get('/api/jobs', authenticateToken, async (req, res) => {
  const result = await callServiceM8API('/job.json?$filter=active eq 1');
  if (!result.success || result.mock) return res.status(500).json({ error: 'Failed to fetch jobs from ServiceM8' });
  res.json({ success: true, jobs: result.data });
});

// Fetch bookings for logged-in customer (car owner) by email
app.get('/api/bookings', authenticateToken, async (req, res) => {
  console.log('\n[Backend] GET /api/bookings - Request received');
  console.log('  User ID:', req.user.id);
  console.log('  User email:', req.user.email);
  
  // Get the full user object to access email
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    console.log('[Backend] ERROR: User not found');
    return res.status(404).json({ error: 'User not found' });
  }
  
  const customerEmail = user.email;
  console.log('  Customer email:', customerEmail);
  
  if (!customerEmail) {
    console.log('[Backend] ERROR: Customer email not set for user');
    return res.json({ success: true, bookings: [], error: 'Customer email not configured' });
  }
  
  try {
    // Step 1: Fetch job contacts filtered by customer email
    console.log('[Backend] Fetching job contacts for email:', customerEmail);
    const jobContactsResult = await callServiceM8API(`/jobcontact.json?$filter=email eq '${encodeURIComponent(customerEmail)}'`);
    
    if (!jobContactsResult.success || jobContactsResult.mock || !Array.isArray(jobContactsResult.data) || jobContactsResult.data.length === 0) {
      console.log('[Backend] No job contacts found for email:', customerEmail);
      console.log('[Backend] Using mock data fallback');
      
      // Mock data for demo when API fails
      const mockBookings = [
        {
          uuid: 'booking-1',
          job_number: 'RW-2024-001',
          name: 'Roadworthy Inspection - Toyota Camry',
          status: 'Scheduled',
          scheduled_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          vehicle: {
            make: 'Toyota',
            model: 'Camry',
            year: '2020',
            rego: 'ABC123',
            vin: 'JT1234567890'
          }
        }
      ];
      
      return res.json({ success: true, bookings: mockBookings, mock: true });
    }
    
    console.log('[Backend] Found', jobContactsResult.data.length, 'job contacts for email:', customerEmail);
    
    // Step 2: Extract job_uuids from job contacts
    const jobUuids = jobContactsResult.data
      .map(contact => contact.job_uuid)
      .filter(uuid => uuid); // Remove any null/undefined values
    
    console.log('[Backend] Extracted', jobUuids.length, 'job UUIDs:', jobUuids);
    
    if (jobUuids.length === 0) {
      console.log('[Backend] No job UUIDs found in contacts');
      return res.json({ success: true, bookings: [] });
    }
    
    // Step 3: Fetch actual jobs using the job UUIDs
    // ServiceM8 allows filtering by uuid using $filter=uuid eq 'uuid-value'
    // We'll fetch all active jobs and filter client-side, or fetch each job individually
    console.log('[Backend] Fetching job details for', jobUuids.length, 'jobs');
    
    // Fetch all active jobs and filter by the job UUIDs we found
    const allJobsResult = await callServiceM8API('/job.json?$filter=active eq 1');
    
    if (!allJobsResult.success || allJobsResult.mock || !Array.isArray(allJobsResult.data)) {
      console.log('[Backend] Failed to fetch jobs from ServiceM8');
      return res.json({ success: true, bookings: [], mock: true });
    }
    
    console.log('[Backend] Fetched', allJobsResult.data.length, 'total active jobs');
    
    // Filter jobs that match our job UUIDs
    const customerJobs = allJobsResult.data.filter(job => jobUuids.includes(job.uuid));
    
    console.log('[Backend] Found', customerJobs.length, 'jobs matching the customer email');
    
    // Step 4: Transform ServiceM8 job data to booking format
    const bookings = customerJobs.map(job => {
      console.log('[Backend] Processing job:', job.generated_job_id || job.uuid, 'UUID:', job.uuid);
      
      return {
        uuid: job.uuid,
        job_number: job.generated_job_id || job.job_number || job.uuid.substring(0, 8),
        name: job.job_description || job.name || `Job ${job.generated_job_id || job.uuid.substring(0, 8)}`,
        status: job.status || job.status_name || 'Unknown',
        scheduled_start: job.work_order_date && job.work_order_date !== '0000-00-00 00:00:00'
          ? job.work_order_date
          : (job.date || job.scheduled_start || job.start_date || job.created_at),
        scheduled_end: job.completion_date || job.scheduled_end || job.end_date,
        description: job.job_description || job.description || job.notes || '',
        address: job.job_address || job.address || job.site_address || '',
        contact_uuid: job.contact_uuid || job.contact?.uuid,
        vehicle: job.vehicle ? {
          make: job.vehicle.make || '',
          model: job.vehicle.model || '',
          year: job.vehicle.year || '',
          rego: job.vehicle.registration || job.vehicle.rego || '',
          vin: job.vehicle.vin || ''
        } : undefined
      };
    });
    
    console.log('[Backend] Returning', bookings.length, 'bookings to frontend\n');
    return res.json({ success: true, bookings });
    
  } catch (error) {
    console.error('[Backend] Error fetching bookings:', error.message);
    console.error('[Backend] Error stack:', error.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get booking details by UUID
app.get('/api/bookings/:bookingId', authenticateToken, async (req, res) => {
  const { bookingId } = req.params;
  console.log('\n[Backend] GET /api/bookings/:bookingId - Request received');
  console.log('  Booking ID (UUID):', bookingId);
  
  try {
    // Fetch the specific job by UUID
    const result = await callServiceM8API(`/job.json?$filter=uuid eq '${bookingId}'`);
    
    if (!result.success || result.mock || !Array.isArray(result.data) || result.data.length === 0) {
      console.log('[Backend] Job not found for UUID:', bookingId);
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const job = result.data[0];
    console.log('[Backend] Found job:', job.generated_job_id || job.uuid);
    
    // Transform ServiceM8 job to booking format
    const booking = {
      uuid: job.uuid,
      job_number: job.generated_job_id || job.job_number || job.uuid.substring(0, 8),
      name: job.job_description?.split('\n')[0] || job.job_description || `Job ${job.generated_job_id || job.uuid.substring(0, 8)}`,
      status: job.status || job.status_name || 'Unknown',
      scheduled_start: job.work_order_date && job.work_order_date !== '0000-00-00 00:00:00'
        ? job.work_order_date
        : (job.date || job.scheduled_start || job.start_date || job.created_at),
      scheduled_end: job.completion_date && job.completion_date !== '0000-00-00 00:00:00' 
        ? job.completion_date 
        : job.scheduled_end || job.end_date,
      description: job.job_description || job.description || job.notes || '',
      work_done_description: job.work_done_description || '',
      address: job.job_address || job.address || job.site_address || '',
      billing_address: job.billing_address || '',
      contact_uuid: job.contact_uuid || job.contact?.uuid,
      total_invoice_amount: job.total_invoice_amount || '0',
      payment_amount: job.payment_amount || 0,
      payment_method: job.payment_method || '',
      quote_date: job.quote_date && job.quote_date !== '0000-00-00 00:00:00' ? job.quote_date : null,
      work_order_date: job.work_order_date && job.work_order_date !== '0000-00-00 00:00:00' ? job.work_order_date : null,
      // Vehicle info might not be in job object, will be null/undefined
      vehicle: job.vehicle ? {
        make: job.vehicle.make || '',
        model: job.vehicle.model || '',
        year: job.vehicle.year || '',
        rego: job.vehicle.registration || job.vehicle.rego || '',
        vin: job.vehicle.vin || ''
      } : undefined
    };
    
    console.log('[Backend] Returning booking details\n');
    return res.json({ success: true, booking });
    
  } catch (error) {
    console.error('[Backend] Error fetching booking details:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invoice/quote document for a booking
app.get('/api/bookings/:bookingId/documents/:documentType', authenticateToken, async (req, res) => {
  const { bookingId, documentType } = req.params;
  console.log('\n[Backend] GET /api/bookings/:bookingId/documents/:documentType');
  console.log('  Booking ID:', bookingId);
  console.log('  Document Type:', documentType);
  
  if (documentType !== 'quote' && documentType !== 'invoice') {
    return res.status(400).json({ error: 'Invalid document type. Use "quote" or "invoice"' });
  }
  
  try {
    // Fetch the job from ServiceM8
    const result = await callServiceM8API(`/job.json?$filter=uuid eq '${bookingId}'`);
    
    if (!result.success || result.mock || !Array.isArray(result.data) || result.data.length === 0) {
      console.log('[Backend] Job not found for UUID:', bookingId);
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = result.data[0];
    console.log('[Backend] Found job:', job.generated_job_id || job.uuid);
    
    // Get user info for customer details
    const user = users.find(u => u.id === req.user.id);
    
    // Use work_order_date as the primary date, fallback to quote_date or date
    const documentDate = job.work_order_date && job.work_order_date !== '0000-00-00 00:00:00'
      ? job.work_order_date
      : (job.quote_date && job.quote_date !== '0000-00-00 00:00:00'
        ? job.quote_date
        : job.date);
    
    // Format date for display (YYYY-MM-DD)
    const formatDateForDoc = (dateStr) => {
      if (!dateStr || dateStr === '0000-00-00 00:00:00') return new Date().toISOString().split('T')[0];
      return dateStr.split(' ')[0]; // Get just the date part
    };
    
    // Calculate invoice amount
    const invoiceAmount = parseFloat(job.total_invoice_amount || '0');
    const subtotal = invoiceAmount / 1.1; // Remove GST (10%)
    const gst = invoiceAmount - subtotal;
    
    // Build document based on type
    const document = {
      type: documentType,
      documentNumber: documentType === 'quote' 
        ? `QUOTE-${job.generated_job_id || job.uuid.substring(0, 8).toUpperCase()}`
        : `INV-${job.generated_job_id || job.uuid.substring(0, 8).toUpperCase()}`,
      date: formatDateForDoc(documentDate),
      customer: {
        name: user?.name || 'Customer',
        address: job.billing_address || job.job_address || '',
        phone: user?.phone || '',
        email: user?.email || ''
      },
      vehicle: job.vehicle ? {
        make: job.vehicle.make || '',
        model: job.vehicle.model || '',
        year: job.vehicle.year || '',
        rego: job.vehicle.registration || job.vehicle.rego || '',
        vin: job.vehicle.vin || ''
      } : {
        make: 'N/A',
        model: 'N/A',
        year: 'N/A',
        rego: 'N/A',
        vin: 'N/A'
      },
      services: [
        {
          description: job.work_done_description || job.job_description?.split('\n')[0] || 'Service',
          quantity: 1,
          unitPrice: subtotal,
          total: subtotal
        }
      ],
      subtotal: subtotal,
      gst: gst,
      total: invoiceAmount,
      work_order_date: job.work_order_date && job.work_order_date !== '0000-00-00 00:00:00'
        ? formatDateForDoc(job.work_order_date)
        : undefined,
      ...(documentType === 'quote' && {
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: job.job_description || 'This quote is valid for 30 days.'
      }),
      ...(documentType === 'invoice' && {
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentStatus: job.payment_amount > 0 ? 'Paid' : 'Pending',
        paymentMethod: job.payment_method || '',
        paymentDate: job.payment_date && job.payment_date !== '0000-00-00 00:00:00'
          ? formatDateForDoc(job.payment_date)
          : undefined,
        notes: job.work_done_description || job.job_description || 'Thank you for your business.'
      })
    };
    
    console.log('[Backend] Returning', documentType, 'document\n');
    return res.json({ success: true, document });
    
  } catch (error) {
    console.error('[Backend] Error fetching document:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a booking
app.get('/api/bookings/:bookingId/messages', authenticateToken, async (req, res) => {
  const { bookingId } = req.params;
  console.log('\n[Backend] GET /api/bookings/:bookingId/messages');
  console.log('  Booking ID:', bookingId);
  
  try {
    // Reload messages from file to get latest
    messages = loadMessages();
    
    // Filter messages for this booking
    const bookingMessages = messages.filter(msg => msg.bookingId === bookingId);
    
    console.log(`[Backend] Found ${bookingMessages.length} messages for booking ${bookingId}`);
    return res.json({ success: true, messages: bookingMessages });
    
  } catch (error) {
    console.error('[Backend] Error fetching messages:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message for a booking
app.post('/api/bookings/:bookingId/messages', authenticateToken, async (req, res) => {
  const { bookingId } = req.params;
  const { message, userId } = req.body;
  
  console.log('\n[Backend] POST /api/bookings/:bookingId/messages');
  console.log('  Booking ID:', bookingId);
  console.log('  User ID:', userId);
  console.log('  Message:', message);
  
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Reload messages from file
    messages = loadMessages();
    
    // Create new message
    const newMessage = {
      id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
      bookingId: bookingId,
      userId: userId || req.user.id.toString(),
      message: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Add to messages array
    messages.push(newMessage);
    
    // Save to file
    saveMessages(messages);
    
    console.log('[Backend] Message saved successfully');
    return res.json({ success: true, message: newMessage });
    
  } catch (error) {
    console.error('[Backend] Error sending message:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`ServiceM8 API configured: ${SERVICEM8_API_KEY ? 'Yes' : 'No (mock fallback)'}`);
});
