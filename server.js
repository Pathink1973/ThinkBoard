require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// CORS configuration - allow all origins during development
app.use(cors());

// Middleware
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

// Configure multer for local file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Upload endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
    console.log('Upload request received');
    
    if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        console.log('File saved:', req.file.filename);
        const imageUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({ imageUrl: imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: `Upload failed: ${error.message}` });
    }
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
