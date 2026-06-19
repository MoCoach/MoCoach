from flask import Flask, render_template

app = Flask(__name__)  # Flask utilise automatiquement les dossiers 'templates' et 'static' par défaut

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)