//waits for all our html to load. We pass through an event
document.addEventListener('DOMContentLoaded' , () => {
    // . for a class selector
    // here we're selecting our elements so we can manipulate
    const bird = document.querySelector('.bird')
    const gameDisplay = document.querySelector('.game-container')
    const ground = document.querySelector('.ground')

    let birdLeft = 220
    let birdBottom = 100
    let gravity = 2

    function startGame() {
        birdBottom -= gravity
        //adds a 100px from the bottom element
        bird.style.bottom = birdBottom + 'px'
        bird.style.left = birdLeft + 'px'
    }

    // we invoke startGame every 20ms
    let timerId = setInterval(startGame, 20)
    // if we want to stop, we do clearInterval(timerId)

    function control(e) {
        if(e.keyCode === 32) { //keyCode 32 is spacebar
            jump()
        }
        // DEBUGGING feature I added to stop bird
        if(e.keyCode === 38) {
            clearInterval(timerId)
        }
    }

    function generateObstacle() {
        let obstacleLeft = 500
        // will generate div height of 1-60 from the ground
        let randomHeight = Math.random() * 60
        let obstacleBottom = randomHeight
        // how to create divs (which we'll use as obstacles)
        // add the class of obstacle to this obstacle object (to this custom div)
        const obstacle = document.createElement('div')
        obstacle.classList.add('obstacle')
        gameDisplay.appendChild(obstacle)
        obstacle.style.left = obstacleLeft + 'px'
        obstacle.style.bottom = obstacleBottom + 'px'

        function moveObstacle() {
            obstacleLeft -= 2
            obstacle.style.left = obstacleLeft + 'px'
            
            if (obstacleLeft === -60) {
                clearInterval(timerId)
                gameDisplay.removeChild(obstacle)
            }
        }

        // setInterval is generally used for animation (less delay) than setTimeout
        // move obstacle to the left every 20ms
        let timerId = setInterval(moveObstacle, 20)
        // setTimeout calls a function after a specified number of ms
        setTimeout(generateObstacle, 3000)
    }
    generateObstacle();

    function jump() {
        // add an upper echelon so that we don't jump off the screen
        if (birdBottom < 500) birdBottom += 50
        bird.style.bottom = bird + 'px'
        console.log(birdBottom)
    }

    // keyup event is fired when a key is released (not when up arrow pressed)
    document.addEventListener('keyup', control);


})