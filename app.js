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
        //adds a 100px from the bottom element
        bird.style.bottom = birdBottom + 'px'
        bird.style.left = birdLeft + 'px'
    }

    startGame()


})