const express = require("express");
const dcon = require("./crowdfunding_db");  // Import database connection module
const router = express.Router();

// Get the database connection once, outside of the routes
const connection = dcon.getconnection();

// Handle errors for database connection
connection.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database.');
});

// Retrieve all active fundraisers including category
router.get('/fundraisers', (req, res) => {
    const sql = `SELECT fundraiser.*, category.NAME as CATEGORY 
                 FROM fundraiser 
                 JOIN CATEGORY ON fundraiser.CATEGORY_ID = category.CATEGORY_ID 
                 WHERE fundraiser.ACTIVE = 1`;
    connection.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error retrieving fundraisers' });
        }
        res.json(result);
    });
});

// Retrieve all categories
router.get('/categories', (req, res) => {
    const sql = 'SELECT * FROM CATEGORY';
    connection.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error retrieving categories' });
        }
        res.json(result);
    });
});

// Search for fundraisers based on organizer, city, or category
router.get('/search', (req, res) => {
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
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error searching fundraisers' });
        }
        res.json(result);
    });
});

// Retrieve fundraiser details by ID
router.get('/fundraiser/:id', (req, res) => {
    const sql = `SELECT fundraiser.*, category.NAME as CATEGORY 
                 FROM fundraiser 
                 JOIN CATEGORY ON fundraiser.CATEGORY_ID = category.CATEGORY_ID 
                 WHERE fundraiser.FUNDRAISER_ID = ? AND fundraiser.ACTIVE = 1`;

    connection.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error retrieving fundraiser' });
        }
        res.json(result);
    });
});

// Admin-side: Create a new fundraiser
router.post('/fundraiser', (req, res) => {
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

// Admin-side: Delete a fundraiser
router.delete('/fundraiser/:id', (req, res) => {
    const checkDonationsSql = `SELECT COUNT(*) as donationCount FROM donation WHERE FUNDRAISER_ID = ?`;

    connection.query(checkDonationsSql, [req.params.id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error checking donations for fundraiser.' });
        }

        if (result[0].donationCount > 0) {
            return res.status(400).json({ message: 'Cannot delete fundraiser with donations.' });
        }

        const sql = `DELETE FROM fundraiser WHERE FUNDRAISER_ID = ?`;

        connection.query(sql, [req.params.id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error deleting fundraiser.' });
            }
            res.json({ message: 'Fundraiser deleted successfully.' });
        });
    });
});

// Admin-side: Update an existing fundraiser
router.put('/fundraiser/:id', (req, res) => {
    const { organizer, caption, targetFunding, city, categoryId } = req.body;

    if (!organizer || !caption || !targetFunding || !city || !categoryId) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const sql = `UPDATE fundraiser 
                 SET ORGANIZER = ?, CAPTION = ?, TARGET_FUNDING = ?, CITY = ?, CATEGORY_ID = ?
                 WHERE FUNDRAISER_ID = ?`;

    connection.query(sql, [organizer, caption, targetFunding, city, categoryId, req.params.id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error updating fundraiser.' });
        }
        res.json({ message: 'Fundraiser updated successfully!' });
    });
});

// Create a new donation
router.post('/donation', (req, res) => {
    const { fundraiserId, name, amount } = req.body;

    if (!fundraiserId || !name || !amount) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    if (amount < 5) {
        return res.status(400).json({ message: 'Minimum donation amount is 5 AUD.' });
    }

    const sql = `INSERT INTO donation (DATE, AMOUNT, GIVER, FUNDRAISER_ID) VALUES (NOW(), ?, ?, ?)`;

    connection.query(sql, [amount, name, fundraiserId], (err, result) => {
        if (err) {
            console.error('Error processing donation:', err);
            return res.status(500).json({ message: 'An error occurred while processing your donation.' });
        }
        res.json({ message: 'Thank you for your donation!' });
    });
});

module.exports = router;
