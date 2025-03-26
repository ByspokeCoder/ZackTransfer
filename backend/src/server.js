const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');

// Load environment variables
dotenv.config();

const app = express();

// In-memory storage
const transfers = new Map();

// Function to delete a transfer after 60 seconds
const scheduleDeletion = (code) => {
  setTimeout(() => {
    transfers.delete(code);
    console.log(`Transfer ${code} deleted after 60 seconds`);
  }, 60000); // 60 seconds
};

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
app.use(cors({
  origin: ['https://www.zacktransfer.com', 'https://zacktransfer.com', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Generate a random 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create a new transfer
app.post('/api/transfers', upload.single('image'), (req, res) => {
  try {
    const { content, type } = req.body;
    const code = generateCode();
    
    let transferContent = content;
    let imageUrl = null;
    
    if (type === 'image' && req.file) {
      // Create the full URL for the image
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
      transferContent = imageUrl;
    }
    
    transfers.set(code, {
      code,
      content: transferContent,
      type,
      imageUrl,
      createdAt: new Date()
    });

    // Schedule deletion after 60 seconds
    scheduleDeletion(code);

    res.status(201).json({ 
      code,
      expiresIn: 60
    });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ error: 'Error creating transfer' });
  }
});

// Get transfer by code
app.get('/api/transfers/:code', (req, res) => {
  try {
    const { code } = req.params;
    const transfer = transfers.get(code);

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found or expired' });
    }

    res.json(transfer);
  } catch (error) {
    console.error('Error retrieving transfer:', error);
    res.status(500).json({ error: 'Error retrieving transfer' });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ZackTransfer API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 