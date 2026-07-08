# MoCoach

***MoCoach** is Mauritius’ first centralized sports and wellness marketplace. It connects local users and tourists with verified coaches through a trusted digital platform, solving the problem of fragmented booking via WhatsApp and Facebook.*

## Getting started

```bash
pip install -r requirements.txt
python app.py
```

The API and front-end are served on `http://localhost:5678`.

## Running tests

```bash
python test.py
```

## Deployment (Railway)

1. Push the repo to GitHub.
2. Create a Railway project from the repo — `requirements.txt` auto-detects Python.
3. Add a **MySQL plugin** (provides `MYSQL_URL` env var).
4. Set `JWT_SECRET_KEY` environment variable to a random secret.
5. Deploy — the `Procfile` starts the app with `gunicorn`.
