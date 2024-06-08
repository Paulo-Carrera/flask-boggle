from flask import Flask , render_template , request , redirect , session , jsonify
from boggle import Boggle
import string

boggle_game = Boggle()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'mang0juic3'


@app.route('/' , methods=['GET' , 'POST'])
def home():
    """Render the initial page to submit username and start playing."""
    if request.method == 'POST':
        # When user enters a username , save username to session and redirect to /game .
        username = request.form.get('username')
        session['username'] = username

        # Initialize game statistics in the session
        if 'plays' not in session:
            session['plays'] = 0 
        if 'highscore' not in session:
            session['highscore'] = 0
        
        return redirect('/game')
    
    # Initially , return home.html template with form to retrieve username .
    return render_template('home.html')


@app.route('/game')
def game_page():
    """Generate gameboard and form for user guesses."""
    # Generate the board and store it in session using make_board function from boggle.py 
    if 'board' not in session: 
        board = boggle_game.make_board()
        session['board'] = board
    else:
        board = session['board']
    
    return render_template('game.html', board = board , username = session.get('username'))


@app.route('/submit' , methods = ['POST' , 'GET'])
def submit_guess():
    """Handles the submission of a guess."""
    # Retrieve users guess from JSON 
    data = request.get_json()
    guess = data.get('guess' , '')
    board = session.get('board')

    # Handle case where no guess is submitted
    if not guess :
        return jsonify({'result':'no-guess'})
    
    # Take users guess and check for the word with check_valid_word function from boggle.py
    result = boggle_game.check_valid_word(board, guess)
    # Return the result , jsonified 
    return jsonify({'result':result})


@app.route('/end-game' , methods= ['POST'])
def end_game():
    """Handles the end of the game and updates the statistics."""
    data = request.get_json()
    score = data.get('score', 0)

    # Update statistics in the session
    session['plays'] += 1
    if score > session['highscore']:
        session['highscore'] = score

    return jsonify({'plays': session['plays'], 'highscore' : session['highscore']})


@app.route('/new-board')
def new_board():
    """Generates a new game board."""
    board = boggle_game.make_board()
    session['board'] = board
    return jsonify({'board': board})



if __name__ == '__main__':
    app.run(debug=True)