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

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
