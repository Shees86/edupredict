# EduPredict — Student Dropout Risk & Academic Analytics Portal

A role-based academic analytics platform that predicts student dropout
risk, recommends academic pathways (field, university, GPA trend), and
visualizes institutional data — built on Hadoop/HDFS, PySpark, Flask,
MongoDB, and React.

## Project structure

```
EduPredict/
├── backend/                    Flask API
│   ├── app.py                  All routes (auth, predictions, alerts, feedback, analytics)
│   ├── db.py                   MongoDB access layer
│   ├── ml_predictor.py         Dropout-risk model wrapper
│   ├── field_predictor.py      Matric % → field/college predictor wrapper
│   ├── university_predictor.py Intermediate % → university predictor wrapper
│   ├── cgpa_predictor.py       Next-semester GPA trend predictor wrapper
│   ├── analytics.py            Correlation & trend analysis
│   ├── *.pkl / *_metrics.json  Pre-trained models (ready to use, no retraining needed)
│   ├── requirements.txt
│   └── Procfile                Render start command
│
├── dashboard-app/              React frontend (Vite) — THE ONLY frontend copy
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── EduPredict-Dashboard.jsx   All dashboard UI + logic
│
├── ml/                          Training scripts (run once, already done — outputs are in backend/)
│   ├── generate_sample_data.py
│   ├── train_model.py
│   ├── generate_field_prediction_data.py
│   ├── train_field_model.py
│   ├── generate_university_prediction_data.py
│   ├── train_university_model.py
│   └── train_cgpa_model.py
│
├── spark/
│   └── pyspark_pipeline.py     HDFS-based cleaning, feature engineering, anomaly detection
│
├── data/                        Sample datasets (CSV)
├── hdfs_notes/HDFS_SETUP.md    Pseudo-distributed Hadoop setup guide
├── DEPLOYMENT.md                Cloud deployment guide (MongoDB Atlas + Render + Vercel)
└── README.md                    This file
```

> **Note:** earlier drafts of this project had a duplicate `frontend/`
> folder alongside `dashboard-app/src/`. That has been removed —
> `dashboard-app/src/EduPredict-Dashboard.jsx` is now the single
> source of truth for the frontend.

## Features

| Area | Details |
|---|---|
| Authentication | Role-based sessions: Admin, Teacher, Student, Analyst |
| Data ingestion | CSV upload, web forms |
| Storage | Hadoop HDFS (pseudo-distributed) |
| Processing | PySpark — cleaning, feature engineering, anomaly detection |
| ML — dropout risk | Random Forest classifier |
| ML — field/college predictor | Matric % → recommended field + college tier |
| ML — university predictor | Intermediate % → suggested program + university tier |
| ML — CGPA trend predictor | Current performance → predicted next-semester GPA |
| Visualization | React + Recharts, 4 role-specific dashboards |
| Real-time alerts | Server-Sent Events, pushed to Admin/Teacher/Analyst |
| Feedback & support | In-app widget, admin review queue |
| Correlation analysis | Feature-vs-dropout-risk correlation, cohort trend buckets |

## Local setup

### 1. Prerequisites
- Python 3.10+, Node.js 18+, MongoDB Community Server
- WSL2 + Ubuntu (for Hadoop, if on Windows)
- Java 11, Hadoop 3.3.6, PySpark (for the HDFS pipeline)

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
python app.py              # runs on http://localhost:5000
```

### 3. Frontend
```bash
cd dashboard-app
npm install
npm run dev                # runs on http://localhost:5173
```

### 4. HDFS / Spark (optional locally, required for the course's Big Data component)
See `hdfs_notes/HDFS_SETUP.md` for the full pseudo-distributed setup.
Summary:
```bash
hdfs namenode -format
start-dfs.sh
hdfs dfs -mkdir -p /edupredict/raw
hdfs dfs -put data/students_sample.csv /edupredict/raw/
python3 spark/pyspark_pipeline.py
```

### Creating accounts (no seed data — everything is real)

There is no seed script and no demo accounts. The database starts
completely empty. To get started:

- **Teacher / Student / Analyst**: self-register from the login
  screen's "Create account" tab.
- **Admin**: for security, admin accounts can't be self-registered
  through the UI (this prevents anyone from granting themselves
  admin access). Instead, set an `ADMIN_SETUP_KEY` environment
  variable on the backend (any long random string), then create the
  first admin with:
  ```bash
  curl -X POST https://<your-backend-url>/api/auth/register-admin \
    -H "Content-Type: application/json" \
    -d '{"username":"youradmin","password":"yourpassword","full_name":"Your Name","setup_key":"<the ADMIN_SETUP_KEY value>"}'
  ```
  Keep the setup key private — anyone who has it can create admin
  accounts. Remove or rotate it after initial setup if you want to
  fully lock this down.

## Cloud deployment (for demoing without local setup)

See `DEPLOYMENT.md` for the full step-by-step guide covering MongoDB
Atlas (database), Render (backend), and Vercel (frontend) — all free
tiers. Once deployed, the whole app runs from a single URL in any
browser, no installation required.

## Retraining the models (only needed if the underlying data changes)
```bash
cd ml
python3 generate_sample_data.py && python3 train_model.py
python3 generate_field_prediction_data.py && python3 train_field_model.py
python3 generate_university_prediction_data.py && python3 train_university_model.py
python3 train_cgpa_model.py
```
Each script writes its `.pkl` / `_metrics.json` output directly into `backend/`.

## API reference

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/auth/register` | POST | any | Create a Teacher/Student/Analyst account |
| `/api/auth/register-admin` | POST | requires setup key | Create an Admin account (gated) |
| `/api/auth/login` | POST | any | Log in, sets session cookie |
| `/api/auth/logout` | POST | any | Log out |
| `/api/auth/me` | GET | any | Current session user |
| `/api/students` | GET/POST | admin/teacher/analyst | List / upsert students |
| `/api/students/<id>` | GET | all | One student's record |
| `/api/data/ingest` | POST | admin/teacher | Batch CSV upload |
| `/api/predict` | POST | admin/teacher/analyst | Dropout-risk prediction |
| `/api/predict/field` | POST | any | Field & college predictor |
| `/api/predict/university` | POST | any | University admission predictor |
| `/api/predict/cgpa` | POST | any | Next-semester GPA predictor |
| `/api/alerts` | GET | admin/teacher/analyst | Unresolved high-risk alerts |
| `/api/alerts/stream` | GET (SSE) | any | Live alert stream |
| `/api/dashboard/summary` | GET | admin/teacher/analyst | KPI numbers |
| `/api/model/metrics` | GET | admin/analyst | Dropout model metrics |
| `/api/model/field-metrics` | GET | admin/analyst | Field model metrics |
| `/api/analytics/correlations` | GET | admin/analyst | Feature correlation with dropout risk |
| `/api/analytics/trend` | GET | admin/analyst | Cohort risk trend |
| `/api/feedback` | GET/POST | admin (GET) / any (POST) | Feedback & support |
| `/api/health` | GET | — | Health check |

## Requirement coverage

| Course requirement | Status | Where |
|---|---|---|
| Role-based auth | Done | `backend/app.py` (`login_required`) |
| Data ingestion (diverse formats) | Done | `/api/data/ingest`, web forms |
| HDFS storage | Done | `hdfs_notes/HDFS_SETUP.md`, `spark/pyspark_pipeline.py` |
| Parallel processing | Done | PySpark pipeline |
| Anomaly/pattern detection | Done | Spark anomaly flags, correlation analysis |
| Real-time processing | Done | `/api/alerts/stream` (SSE) |
| ML — performance/dropout/course-demand | Done | Dropout model + field/university/CGPA predictors |
| Data visualization | Done | React + Recharts dashboards |
| Notifications & alerts | Done | Threshold alerts, real-time push |
| Feedback & support | Done | In-app widget |
