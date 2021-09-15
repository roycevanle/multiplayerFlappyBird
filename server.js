/* to load any env variables */
const envConfig = require("dotenv").config();
/* so our server can listen to requests & send back responses*/
const express = require("express");
/* to implement websocket based real-time messaging */
const Ably = require("ably");

// static() creates a new middleware to serve files from w/in a given dir
const app = express();
app.use(express.static("public"));

const realtime = new Ably.Realtime({
    key: process.env.ABLY_API_KEY,
});

// if the app gets a request to the rootfolder, serve the html
app.get("/", (request, response) => {
    response.sendFile(__dirname + "/index.html");
});

const uniqueId = function() {
    return "id-" + Math.random().toString(36).substr(2,16);
}

/* Issue token requests to clients sending a request to the /auth endpoint */
app.get('/auth', function (req, res) {
    var tokenParams = {
        clientId: 
    };
    //replace rest. with realtime.
    realtime.auth.createTokenRequest(tokenParams, function(err, tokenRequest) {
      if (err) {
        res.status(500).send('Error requesting token: ' + JSON.stringify(err));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(tokenRequest));
      }
    });
});

// express server listens on a particular port
const listener = app.listen(process.env.PORT, () => {
    console.log("App is listening on port " + listener.address().port);
});