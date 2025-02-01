const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();

// Enable CORS
app.use(cors());

// Add body parser
app.use(express.json());

app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Simple post test
app.post('/test-post', (req, res) => {
    res.json({ message: 'Post is working!' });
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Ensure upload directory exists
const fs = require('fs');
if (!fs.existsSync('./upload_images')) {
    fs.mkdirSync('./upload_images');
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload_images/')
    },
    filename: function (req, file, cb) {
        // Create a safe filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Configure upload middleware
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Initialize MySQL connection if credentials are provided
let connection;
try {
    if (process.env.MYSQL_HOST) {
        connection = mysql.createConnection({
            host: 'localhost:3306',
            user:  'root',
            password: 'mroot',
            database: 'clickfit_db'
        });

        // Create users table and stored procedure
        connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
                password VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
                type VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
                active TINYINT DEFAULT 1
            );
        `);

        connection.query(`
            DROP PROCEDURE IF EXISTS addUser;
            CREATE PROCEDURE addUser(
                IN p_email VARCHAR(255),
                IN p_password VARCHAR(255),
                IN p_type VARCHAR(255)
            )
            BEGIN
                INSERT INTO users (email, password, type, active)
                VALUES (p_email, p_password, p_type, 1);
            END;
        `);

        console.log('MySQL connected successfully');
    }
} catch (error) {
    console.log('MySQL connection not configured - user management features will be disabled');
}

// Handle file upload
app.post('/upload', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        res.json({ 
            message: 'Files uploaded successfully',
            files: req.files.map(file => file.filename)
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Error uploading files' });
    }
});

// Add user endpoint (only if MySQL is connected)
if (connection) {
    app.post('/add-user', (req, res) => {
        connection.query('CALL addUser(?, ?, ?)', 
            ['test@example.com', 'hashedpassword123', 'user'],
            function(error, results, fields) {
                if (error) {
                    res.status(500).json({ error: 'Error adding user' });
                    return;
                }
                res.json({ message: 'User added successfully' });
            }
        );
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Max size is 5MB.' });
        }
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});