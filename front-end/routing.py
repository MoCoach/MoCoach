from flask import Flask, render_template

app = Flask(__name__)  # Flask automatically uses the 'templates' and 'static' folders by default

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)