// if nicknames have badwords, it'll replace badwords with ***s
const profanityBaseURL = "https://www.purgomalum.com/service/plain?text=";

// dictonary for default nicknames
const nickNamesDictionary = [
    "pink crow",
    "green pigeon",
    "brown robin",
    "blue woodpecker",
    "purple sparrow",
    "yellow kingfisher",
    "gray warbler",
    "orange bulbul",
    "black drongo",
    "red seagulls",
    "beige flamingo",
    "frost eagles",
    "fuscia owl",
    "mint kite",
    "hickory parakeet",
    "tortilla beeeater",
    "wood munia",
    "violet dove",
    "eggplant peacock",
    "golden oriole",
    "magenta flycatcher",
    "mulberry quail",
    "slate magpie",
    "navy roller",
    "azure emu",
    "arctic sunbird",
    "iris starling",
    "olive rockthrush",
    "pecan barnowl",
    "carob goose",
    "coal duck",
    "grease trogon",
    "raven nightjar",
    "sepia barbet",
];

let obstacleTimers = [];
let gameStarted = false;
let gameTimerId;
let myScore = 0;
let highScore = 0;
let highScoreNickname = "player placeholder";
let myNickname;
let myClientId;
let myPublishChannel;
let gameChannel;
let gameChannelName = "flappy-game";
let allBirds = {};
let topScoreChannel;
let topScoreChannelName = "flappy-top-score";


// stores nickname in localstorage (play again & again)
// if we save nickname in cookies, when user refreshes, we can get again
if (localStorage.getItem("flappy-nickname")) {
    myNickname = localStorage.getItem("flappy-nickname");
} else { // else we get randomized name
    myNickname = nickNamesDictionary[Math.floor(Math.random() * 34)];
    localStorage.setItem("flappy-nickname", myNickname);
}

// instantiate the ably library
// we setup the auth server, /auth cause server same place as app
// otherwise we'd need to provide complete url of auth server here
const realtime = new Ably.Realtime({
    authUrl: "/auth",
})



//waits for all our html to load. We pass through an event
document.addEventListener('DOMContentLoaded', () => {
    // . for a class selector
    // here we're selecting our elements so we can manipulate
    const sky = document.querySelector('.sky');
    const bird = document.querySelector('.bird')
    const gameDisplay = document.querySelector('.game-container')
    const ground = document.querySelector('.ground-moving');
    let nicknameInput = document.getElementById('nickname-input');
    let updateNicknameBtn = document.getElementById('update-nickname');
    let scoreLabel = document.getElementById('score-label');
    let topScoreLabel = document.getElementById('top-label');
    let scoreList = document.getElementById('score-list');

    let birdLeft = 220
    let birdBottom = 350
    let gravity = 2
    let gap = 440
    let isGameOver = false

    // method to filter nicknames for badwords
    const filterNickname = async (nicknameText) => {
        const http = new XMLHttpRequest();
        let encodedText = encodeURIComponent(nicknameText);
        http.open("GET", profanityBaseURL + encodedText + "&fill_text=***");
        http.send();
        http.onload = () => {
            myNickname = http.responseText;
            nicknameInput.value = myNickname;
            localStorage.setItem("flappy-nickname", myNickname);
        };
    };

    // adding html logic for highscore & nickname input
    topScoreLabel.innerHTML =
        "Top score - " + highScore + "pts by " + highScoreNickname;
    nicknameInput.value = myNickname;

    // if you update your nickname, it sends to filter to check (method above)
    updateNicknameBtn.addEventListener("click", () => {
        filterNickname(nicknameInput.value);
    });

    // prevent default behavior when spacebar/any other key pressed (prevents scroll down)
    window.addEventListener("keydown", function (e) {
        if (e.keyCode == 32 && e.target == document.body) {
            e.preventDefault();
        }
    });

    // once user is connected to Ably
    // set clientId & publish channel of user
    // set their gameChannel to cur game channel
    realtime.connection.once("connected", () => {
        myClientId = realtime.auth.clientId;
        myPublishChannel = realtime.channels.get("bird-position-" + myClientId);
        topScoreChannel = realtime.channels.get(topScoreChannelName, {
            params: { rewind: 1 },
        });
        topScoreChannel.subscribe((msg) => {
            highScore = msg.data.score;
            highScoreNickname = msg.data.nickname;
            topScoreLabel.innerHTML =
                "Top score - " + highScore + "pts by " + highScoreNickname;
            topScoreChannel.unsubscribe();
        });
        gameChannel = realtime.channels.get(gameChannelName);

        // the game doesn't start directly on page, waits for you to click on game area
        gameDisplay.onclick = function () {
            if (!gameStarted) {
                gameStarted = true;
                gameChannel.presence.enter({
                    nickname: myNickname,
                })
                sendPositionUpdates();
                showOtherBirds();

                // register an event listener for keydown, then it'll call the control method (below)
                document.addEventListener("keydown", control);

                // start game (below) every 20s to up gravity
                gameTimerId = setInterval(startGame, 20);
            }
        };
    });

    function startGame() {
        birdBottom -= gravity;
        bird.style.bottom = birdBottom + "px";
        bird.style.left = birdLeft + "px";

        // makes it looks like smooth movement rather than laggy cause of network updates
        for (item in allBirds) {
            if (allBirds[item].targetBottom) {
                let tempBottom = parseInt(allBirds[item].el.style.bottom);
                tempBottom += (allBirds[item].targetBottom - tempBottom) * 0.5;
                allBirds[item].el.style.bottom = tempBottom + "px";
            }
        }
    }

    function control(e) {
        if (e.keyCode === 32 && !isGameOver) { //keyCode 32 is spacebar
            jump()
        }
    }

    function jump() {
        // add an upper echelon so that we don't jump off the screen
        if (birdBottom < 500) birdBottom += 50
        bird.style.bottom = bird + 'px'
    }

    function generateObstacles(randomHeight) {
        if (!isGameOver) {
            let obstacleLeft = 500
            let obstacleBottom = randomHeight;
            // let randomHeight = Math.random() * 60

            // how to create divs (which we'll use as obstacles)
            // add the class of obstacle to this obstacle object (to this custom div)
            const obstacle = document.createElement("div");
            const topObstacle = document.createElement("div");
            obstacle.classList.add("obstacle");
            topObstacle.classList.add("topObstacle");
            gameDisplay.appendChild(obstacle)
            gameDisplay.appendChild(topObstacle)
            obstacle.style.left = obstacleLeft + 'px'
            topObstacle.style.left = obstacleLeft + 'px'
            obstacle.style.bottom = obstacleBottom + 'px'
            topObstacle.style.bottom = obstacleBottom + gap + 'px'

            // used to move obstacle (below) every 20ms (to emulate animation)
            let timerId = setInterval(moveObstacle, 20);
            obstacleTimers.push(timerId);

            function moveObstacle() {
                obstacleLeft -= 2
                obstacle.style.left = obstacleLeft + 'px'
                topObstacle.style.left = obstacleLeft + 'px'

                // if the obstacle reached half the area where the bird is
                // we increase the score label
                if (obstacleLeft === 220) {
                    myScore++;
                    setTimeout(() => {
                        sortLeaderboard();
                    }, 400);
                }

                // when obstacle is far to left, remove it from gameDisplay
                if (obstacleLeft === -50) {
                    clearInterval(timerId);
                    gameDisplay.removeChild(obstacle);
                    gameDisplay.removeChild(topObstacle);
                }

                // if bird reached the floor || hits an obstacle, gamveOver
                if (
                    (obstacleLeft > 200 && obstacleLeft < 280 && birdLeft === 220 &&
                    (birdBottom < obstacleBottom + 210 ||
                        birdBottom > obstacleBottom + gap - 150)) ||
                    birdBottom === 0
                ) {
                    for (timer in obstacleTimers) {
                        clearInterval(obstacleTimers[timer]);
                    }
                    sortLeaderboard();
                    gameOver();
                }
            }
        }
    }

    function gameOver() {
        scoreLabel.innerHTML += " | Game Over";
        clearInterval(gameTimerId);
        isGameOver = true;
        document.removeEventListener("keydown", control);
        ground.classList.add("ground");
        ground.classList.remove("ground-moving");
        realtime.connection.close();
    }

    // client connected & start game by clicking (above)
    // let client start publishing through their channel
    // if their game is over, detach their published channel
    function sendPositionUpdates() {
        let publishTimer = setInterval(() => {
            myPublishChannel.publish("pos", {
                bottom: parseInt(bird.style.bottom),
                nickname: myNickname,
                score: myScore,
            });
            if (isGameOver) {
                clearInterval(publishTimer);
                myPublishChannel.detach();
            }
        }, 100);
    }

    function showOtherBirds() {
        gameChannel.subscribe("game-state", (msg) => {
            for (let item in msg.data.birds) {
                if (item != myClientId) { //for any bird not my own
                    let newBottom = msg.data.birds[item].bottom;
                    let newLeft = msg.data.birds[item].left;
                    let isDead = msg.data.birds[item].isDead;
                    // if bird exists locally & not dead
                    if (allBirds[item] && !isDead) {
                        allBirds[item].targetBottom = newBottom;
                        allBirds[item].left = newLeft;
                        allBirds[item].isDead = msg.data.birds[item].isDead;
                        allBirds[item].nickname = msg.data.birds[item].nickname;
                        allBirds[item].score = msg.data.birds[item].score;
                        // if bird dead, we remove it & delete from local var
                    } else if (allBirds[item] && isDead) {
                        sky.removeChild(allBirds[item].el);
                        delete allBirds[item];
                    } else { // if bird doesn't exist, create new obj
                        if (!isGameOver && !isDead) {
                            allBirds[item] = {};
                            allBirds[item].el = document.createElement("div");
                            allBirds[item].el.classList.add("other-bird");
                            sky.appendChild(allBirds[item].el);
                            allBirds[item].el.style.bottom = newBottom + "px";
                            allBirds[item].el.style.left = newLeft + "px";
                            allBirds[item].isDead = msg.data.birds[item].isDead;
                            allBirds[item].nickname = msg.data.birds[item].nickname;
                            allBirds[item].score = msg.data.birds[item].score;
                        }
                    }
                    // if i got an update for my own bird, i update my local arr
                } else if (item == myClientId) {
                    allBirds[item] = msg.data.birds[item];
                }
            }
            if (msg.data.highScore > highScore) {
                highScore = msg.data.highScore;
                highScoreNickname = msg.data.highScoreNickname;
                topScoreLabel.innerHTML =
                    "Top score - " + highScore + "pts by " + highScoreNickname;
            }
            // moved here so every player has obstacles in sync
            if (msg.data.launchObstacle == true && !isGameOver) {
                generateObstacles(msg.data.obstacleHeight);
            }
        })
    }

    function sortLeaderboard() {
        scoreLabel.innerHTML = "Score: " + myScore;
        let listItems = "";
        let leaderBoard = new Array();
        for (let item in allBirds) {
            leaderBoard.push({
                nickname: allBirds[item].nickname,
                score: allBirds[item].score,
            });
        }
        leaderBoard.sort((a, b) => {
            b.score - a.score;
        });
        leaderBoard.forEach((bird) => {
            listItems +=
                "<li class='score-item'><span class='name'>" +
                bird.nickname +
                "</span><span class='points'>" +
                bird.score +
                "pts</span></li>";
        });
        scoreList.innerHTML = listItems;
    }

})