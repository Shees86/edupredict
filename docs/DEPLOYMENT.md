# EduPredict — Cloud Deployment Guide

Deploying EduPredict to the cloud means it runs from a single URL in
any browser, with no local Hadoop/MongoDB/Python setup required.

---

## Step 1: MongoDB Atlas (free cloud database)

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free).
2. Create a free "M0" cluster (any region close to you).
3. Under **Database Access**: create a user, e.g. username `edupredict`,
   generate a password — **save it**, you'll need it.
4. Under **Network Access**, allow only the specific IP addresses or
   ranges that need database access: your current public IP for local
   administration and the outbound IP addresses/ranges provided for
   your Render service. If Render does not provide stable outbound IPs
   for your plan, use a supported private-network or static-egress
   option. Do not allow access from anywhere (0.0.0.0/0).
5. Click **Connect** → **Drivers** → copy the connection string. It
   looks like:
   ```
   mongodb+srv://edupredict:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>` with your actual password. **Save this full string.**

## Step 2: Push the project to GitHub

1. Go to https://github.com and create a free account if you don't have one.
2. Create a new repository, e.g. `edupredict`.
3. On your laptop, in the `EduPredict` folder:
   ```bash
   git init
   git add .
   git commit -m "EduPredict initial commit"
   git branch -M main
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
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --worker-class gthread --threads 4 --timeout 120`
   - **Instance type**: Free
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `MONGO_URI` | (the connection string from Step 1) |
   | `FLASK_SECRET_KEY` | a unique, cryptographically strong generated secret (for example, generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"`); do not use a guessable or reused value |
   | `FRONTEND_ORIGIN` | (leave blank for now, fill in after Step 4) |
   | `ADMIN_SETUP_KEY` | any random string — this is required to create the first Admin account, see "Creating accounts" in the main README |
5. Click **Create Web Service**. Wait for it to build and deploy.
6. Once live, copy the URL Render gives you, e.g.
   `https://edupredict-backend.onrender.com` — **save this.**

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
   | `VITE_API_BASE` | `https://edupredict-backend.onrender.com/api` (your Render URL from Step 3, + `/api`) |
5. Click **Deploy**. Once live, copy the URL Vercel gives you, e.g.
   `https://edupredict.vercel.app` — **save this.**

## Step 6: Connect the two

Go back to Render → your backend service → **Environment** → set:
| Key | Value |
|---|---|
| `FRONTEND_ORIGIN` | `https://edupredict.vercel.app` (your Vercel URL from Step 5) |

Save — Render will redeploy automatically.

## Step 7: Test it

Open `https://edupredict.vercel.app` in a browser on ANY computer (or
your phone). Log in with the demo credentials. Everything should work
exactly like it did locally — because it's the same code, just hosted.

---

## Notes on HDFS/PySpark

Hadoop/HDFS/PySpark is an optional offline data-processing demonstration,
not part of the live application or model-training data path. The Spark
pipeline reads the sample CSV from HDFS and writes cleaned Parquet, but
`ml/train_model.py` always reads `data/students_sample.csv` and does not
consume that Parquet output. The live backend scores predictions using
the saved pickle model and encoders; the deployed app does not run Spark
or Hadoop.

## Render free-tier note

Free Render web services "sleep" after ~15 minutes of inactivity and
take ~30-60 seconds to wake up on the next request. Open the app once
a few minutes before your demo starts so it's already awake.
