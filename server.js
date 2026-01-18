const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// 1. Allow CORS from ANY origin to prevent browser blocking
app.use(cors({ 
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// 2. Request Logger (Helpful to see if backend is actually receiving requests)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CREDENTIALS
const EMAIL_USER = process.env.EMAIL_USER || 'bhartishivraj177@gmail.com';
const EMAIL_PASS = (process.env.EMAIL_PASSWORD || 'iwfb blyy duxv lghq').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// HEALTH CHECK ROUTE
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
      <h1 style="color: green;">✅ Email Server is Running!</h1>
      <p>Listening on Port 5000</p>
      <p>Email User: ${EMAIL_USER}</p>
    </div>
  `);
});

app.post('/api/send-otp', async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP required' });
  }

  console.log(`Processing OTP for: ${email}`);

  try {
    const info = await transporter.sendMail({
      from: `"UniScholar Portal" <${EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      text: `Your Verification Code is: ${otp}\n\nThis code expires in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #2563eb;">Verify Your Email</h2>
          <p>Your One-Time Password (OTP) for registration is:</p>
          <h1 style="background: #f3f4f6; padding: 10px; display: inline-block; letter-spacing: 5px; color: #1e40af;">${otp}</h1>
          <p>This code is valid for 5 minutes.</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    console.log('✅ Email sent successfully:', info.messageId);
    res.json({ success: true, message: 'OTP sent via Email' });
  } catch (error) {
    console.error('❌ SMTP Error:', error);
    res.status(500).json({ error: 'Failed to send email. Check backend terminal for logs.' });
  }
});

const PORT = 5000;
// CRITICAL FIX: Bind to 0.0.0.0 so it works in Containers/Cloud environments
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`   EMAIL SERVER RUNNING`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://127.0.0.1:${PORT}`);
  console.log(`==================================================\n`);
});