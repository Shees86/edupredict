# EduPredict — Student Dropout Risk & Academic Analytics Platform

A role-based academic analytics platform that predicts student dropout
risk, recommends academic pathways (field, university, GPA trend), and
visualizes institutional data — built with Flask, MongoDB, and React.
An optional offline Hadoop/HDFS and PySpark pipeline is included for
data-processing demonstrations; it is not part of the live application.

## Project structure

```
EduPredict/
├── backend/                    Flask API
│   ├── app.py                  App factory — registers all route blueprints
│   ├── blueprints/             Route modules: auth, admin, students,
│   │                           predictions, alerts, dashboard, feedback, engagement
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
├── dashboard-app/              React frontend (Vite)
│   └── src/
│       ├── App.jsx, main.jsx
│       ├── EduPredict-Dashboard.jsx   Landing page, auth, top-level layout
│       └── dashboard/
│           ├── shared.jsx      API helpers, theme, shared UI components
│           ├── predictors.jsx  Field/university/CGPA predictor widgets
│           └── views/          Per-role dashboards (Admin, Teacher, Student, Analyst)
│
├── ml/                          Training scripts (outputs already committed in backend/)
├── spark/pyspark_pipeline.py    Optional offline HDFS cleaning and analysis pipeline
├── data/                        Sample datasets (CSV)
└── docs/
    ├── DEPLOYMENT.md            MongoDB Atlas + Render + Vercel deployment guide
    ├── SECURITY.md              Security design notes
    └── HDFS_SETUP.md            Pseudo-distributed Hadoop setup
```

## Features

| Area | Details |
|---|---|
| Authentication | Role-based sessions: Admin, Teacher, Student, Analyst; optional TOTP 2FA |
| Data ingestion | CSV/JSON upload, web forms |
| Live application storage | MongoDB |
| Optional offline processing | PySpark on HDFS — cleaning, feature engineering, anomaly detection |
| ML — dropout risk | Random Forest classifier |
| ML — field/college predictor | Matric % → recommended field + college tier |
| ML — university predictor | Intermediate % → suggested program + university tier |
| ML — CGPA trend predictor | Current performance → predicted next-semester GPA |
| Visualization | React + Recharts, 4 role-specific dashboards |
| Real-time alerts | Server-Sent Events, pushed to Admin/Teacher/Analyst |
| Cohort analysis | Correlation analysis, risk trends, side-by-side cohort comparison |
| Student engagement | Progress goals, achievement badges, in-app messaging |
| Admin controls | Role-approval workflow, audit log, feedback queue |

## Local setup

### Prerequisites
- Python 3.10+, Node.js 18+, MongoDB Community Server
- Java 11, Hadoop 3.3.6, PySpark (only for the optional offline HDFS pipeline)

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py              # http://localhost:5000
```

### Frontend
```bash
cd dashboard-app
npm install
npm run dev                # http://localhost:5173
```

### Optional offline HDFS / Spark pipeline

This is a standalone data-processing demonstration, not a prerequisite or
part of the live app's data path. It reads the sample CSV from HDFS and
writes cleaned Parquet output. `ml/train_model.py` does not consume that
Parquet output: it always trains from `data/students_sample.csv`. The live
backend loads the resulting model and encoder pickle files from `backend/`
to score predictions.

See `docs/HDFS_SETUP.md` for the full pseudo-distributed setup. Summary:
```bash
hdfs namenode -format
start-dfs.sh
hdfs dfs -mkdir -p /edupredict/raw
hdfs dfs -put data/students_sample.csv /edupredict/raw/
python3 spark/pyspark_pipeline.py
```

### Creating accounts

There's no seed data — the database starts empty.

- **Teacher / Analyst**: self-register from the login screen (admin approval required before login).
- **Student**: Student ID must already be on the roster, signup email must match the email on that roster row when one is stored, and an admin must approve the account before login.
- **Admin**: gated behind an `ADMIN_SETUP_KEY` environment variable (so
  no one can grant themselves admin through the UI). Set the variable,
  then:
  ```bash
  curl -X POST https://<backend-url>/api/auth/register-admin \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"...","full_name":"...","setup_key":"<ADMIN_SETUP_KEY>"}'
  ```

## Cloud deployment

See `docs/DEPLOYMENT.md` for the full guide — MongoDB Atlas, Render,
and Vercel, all on free tiers.

## Retraining the models

```bash
cd ml
python3 generate_sample_data.py && python3 train_model.py
python3 generate_field_prediction_data.py && python3 train_field_model.py
python3 generate_university_prediction_data.py && python3 train_university_model.py
python3 train_cgpa_model.py
```
Each script writes its `.pkl` / `_metrics.json` output into `backend/`.
The dropout training script reads `data/students_sample.csv`; the optional
Spark pipeline's Parquet output is not used for training. The live backend
scores requests with the saved pickle model and encoders, without running
Spark or Hadoop.

## API reference

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/auth/register` | POST | any | Create a Teacher/Student/Analyst account |
| `/api/auth/register-admin` | POST | setup key required | Create an Admin account (gated) |
| `/api/auth/login` | POST | any | Log in, sets session cookie |
| `/api/auth/logout` | POST | any | Log out |
| `/api/auth/me` | GET | any | Current session user |
| `/api/students` | GET | admin/teacher/analyst | Admin access is unrestricted; teachers are limited to their assigned school and class, analysts to their assigned school |
| `/api/students` | POST | admin/teacher | Admin access is unrestricted; teachers can only create or update records in their assigned class |
| `/api/students/<id>` | GET | all | One student's record; staff access follows their school/class assignment |
| `/api/admin/approve/<username>` | POST | admin | Assign teachers a school and class, and analysts a school, while approving their account |
| `/api/cohort/compare` | GET | admin/analyst | Compare two student cohorts |
| `/api/data/ingest` | POST | admin/teacher | Batch CSV/JSON upload; teacher uploads are limited to their assigned class |
| `/api/predict` | POST | admin/teacher/analyst | Dropout-risk prediction |
| `/api/predict/field` | POST | any | Field & college predictor |
| `/api/predict/university` | POST | any | University admission predictor |
| `/api/predict/cgpa` | POST | any | Next-semester GPA predictor |
| `/api/alerts` | GET | admin/teacher/analyst | Unresolved high-risk alerts |
| `/api/alerts/stream` | GET (SSE) | any | Live alert stream |
| `/api/dashboard/summary` | GET | admin/teacher/analyst | KPI numbers |
| `/api/model/metrics` | GET | admin/analyst | Dropout model metrics |
| `/api/model/field-metrics` | GET | admin/analyst | Field model metrics |
| `/api/model/university-metrics` | GET | admin/analyst | University model metrics |
| `/api/analytics/correlations` | GET | admin/analyst | Feature correlation with dropout risk |
| `/api/analytics/trend` | GET | admin/analyst | Cohort risk trend |
| `/api/feedback` | GET/POST | admin (GET) / any (POST) | Feedback & support |
| `/api/goals`, `/api/badges/<id>` | GET/POST | student and above | Progress goals, achievement badges |
| `/api/messages` | GET/POST | admin/teacher/student | In-app messaging |
| `/api/audit-log` | GET | admin | Admin action history |
| `/api/health` | GET | — | Health check |

Roster records use `school_id` and `class_id` to enforce staff access. Include these columns when an administrator imports existing roster data; teachers receive their assigned values on uploads, and records outside their class cannot be overwritten.

## Security

See `docs/SECURITY.md` for authentication, data-access, and secrets-handling notes.
