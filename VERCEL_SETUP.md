# Vercel Environment Variables Setup - Step by Step

## 🎯 What You Need to Do

Your app is deployed but network errors happen because the **client can't find the API**.

This is because environment variables aren't set in Vercel.

## 📋 Your Current Setup

You have TWO separate Vercel projects:
1. **Client (Frontend)** - Your React app
2. **Server (Backend API)** - Your Express API

These need to know about each other via environment variables.

---

## ✅ STEP 1: Find Your Vercel URLs

### Client URL
1. Go to https://vercel.com/dashboard
2. Click on your CLIENT project (the React app)
3. Look at the top - you'll see: `your-client-name.vercel.app`
4. **Save this URL**

### Server URL  
1. Go to https://vercel.com/dashboard
2. Click on your SERVER project (the API)
3. Look at the top - you'll see: `your-api-name.vercel.app`
4. **Save this URL**

---

## ✅ STEP 2: Set CLIENT Environment Variables

1. Click your CLIENT project in Vercel
2. Click **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)
4. Click **Add New Variable**
5. Fill in:
   - **Name:** `VITE_BASEURL`
   - **Value:** `https://your-api-name.vercel.app`
   - **Environments:** Choose Production
6. Click **Save**
7. Scroll down and click **Redeploy** (or go to Deployments and click "Redeploy")

**Example:**
```
VITE_BASEURL = https://ai-website-builder-api.vercel.app
```

---

## ✅ STEP 3: Set SERVER Environment Variables

1. Click your SERVER project in Vercel
2. Click **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)
4. Click **Add New Variable** (you'll do this 8 times)

### Variable 1: TRUSTED_ORIGINS
- **Name:** `TRUSTED_ORIGINS`
- **Value:** (copy exactly)
```
https://your-client-name.vercel.app,https://your-api-name.vercel.app
```

**Example:**
```
https://ai-website-builder.vercel.app,https://ai-website-builder-api.vercel.app
```

### Variable 2: DATABASE_URL
- **Name:** `DATABASE_URL`  
- **Value:** Copy from your `.env` file (it's your Neon.tech database URL)

### Variable 3: BETTER_AUTH_SECRET
- **Name:** `BETTER_AUTH_SECRET`
- **Value:** Copy from your `.env` file

### Variable 4: BETTER_AUTH_URL
- **Name:** `BETTER_AUTH_URL`
- **Value:** `https://your-api-name.vercel.app`

**Example:**
```
https://ai-website-builder-api.vercel.app
```

### Variable 5: NODE_ENV
- **Name:** `NODE_ENV`
- **Value:** `production`

### Variable 6: AI_API_KEY
- **Name:** `AI_API_KEY`
- **Value:** Copy from your `.env` file (your OpenAI API key)

### Variable 7: STRIPE_SECRET_KEY
- **Name:** `STRIPE_SECRET_KEY`
- **Value:** Copy from your `.env` file (your Stripe secret key)

### Variable 8: STRIPE_WEBHOOK_SECRET
- **Name:** `STRIPE_WEBHOOK_SECRET`
- **Value:** Copy from your `.env` file (your Stripe webhook secret)

---

## ✅ STEP 4: Redeploy Both Projects

1. Go to **Deployments** tab (in same project)
2. Click **Redeploy** on the latest deployment
3. Wait for build to finish (usually 2-5 minutes)
4. Do this for BOTH client AND server projects

---

## ✅ STEP 5: Test Your App

1. Visit your CLIENT URL: `https://your-client-name.vercel.app`
2. Try to **login** - should work now!
3. Try **community page** - should load without network errors
4. Try **create a project** - should work!
5. Check browser console - should have NO CORS errors

---

## ❓ What If Still Getting Errors?

### Check Vercel Logs
1. Click your project
2. Click **Deployments** tab
3. Click the latest deployment
4. Click **Function Logs** tab
5. Look for error messages

### Common Errors & Fixes

**"Cannot find module"**
- Build failed - check build logs
- Redeploy again

**"CORS error"**
- TRUSTED_ORIGINS not set or wrong
- Client URL not in TRUSTED_ORIGINS
- Redeploy server after updating

**"Database connection failed"**
- DATABASE_URL is wrong or missing
- Check Neon.tech database is active
- Verify DATABASE_URL in Vercel

**"401 Unauthorized"**
- BETTER_AUTH_SECRET is wrong
- BETTER_AUTH_URL is wrong (should be SERVER URL, not client)
- Clear cookies and try again

---

## 📸 Visual Flow

```
Browser
  ↓
Client App (https://app.vercel.app)
  ↓
Needs to know where API is!
  ↓
Reads: VITE_BASEURL = https://api.vercel.app
  ↓
Calls: https://api.vercel.app/api/auth/login
  ↓
Server (https://api.vercel.app)
  ↓
Checks TRUSTED_ORIGINS
  ↓
Must include: https://app.vercel.app
  ↓
Returns response ✅
```

---

## 🔑 Important Notes

- **NEVER share API keys publicly**
- Environment variables are SECURE in Vercel (not visible in browser)
- Must redeploy for variables to take effect
- CLIENT only needs `VITE_BASEURL`
- SERVER needs all 8 variables

---

## 📞 Still Having Issues?

If errors persist:
1. Take a screenshot of Vercel function logs
2. Check browser console (F12) for exact error
3. Verify all variable names are EXACTLY correct (case sensitive)
4. Make sure you clicked "Redeploy" on both projects
5. Wait 2-3 minutes for deployments to complete
