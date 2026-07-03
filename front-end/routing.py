from flask import Flask, render_template

import os
app = Flask(__name__, template_folder=os.path.dirname(os.path.abspath(__file__)))

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/all-coaches.html')
def all_coaches():
    return render_template('all-coaches.html')

@app.route('/coach-register.html')
def coach_register():
    return render_template('coach-register.html')

if __name__ == '__main__':
    app.run(debug=True, port=5679)