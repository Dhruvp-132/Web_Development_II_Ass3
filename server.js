const express = require("express");
const cors = require("cors");
const bodyparser = require("body-parser");
const personAPI = require("./Api-Controller");

const app = express();

// Middleware for parsing request bodies and enabling CORS
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));

// Mount the API controller at "/DataServ"
app.use("/DataServ", personAPI);  // You can access your API at http://localhost:8080/DataServ/

// Start the server on port 8080
app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
