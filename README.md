# SHM Dashboard

FastAPI backend for the Structural Health Monitoring dashboard. Connects to ThingSpeak for IoT sensor data, stores historical readings in PostgreSQL, and exposes a REST API for the admin and portal frontends. 

This backend was made as a project in 3 differnt stacks python, java, express. The python backend is uploaded here as proof of work. The video for the backend and the system design is available at my linkedin  https://www.linkedin.com/in/sachdeva-abhinav/

## Features

- **Portal API**: Public endpoints for clients to view sensor data via access codes
- **Admin API**: Protected endpoints for managing projects and access codes
- **ThingSpeak Integration**: Real-time sensor data from IoT platform
- **Data Ingestion**: Background cron job polling ThingSpeak and storing historical data
- **PostgreSQL**: Persistent storage for projects, access codes, and readings

## Local Development

### Prerequisites

- Python 3.11+
- PostgreSQL 13+
- pip

### Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or
   .\venv\Scripts\activate  # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file (copy from `env.example.txt`):
   ```bash
   cp env.example.txt .env
   ```

4. Update `.env` with your configuration:
   - `DATABASE_URL`: PostgreSQL connection string
   - `ADMIN_PASSWORD`: Password for admin login
   - `SECRET_KEY`: Random string for JWT signing
   - `CORS_ORIGINS`: Frontend URL(s)

5. Create the database:
   ```bash
   createdb shm_dashboard
   ```

6. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`

### API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deployment (Docker)

Use the root `docker-compose.yml` to run everything together:

```bash
docker-compose up --build
```

This starts:
- PostgreSQL on port 5432
- Backend on port 8000
- Frontend on port 3000

## Database Migrations

Using Alembic for migrations:

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Settings from env vars
│   ├── database.py          # SQLAlchemy setup
│   ├── auth.py              # Admin authentication
│   ├── models/              # Database models
│   ├── schemas/             # Pydantic schemas
│   ├── routers/             # API routes
│   ├── services/            # Business logic
│   └── jobs/                # Background tasks
├── alembic/                 # Database migrations
├── requirements.txt
├── Dockerfile
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `ADMIN_PASSWORD` | Password for admin login | `changeme123` |
| `SECRET_KEY` | JWT signing key | Required in production |
| `CORS_ORIGINS` | Comma-separated frontend URLs | `http://localhost:5173` |
| `THINGSPEAK_BASE_URL` | ThingSpeak API base URL | `https://api.thingspeak.com` |
| `DATA_INGESTION_INTERVAL_SECONDS` | How often to poll ThingSpeak | `30` |
