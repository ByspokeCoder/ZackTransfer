const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const upload = require('../middleware/upload');

// Create a new transfer
router.post('/', upload.single('image'), transferController.createTransfer);

// Get transfer by code
router.get('/:code', transferController.getTransfer);

module.exports = router; 