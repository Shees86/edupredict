# EduPredict — Cloud Deployment Guide

The canonical deployed application is
https://edupredict-blue.vercel.app and its API is
https://edupredict-x3a4.onrender.com. The steps below describe deploying
your own instance; when creating a separate deployment, use the URLs
assigned to your own Render and Vercel services instead.

---

## Step 1: MongoDB Atlas (free cloud database)

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free).
2. Create a free "M0" cluster (any region close to you).
3. Under **Database Access**: create a user, e.g. username `edupredict`,
   generate a password — **save it**, you'll need it.
4. Under **Network Access**, allow only the specific IP addresses or
   ranges that need database access. Do not allow access from anywhere
   (`0.0.0.0/0`).
5. Click **Connect** → **Drivers** → copy the connection string. It
   looks like:
   ```
   mongodb+srv://edupredict:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>` with your actual password. **Save this full string.**

## Step 2: Push the project to GitHub

1. Go to https://github.com and create a free account if you don't have one.
2. Create a new repository, e.g. `edupredict`.
3. On your computer, in the repository folder:
   ```bash
   git init
   git add .
   git commit -m "EduPredict initial commit"
   git remote add origin https://github.com/<your-username>/edupredict.git
   git push -u origin main
   ```

## Step 3: Deploy the backend to Render

1. Go to https://render.com and sign up (free), connect your GitHub account.
2. Click **New +** → **Web Service** → select your `edupredict` repo.
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: use the command in `backend/Procfile`.
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `MONGO_URI` | (the connection string from Step 1) |
   | `MONGO_DB_NAME` | `edupredict` (optional; this is the default) |
   | `FLASK_SECRET_KEY` | A unique, cryptographically strong generated secret; do not use a guessable or reused value |
   | `APP_ENCRYPTION_KEY` | A persistent Fernet key, generated with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
   | `FRONTEND_ORIGIN` | `https://edupredict-blue.vercel.app` for the canonical app; for a separate deployment, use its frontend URL |
   | `ADMIN_SETUP_KEY` | any random string — this is required to create the first Admin account, see "Creating accounts" in the main README |

   **Never change or rotate `APP_ENCRYPTION_KEY`** after encrypted TOTP
   secrets or reset tokens have been stored. Changing it makes those
   values unreadable; retain the original key securely.
5. Click **Create Web Service**. Wait for it to build and deploy.
6. For the canonical deployment, the API URL is
   `https://edupredict-x3a4.onrender.com`. For a separate service, use
   the URL assigned by Render.

## Step 4: Initialize the cloud database

The database starts empty; there is no seed script or built-in demo data.
Create the first admin account by following the **Creating accounts**
instructions in the main README, using the `ADMIN_SETUP_KEY` configured
in Step 3.

## Step 5: Deploy the frontend to Vercel

1. Go to https://vercel.com and sign up (free), connect GitHub.
2. Click **Add New** → **Project** → select your `edupredict` repo.
3. Configure:
   - **Root Directory**: `dashboard-app`
   - **Framework Preset**: Vite
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE` | `https://edupredict-x3a4.onrender.com/api` for the canonical API; for a separate deployment, append `/api` to its API URL |
5. Click **Deploy**. The canonical app URL is
   `https://edupredict-blue.vercel.app`; for a separate project, use the
   URL assigned by Vercel.

## Step 6: Connect the two

Go back to Render → your backend service → **Environment** → set:
| Key | Value |
|---|---|
| `FRONTEND_ORIGIN` | `https://edupredict-blue.vercel.app` for the canonical app; otherwise use the URL assigned to your frontend |

Set this to the frontend origin for your deployment and redeploy the
backend if the environment change does not trigger a deploy.

## Step 7: Test it

Open https://edupredict-blue.vercel.app for the canonical deployment (or
your own frontend URL for an independent deployment). There are no
pre-seeded demo credentials; create the first admin account with the
`ADMIN_SETUP_KEY` using the instructions in the main README.

---

## Notes on HDFS/PySpark

Hadoop/HDFS/PySpark is an optional offline data-processing demonstration,
not part of the live application or model-training data path. The Spark
pipeline reads the sample CSV from HDFS and writes cleaned Parquet, but
`ml/train_model.py` reads `data/students_sample.csv` and does not consume
that Parquet output. The live backend scores predictions using the saved
pickle model and encoders; the deployed app does not run Spark or Hadoop.

## Hosting availability note

Hosting availability and wake-up behavior depend on the selected Render
plan; consult the provider's current documentation for its service limits.
