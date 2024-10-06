const express = require("express");
const connection = require('./crowdfunding_db');
const cors = require('cors');  // Import the cors middleware
const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

// Retrieve all active fundraisers including category
app.get('/fundraisers', (req, res) => {
    const sql = `SELECT fundraiser.*, category.NAME as CATEGORY 
                 FROM fundraiser 
                 JOIN CATEGORY ON fundraiser.CATEGORY_ID = category.CATEGORY_ID 
                 WHERE fundraiser.ACTIVE = 1`;
    connection.query(sql, (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Retrieve all categories
app.get('/categories', (req, res) => {
    const sql = 'SELECT * FROM CATEGORY';
    connection.query(sql, (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Retrieve fundraisers based on search criteria
app.get('/search', (req, res) => {
    const { organizer, city, category } = req.query;
    
    let sql = `SELECT fundraiser.*, category.NAME as CATEGORY 
                 FROM fundraiser 
                 JOIN CATEGORY ON fundraiser.CATEGORY_ID = category.CATEGORY_ID 
                 WHERE fundraiser.ACTIVE = 1`;

    const params = [];
    if (organizer) {
        sql += ` AND fundraiser.ORGANIZER = ?`;
        params.push(organizer);
    }
    if (city) {
        sql += ` AND fundraiser.CITY = ?`;
        params.push(city);
    }
    if (category) {
        sql += ` AND category.NAME = ?`;
        params.push(category);
    }

    connection.query(sql, params, (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Retrieve fundraiser details by ID
app.get('/fundraiser/:id', (req, res) => {
    const sql = `SELECT fundraiser.*, category.NAME as CATEGORY 
                 FROM fundraiser 
                 JOIN CATEGORY ON fundraiser.CATEGORY_ID = category.CATEGORY_ID 
                 WHERE fundraiser.FUNDRAISER_ID = ? AND fundraiser.ACTIVE = 1`;
    
    connection.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Admin-side: Create a new fundraiser
app.post('/fundraiser', (req, res) => {
    const { fundraiserId, organizer, caption, targetFunding, city, categoryId } = req.body;

    if (!fundraiserId || !organizer || !caption || !targetFunding || !city || !categoryId) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const sql = `INSERT INTO fundraiser (FUNDRAISER_ID, ORGANIZER, CAPTION, TARGET_FUNDING, CURRENT_FUNDING, CITY, ACTIVE, CATEGORY_ID)
                 VALUES (?, ?, ?, ?, 0, ?, 1, ?)`;

    connection.query(sql, [fundraiserId, organizer, caption, targetFunding, city, categoryId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error adding fundraiser.' });
        }
        res.json({ message: 'Fundraiser created successfully!' });
    });
});

// Admin-side: Delete a fundraiser (only if no donations are made)
app.delete('/fundraiser/:id', (req, res) => {
    const checkDonationsSql = `SELECT COUNT(*) as donationCount FROM donation WHERE FUNDRAISER_ID = ?`;

    connection.query(checkDonationsSql, [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error checking donations for fundraiser.' });
        }

        if (result[0].donationCount > 0) {
            return res.status(400).json({ message: 'Cannot delete fundraiser with donations.' });  // Return JSON instead of plain text
        }

        const sql = `DELETE FROM fundraiser WHERE FUNDRAISER_ID = ?`;

        connection.query(sql, [req.params.id], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error deleting fundraiser.' });  // Ensure this is also JSON
            }
            res.json({ message: 'Fundraiser deleted successfully.' });
        });
    });
});



// Create a new donation
app.post('/donation', (req, res) => {
    const { fundraiserId, name, amount } = req.body;

    if (!fundraiserId || !name || !amount) {
        return res.status(400).json({ message: 'All fields (fundraiserId, name, and amount) are required.' });
    }

    const sql = `INSERT INTO donation (DATE, AMOUNT, GIVER, FUNDRAISER_ID) VALUES (NOW(), ?, ?, ?)`;

    connection.query(sql, [amount, name, fundraiserId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error processing your donation.' });
        }
        res.json({ message: 'Thank you for your donation!' });
    });
});

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
