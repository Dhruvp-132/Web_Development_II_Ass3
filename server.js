const express = require("express");
const connection = require('./crowdfunding_db');
const cors = require('cors');  // Import the cors middleware
const app = express();

// Enable CORS for all routes
app.use(cors());

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

    // Using parameterized queries to prevent SQL injection
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
    const { organizer, caption, targetFunding, city, categoryId } = req.query;

    const sql = `INSERT INTO fundraiser (ORGANIZER, CAPTION, TARGET_FUNDING, CURRENT_FUNDING, CITY, ACTIVE, CATEGORY_ID) 
                 VALUES (?, ?, ?, 0, ?, 1, ?)`;

    connection.query(sql, [organizer, caption, targetFunding, city, categoryId], (err, result) => {
        if (err) throw err;
        res.send("Fundraiser created successfully");
    });
});
// Admin-side: Update an existing fundraiser (using query parameters)
app.put('/fundraiser/:id', (req, res) => {
    const { organizer, caption, targetFunding, city, categoryId } = req.query;
    const sql = `UPDATE fundraiser 
                 SET ORGANIZER = ?, CAPTION = ?, TARGET_FUNDING = ?, CITY = ?, CATEGORY_ID = ?
                 WHERE FUNDRAISER_ID = ?`;

    connection.query(sql, [organizer, caption, targetFunding, city, categoryId, req.params.id], (err, result) => {
        if (err) throw err;
        res.send("Fundraiser updated successfully");
    });
});

// Admin-side: Delete a fundraiser (only if no donations are made)
app.delete('/fundraiser/:id', (req, res) => {
    const checkDonationsSql = `SELECT COUNT(*) as donationCount FROM donation WHERE FUNDRAISER_ID = ?`;

    connection.query(checkDonationsSql, [req.params.id], (err, result) => {
        if (err) throw err;

        if (result[0].donationCount > 0) {
            return res.status(400).send("Cannot delete fundraiser with donations");
        }

        const sql = `DELETE FROM fundraiser WHERE FUNDRAISER_ID = ?`;

        connection.query(sql, [req.params.id], (err, result) => {
            if (err) throw err;
            res.send("Fundraiser deleted successfully");
        });
    });
});


// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server is running on port 3306');
});
