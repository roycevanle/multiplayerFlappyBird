const envConfig = require("dotenv").config();//to load any env variables
const express = require("express");//so server can listen to requests & send back responses
const Ably = require("ably");//to implement websocket based real-time messaging
const gameChannelName = "flappy-game"
let gameChannel;
let birdCount = 0;
let gameTicker;
let isGameTickerOn = false;
let gameStateObj;
let birds = {};
let highScore = 0;
let highScoreNickname = "player placeholder";
let birdChannels = {}; //stores all bird/player channels

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
        clientId: uniqueId(), 
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

realtime.connection.once("connected", () => {
    gameChannel = realtime.channels.get(gameChannelName)
    // .presence used to detect status updates (usr join, leave, dies, etc.)
    gameChannel.presence.subscribe("enter", (msg) => {
      if(++birdCount === 1 && !isGameTickerOn){
        gameTicker = setInterval(startGameTick, 100);
        isGameTickerOn = true;
      }
      
      // used identify each entry by unique clientId w/ some data
      birds[msg.clientId] = {
        id: msg.clientId,
        bottom: 350,
        isDead: false,
        nickname: msg.data.nickname,
        score:0,
      };

      subscribeToPlayerInput(msg.clientId);
    });

    // game channel subscribes to leave events
    gameChannel.presence.subscribe('leave', (msg) => {
      if(birds[msg.clientId] != undefined) { // if client exists...
        birdCount--;
        birds[msg.clientId].isDead = true;
        setTimeout(() => {
          delete birds[msg.clientId];
        }, 500);
        if (birdCount < 1) { // no players playing so no need to publish
          isGameTickerOn = false;
          clearInterval(gameTicker)
        }
      }
    })
});

// once connected, will create a channel
function subscribeToPlayerInput(id) {
  birdChannels[id] = realtime.channels.get("bird-position-" + id);
  birdChannels[id].subscribe("pos", (msg) => { //subscribe to event pos
    if (birds[id]) { //if that bird still exists
      birds[id].bottom = msg.data.bottom;
      birds[id].nickname = msg.data.nickname;
      birds[id].score = msg.data.score;
      if(msg.data.score > highScore) {
        highScore = msg.data.score;
        highScoreNickname = msg.data.nickname;
      }
    }
  })
}


function startGameTick() {
  // this is what we want to publish in every new update to all players
  gameStateObj = {
    birds: birds,
    highScore: highScore,
    highScoreNickname: highScoreNickname,
  };
  gameChannel.publish("game-state", gameStateObj);
}