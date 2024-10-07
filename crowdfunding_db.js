// Import mysql module
const mysql = require('mysql2');

// Define the database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Dp@08052004', 
  database: 'crowdfunding_db',	
  port: 3306 
};

// Create a function that returns a MySQL connection object
function getconnection() {
    return mysql.createConnection(dbConfig);
}

// Export the function so that other files can use it
module.exports = {
    getconnection: getconnection
};
