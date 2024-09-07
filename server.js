const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const SECRET_KEY = 'your-secret-key';  // Use environment variables for real apps
const users = [{ username: 'admin', password: bcrypt.hashSync('adminpassword', 8) }];  // Example user

let blogContent = {
    imageUrl: '/default-image.jpg',
    text: 'This is my blog description. Stay tuned for updates!'
};

// File upload configuration
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, 'blog-image' + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: 'Authentication failed' });
    }

    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// Protected route to update the blog content
app.post('/update-blog', upload.single('image'), (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }

        if (req.file) {
            blogContent.imageUrl = `/uploads/${req.file.filename}`;
        }

        if (req.body.text) {
            blogContent.text = req.body.text;
        }

        res.json({ message: 'Blog updated successfully', blogContent });
    });
});

// Public route to fetch blog content
app.get('/get-blog', (req, res) => {
    res.json(blogContent);
});

// Serve the uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
