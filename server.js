const express = require('express');
const serverless = require('serverless-http');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const router = express.Router();
app.use(bodyParser.json());

const SECRET_KEY = 'your-secret-key';

let blogContent = {
    imageUrl: '/default-image.jpg',
    text: 'This is my blog description. Stay tuned for updates!'
};

// File upload configuration for multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve uploads
router.get('/get-blog', (req, res) => {
    res.json(blogContent);
});

// Authentication and updating blog (with token verification)
router.post('/update-blog', upload.single('image'), (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }

        // Update image and text
        if (req.file) {
            const image = req.file.buffer.toString('base64');
            blogContent.imageUrl = `data:image/jpeg;base64,${image}`;
        }

        if (req.body.text) {
            blogContent.text = req.body.text;
        }

        res.json({ message: 'Blog updated successfully', blogContent });
    });
});

app.use('/.netlify/functions/server', router);

// Export for Netlify Function
module.exports.handler = serverless(app);
