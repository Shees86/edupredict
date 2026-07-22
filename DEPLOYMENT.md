# EduPredict — Cloud Deployment Guide

This lets you demo EduPredict from ANY computer with just a browser —
no local Hadoop/MongoDB/Python setup needed at the institute. Do this
setup once, ahead of time, on your own laptop.

---

## Step 1: MongoDB Atlas (free cloud database)

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free).
2. Create a free "M0" cluster (any region close to you).
3. Under **Database Access**: create a user, e.g. username `edupredict`,
   generate a password — **save it**, you'll need it.
4. Under **Network Access**: click "Add IP Address" → **Allow Access
   from Anywhere** (0.0.0.0/0) — needed since Render's IP isn't fixed.
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
   | `FLASK_SECRET_KEY` | any random string, e.g. `edupredict-prod-2026-secure` |
   | `FRONTEND_ORIGIN` | (leave blank for now, fill in after Step 4) |
5. Click **Create Web Service**. Wait for it to build and deploy.
6. Once live, copy the URL Render gives you, e.g.
   `https://edupredict-backend.onrender.com` — **save this.**

## Step 4: Seed the cloud database

On your laptop, temporarily point the seed script at Atlas:
```bash
cd backend
export MONGO_URI="mongodb+srv://edupredict:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
python seed_db.py
```
This loads your demo users + 2000 student records into the cloud database.

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

**At the institute:** open that same URL in any browser on any PC —
no installation, no setup, just the link.

---

## Notes on HDFS/PySpark

The Hadoop/HDFS/PySpark pipeline stays on your own laptop — it doesn't
need to be live during the demo, since it's a one-time preprocessing
step (raw data → HDFS → Spark cleaning → trained model). Show the
terminal screenshots / recordings of that pipeline running as proof
of implementation, alongside the live cloud-hosted app.

## Render free-tier note

Free Render web services "sleep" after ~15 minutes of inactivity and
take ~30-60 seconds to wake up on the next request. Open the app once
a few minutes before your demo starts so it's already awake.
