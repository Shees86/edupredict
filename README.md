# EduPredict — Student Dropout Risk & Academic Analytics Platform

A role-based academic analytics platform that predicts student dropout
risk, recommends academic pathways (field, university, GPA trend), and
visualizes institutional data — built with Flask, MongoDB, and React.
An optional offline Hadoop/HDFS and PySpark pipeline is included for
data-processing demonstrations; it is not part of the live application.

## Live demo

- **App:** https://edupredict-blue.vercel.app
- **API:** https://edupredict-x3a4.onrender.com

[![CI](https://github.com/shees-swe/edupredict/actions/workflows/ci.yml/badge.svg)](https://github.com/shees-swe/edupredict/actions/workflows/ci.yml)

## Project structure

```
.
├── backend/                    Flask API
│   ├── app.py                  Flask application — registers route blueprints
│   ├── blueprints/             Route modules: auth, admin, students,
│   │                           predictions, alerts, dashboard, feedback, engagement
│   ├── db.py                   MongoDB access layer
│   ├── ml_predictor.py         Dropout-risk model wrapper
│   ├── field_predictor.py      Matric % → field/college predictor wrapper
│   ├── university_predictor.py Intermediate % → university predictor wrapper
│   ├── cgpa_predictor.py       Next-semester GPA trend predictor wrapper
│   ├── analytics.py            Correlation & trend analysis
│   ├── *.pkl / *_metrics.json  Pre-trained models and training metrics
│   ├── requirements.txt
│   ├── Procfile                Render start command
│   └── tests/                  Backend unit tests
│
├── dashboard-app/              React frontend (Vite)
│   └── src/
│       ├── App.jsx, main.jsx
│       ├── lib/                API client helpers
│       └── features/
│           ├── auth/           Login / auth screens
│           └── dashboard/      Role dashboards, views, CSV upload, and predictors
│
├── ml/                          Model training and sample-data scripts
├── spark/pyspark_pipeline.py    Optional offline HDFS cleaning and analysis pipeline
├── data/                        Sample datasets (CSV)
├── .github/workflows/ci.yml     GitHub Actions tests and frontend build
└── docs/
    ├── DEPLOYMENT.md            MongoDB Atlas + Render + Vercel deployment guide
    ├── SECURITY.md              Security design notes
    └── HDFS_SETUP.md            Pseudo-distributed Hadoop setup
```

## Features

| Area | Details |
|---|---|
| Authentication | Role-based sessions: Admin, Teacher, Student, Analyst; optional TOTP 2FA |
| Data ingestion | Batch CSV/JSON upload and student-record forms |
| Live application storage | MongoDB |
| Optional offline processing | PySpark on HDFS — a standalone data-processing demonstration, not part of the live app |
| ML — dropout risk | Random Forest classifier |
| ML — field/college predictor | Matric % → recommended field + college tier |
| ML — university predictor | Intermediate % → suggested program + university tier |
| ML — CGPA trend predictor | Current performance → predicted next-semester GPA |
| Visualization | React + Recharts, 4 role-specific dashboards |
| Real-time alerts | Server-Sent Events, pushed to Admin/Teacher/Analyst |
| Cohort analysis | Correlation analysis, risk trends, side-by-side cohort comparison |
| Student engagement | Progress goals, achievement badges, in-app messaging |
| Bulk ingestion | Batch CSV/JSON ingest (request body limit: 5 MB) |
| Record management | Teacher dashboard supports in-app student edit/delete; deleting a student also removes related predictions, alerts, and goals |
| Roster access scoping | Roster endpoints limit teachers to their assigned school/class and analysts to their school; unassigned staff are denied on scoped roster operations |
| Security | Encrypted TOTP secrets and reset tokens; passwords require at least 10 characters, one letter, and one digit; rate limiting, session idle timeout, and security headers |
| Quality | Backend unit tests; GitHub Actions runs backend tests and a frontend production build on pull requests and pushes to `main` |
| Admin controls | Role-approval workflow, audit log, feedback queue |

## Local setup

### Prerequisites
- Python 3.12, Node.js 20, MongoDB (the CI workflow uses Python 3.12 and Node.js 20)
- Java 11, Hadoop 3.3.6, and PySpark only for the optional offline HDFS demonstration

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py              # http://localhost:5000
```

Set the backend environment variables in your shell before starting it.
The app does not automatically load a `.env` file. For local development,
use `MONGO_URI` for your MongoDB instance, `FLASK_SECRET_KEY` for stable
sessions, and `APP_ENCRYPTION_KEY` for encrypted authentication secrets.
`APP_ENCRYPTION_KEY` is required for TOTP secrets and password-reset
tokens: generate a Fernet key with
`python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`,
store it securely, and **never change or rotate it** after it has encrypted
data. Changing it makes existing encrypted values unreadable. Set
`FRONTEND_ORIGIN` to `http://localhost:5173` when using the local frontend.
`ADMIN_SETUP_KEY` is needed to create the first admin account. See
`backend/.env.example` for all supported settings and defaults.

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
  curl -X POST https://edupredict-x3a4.onrender.com/api/auth/register-admin \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"...","full_name":"...","setup_key":"<ADMIN_SETUP_KEY>"}'
  ```

## Cloud deployment

The canonical deployment is the app at https://edupredict-blue.vercel.app
and API at https://edupredict-x3a4.onrender.com. See
`docs/DEPLOYMENT.md` for deployment configuration.

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
| `/api/auth/register` | POST | Public | Register a Teacher, Student, or Analyst |
| `/api/auth/register-admin` | POST | Public + setup key | Create an Admin account |
| `/api/auth/login` | POST | Public | Log in; starts pending 2FA verification when enabled |
| `/api/auth/login/verify-2fa` | POST | Pending 2FA login | Complete login with a TOTP code |
| `/api/auth/logout` | POST | Public | Log out the current user |
| `/api/auth/me` | GET | Authenticated | Get the current session user |
| `/api/auth/forgot-password` | POST | Public | Request a password-reset link |
| `/api/auth/reset-password` | POST | Public + reset token | Set a password using a reset token |
| `/api/auth/change-password` | POST | Authenticated | Change the current user's password |
| `/api/auth/2fa/setup` | POST | Authenticated | Create a TOTP secret and provisioning URI |
| `/api/auth/2fa/confirm` | POST | Authenticated | Confirm and enable TOTP |
| `/api/auth/2fa/disable` | POST | Authenticated | Disable TOTP after password or code verification |
| `/api/admin/pending-users` | GET | Admin | List pending accounts and staff awaiting assignment |
| `/api/admin/approve/<username>` | POST | Admin | Approve an account and assign teacher school/class or analyst school |
| `/api/admin/reject/<username>` | POST | Admin | Reject an account |
| `/api/students` | GET | Admin, Teacher, Analyst | Search/list students; Teacher is scoped to school/class, Analyst to school |
| `/api/students` | POST | Admin, Teacher | Create or update a student; Teacher is scoped to assigned class |
| `/api/students/<student_id>` | GET | Admin, Teacher, Analyst, Student | Get a record; Student can access only their own, staff are scoped |
| `/api/students/<student_id>` | DELETE | Admin, Teacher | Delete a record and related predictions, alerts, and goals; Teacher is scoped |
| `/api/cohort/compare` | GET | Admin, Analyst | Compare two filtered cohorts |
| `/api/data/ingest` | POST | Admin, Teacher | Batch CSV/JSON ingest; Teacher uploads are scoped to assigned class |
| `/api/predict` | POST | Admin, Teacher, Analyst | Predict dropout risk |
| `/api/predict/field` | POST | Any authenticated user | Predict field/college recommendation |
| `/api/predict/university` | POST | Any authenticated user | Predict university/program recommendation |
| `/api/predict/cgpa` | POST | Any authenticated user | Predict next-semester GPA |
| `/api/alerts` | GET | Admin, Teacher, Analyst | List unresolved alerts |
| `/api/alerts/stream` | GET (SSE) | Admin, Teacher, Analyst | Stream live alerts |
| `/api/alerts/<alert_id>/resolve` | POST | Admin, Teacher | Resolve an alert |
| `/api/dashboard/summary` | GET | Admin, Teacher, Analyst | Get dashboard summary |
| `/api/model/metrics`, `/api/model/field-metrics`, `/api/model/university-metrics` | GET | Admin, Analyst | Get model metrics |
| `/api/analytics/correlations`, `/api/analytics/trend` | GET | Admin, Analyst | Get correlation and trend analytics |
| `/api/feedback` | POST | Any authenticated user | Submit feedback |
| `/api/feedback` | GET | Admin | List feedback |
| `/api/feedback/<feedback_id>/resolve` | POST | Admin | Resolve feedback |
| `/api/goals/<student_id>` | GET | Admin, Teacher, Analyst, Student | Read a goal; Student can read only their own |
| `/api/goals` | POST | Student | Set the current student's goal |
| `/api/badges/<student_id>` | GET | Admin, Teacher, Analyst, Student | Read badges; Student can read only their own |
| `/api/messages/conversations`, `/api/messages/<other_user>` | GET | Admin, Teacher, Student | List conversations or read a conversation |
| `/api/messages` | POST | Admin, Teacher, Student | Send a message |
| `/api/notifications/preferences` | GET, POST, PUT | Authenticated | Read or update notification preferences |
| `/api/audit-log` | GET | Admin | Read the admin action log |
| `/api/system/stats` | GET | Admin | Read process and record statistics |
| `/api/health` | GET | Public | Health check |

Roster records use `school_id` and `class_id` to enforce staff access.
Include these columns when importing existing roster data. Teacher
uploads and edits receive the assigned scope, and records outside that
scope cannot be overwritten or deleted.

## Security

See `docs/SECURITY.md` for authentication, data-access, and secrets-handling notes.
