/* to load any env variables */
const envConfig = require("dotenv").config();
/* so our server can listen to requests & send back responses*/
const express = require("express");
/* to implement websocket based real-time messaging */
const Ably = require("ably");

// static() creates a new middleware to serve files from w/in a given dir
const app = express();
app.use(express.static("public"));

// if the app gets a request to the rootfolder, serve the html
app.get("/", (request, response) => {
    response.sendFile(__dirname + "/index.html");
})

// express server listens on a particular port
const listener = app.listener(process.env.PORT, () => {
    console.log("App is listening on port" + listener.address().port);
})