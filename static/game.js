$(document).ready(function() {

    // Initialize score and Set of guessed words, so the user cannot gain points from the same guess more than once.
    let score = 0;
    let guessedWords = new Set();
    let timerInterval; // Define timerInterval outside of the startTimer function
    let timeLeft = 60;
    const timerElement = $('#timer');

    // Function to start or reset the timer
    function startTimer() {
        clearInterval(timerInterval); // Clear any existing timer
        timeLeft = 60; // Reset time to 60 seconds
        timerInterval = setInterval(function() {
            timeLeft--;
            timerElement.text(`Time Left: ${timeLeft}s`);
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                $('#guess-form input, #guess-form button').prop('disabled', true);
                $('#result').text("Time's up!");
                $('#play-again').show(); // Show the play again button

                // Send the final score to the server
                axios.post('/end-game', {score: score}, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(function(response) {
                    const plays = response.data.plays;
                    const highscore = response.data.highscore;
                    $('#plays').text(`Times Played: ${plays}`);
                    $('#highscore').text(`High Score: ${highscore}`);
                })
                .catch(function(error) {
                    console.log(error);
                });
            }
        }, 1000);
    }

    // Start the timer when the page is ready
    startTimer();

    $('#guess-form').on('submit', function(event) {
        event.preventDefault();
        let guess = $('#guess-input').val().toLowerCase(); // Normalize case for consistency

        // If user already guessed the word, return
        if (guessedWords.has(guess)) {
            $('#result').text(`You've already guessed the word "${guess}".`);
            $('#guess-input').val(''); // Clear the input field
            return;
        }

        axios.post('/submit', {guess: guess}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            const result = response.data.result;
            $('#result').text(result); // Display the result of the user's guess

            if (result === 'Nice!') {
                guessedWords.add(guess); // Add the word to the set of guessed words
                score += guess.length; // Add the length of the word to the score
                $('#score').text(`Score: ${score}`); // Display score
                startTimer(); // Restart the timer
            }

            $('#guess-input').val(''); // Clear the input field
        })
        .catch(function(error) {
            console.log(error);
            $('#guess-input').val(''); // Clear the input field in case of error
        });
    });

    // Handle the play again button click
    $('#play-again').on('click', function() {
        // Hide the play again button
        $(this).hide();

        // Reset the game state
        score = 0;
        guessedWords = new Set();
        $('#score').text('Score: 0');
        $('#result').text('');
        $('#guess-form input, #guess-form button').prop('disabled', false);

        // Fetch a new board from the server
        axios.get('/new-board')
        .then(function(response) {
            const board = response.data.board;
            const gameboard = $('.gameboard');
            gameboard.empty(); // Clear the existing board

            // Generate the new board
            board.forEach(function(row) {
                const tr = $('<tr></tr>');
                row.forEach(function(letter) {
                    const td = $('<td></td>').text(letter);
                    tr.append(td);
                });
                gameboard.append(tr);
            });

            // Restart the timer
            startTimer();
        })
        .catch(function(error) {
            console.log(error);
        });
    });
});
