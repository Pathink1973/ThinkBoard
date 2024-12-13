require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// Basic CORS setup
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Google Cloud Storage setup
const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_CLOUD_CREDENTIALS_PATH
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);

// Multer setup for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Upload endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
    console.log('Upload request received');
    
    if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        console.log('Processing file:', req.file.originalname);
        
        const blobName = `${Date.now()}_${req.file.originalname}`;
        const blob = bucket.file(blobName);
        
        const blobStream = blob.createWriteStream({
            resumable: false,
            metadata: {
                contentType: req.file.mimetype
            }
        });

        blobStream.on('error', (error) => {
            console.error('Stream error:', error);
            res.status(500).json({ error: 'Upload failed' });
        });

        blobStream.on('finish', async () => {
            // Generate a signed URL that expires in 1 week
            try {
                const [url] = await blob.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week
                });
                console.log('Upload successful, signed URL:', url);
                res.status(200).json({ imageUrl: url });
            } catch (error) {
                console.error('Error generating signed URL:', error);
                res.status(500).json({ error: 'Failed to generate URL for uploaded file' });
            }
        });

        console.log('Writing file to stream...');
        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Google Cloud Storage config:', {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        bucket: process.env.GOOGLE_CLOUD_BUCKET_NAME
    });
});
