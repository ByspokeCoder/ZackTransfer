const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');
const { sendReadReceipt } = require('./services/emailService');
const { createTransfer, getTransfer } = require('./controllers/transferController');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectWithRetry = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Validate MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    // Parse MongoDB URI to check format
    const uri = process.env.MONGODB_URI;
    const uriParts = uri.match(/^mongodb(\+srv)?:\/\/([^:]+):([^@]+)@([^/]+)(\/[^?]+)?/);
    
    if (!uriParts) {
      throw new Error('Invalid MongoDB URI format');
    }
    
    // Log connection details without sensitive information
    console.log('MongoDB connection details:', {
      hasUri: true,
      uriLength: uri.length,
      startsWithMongo: uri.startsWith('mongodb'),
      hasAtlas: uri.includes('mongodb.net'),
      hasAuth: uri.includes('@'),
      hasDatabase: uri.includes('/?'),
      host: uriParts[4],
      database: uriParts[5]?.substring(1) || 'default',
      username: uriParts[2].substring(0, 3) + '...' // Only show first 3 chars of username
    });
    
    // Simplified connection options
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      maxPoolSize: 5,
      authSource: 'admin' // Explicitly set auth source
    });
    
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    // Handle specific MongoDB errors
    if (error.name === 'MongoServerError') {
      if (error.code === 8000) {
        console.error('MongoDB authentication failed:', {
          message: 'Invalid username or password',
          code: error.code,
          host: process.env.MONGODB_URI?.match(/@([^/]+)/)?.[1]
        });
      } else {
        console.error('MongoDB server error:', {
          message: error.message,
          code: error.code,
          name: error.name
        });
      }
    } else {
      console.error('MongoDB connection error:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack,
        env: {
          nodeEnv: process.env.NODE_ENV,
          hasMongoUri: !!process.env.MONGODB_URI,
          mongoUriLength: process.env.MONGODB_URI?.length,
          mongoUriFormat: process.env.MONGODB_URI?.match(/^mongodb(\+srv)?:\/\/([^:]+):([^@]+)@([^/]+)(\/[^?]+)?/) ? 'valid' : 'invalid'
        }
      });
    }
    
    // Retry connection after 5 seconds
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Start MongoDB connection
connectWithRetry();

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', {
    message: error.message,
    code: error.code,
    name: error.name,
    stack: error.stack,
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriLength: process.env.MONGODB_URI?.length,
      mongoUriFormat: process.env.MONGODB_URI?.match(/^mongodb(\+srv)?:\/\/([^:]+):([^@]+)@([^/]+)(\/[^?]+)?/) ? 'valid' : 'invalid'
    }
  });
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting to reconnect...', {
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriLength: process.env.MONGODB_URI?.length,
      mongoUriFormat: process.env.MONGODB_URI?.match(/^mongodb(\+srv)?:\/\/([^:]+):([^@]+)@([^/]+)(\/[^?]+)?/) ? 'valid' : 'invalid'
    }
  });
  connectWithRetry();
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// Trust proxy for rate limiter
app.set('trust proxy', 1);

// Enable CORS for all requests - must be first middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Expose-Headers', '*');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create a new transfer
app.post('/api/transfers', upload.single('image'), createTransfer);

// Get transfer by code
app.get('/api/transfers/:code', getTransfer);

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const testTransfer = {
      code: 'TEST123',
      type: 'text',
      content: 'Test content',
      senderEmail: req.body.email,
      readAt: new Date()
    };
    
    console.log('Testing email service with:', {
      email: req.body.email,
      emailUser: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASSWORD
    });

    await sendReadReceipt(testTransfer);
    res.json({ status: 'Email sent successfully' });
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message
    });
  }
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ZackTransfer API' });
});

app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: {
      status: mongoStatus,
      readyState: mongoose.connection.readyState,
      uriFormat: {
        hasUri: !!process.env.MONGODB_URI,
        uriLength: process.env.MONGODB_URI?.length,
        startsWithMongo: process.env.MONGODB_URI?.startsWith('mongodb'),
        hasAtlas: process.env.MONGODB_URI?.includes('mongodb.net'),
        hasAuth: process.env.MONGODB_URI?.includes('@'),
        hasDatabase: process.env.MONGODB_URI?.includes('/?')
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    headers: req.headers
  });
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Working directory:', process.cwd());
  console.log('Uploads directory:', uploadsDir);
  console.log('__dirname:', __dirname);
}); 