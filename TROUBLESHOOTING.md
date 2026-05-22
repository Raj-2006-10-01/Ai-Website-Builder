# Quick Troubleshooting Guide

## 🚨 Critical Issues Fixed in This Update

### 1. CORS Errors in Production
**Before**: TRUSTED_ORIGINS only had localhost
**After**: Added production URL to TRUSTED_ORIGINS
```
✅ TRUSTED_ORIGINS now includes https://ai-website-builder-taupe-sigma.vercel.app
```

### 2. NODE_ENV Not Set to Production
**Before**: NODE_ENV="development"
**After**: NODE_ENV="production"
```
✅ Cookies now secure (httpOnly, secure flags work in production)
```

### 3. API Routes Not Working on Vercel
**Before**: Using "{*any}" pattern (not Vercel compatible)
**After**: Created /api/index.ts serverless function handler
```
✅ All /api/* routes now properly routed through Vercel functions
```

### 4. Base URL Hardcoded
**Before**: VITE_BASEURL hardcoded to one URL
**After**: Dynamic loading with fallback to localhost
```
✅ Now works with different deployment URLs
```

## 🔧 What Was Changed

### Server Files
- ✅ `.env` - Updated TRUSTED_ORIGINS, NODE_ENV
- ✅ `server.ts` - Fixed routing, added error handling
- ✅ `vercel.json` - Added API configuration
- ✅ `package.json` - Added @vercel/node dependency
- ✅ `api/index.ts` - **NEW** Serverless function handler
- ✅ `index.ts` - **NEW** Development entry point

### Client Files
- ✅ `.env` - Clean environment configuration
- ✅ `.env.local` - **NEW** Local development environment
- ✅ `vercel.json` - Added build config and caching headers
- ✅ `src/configs/axios.ts` - Dynamic base URL, error handling
- ✅ `src/lib/auth-client.ts` - Dynamic base URL

### Root Files
- ✅ `package.json` - **NEW** Root-level scripts
- ✅ `.env.local` - **NEW** Development variables

### Documentation
- ✅ `DEPLOYMENT.md` - **NEW** Complete deployment guide
- ✅ `TROUBLESHOOTING.md` - **NEW** This file

## ✅ Pre-Deployment Checklist

Before deploying to Vercel, verify:

- [ ] All environment variables are set in Vercel dashboard
- [ ] Database URL is correct
- [ ] API keys are not exposed in Git
- [ ] `.env` file should NOT be committed (add to .gitignore)
- [ ] Both client and server projects created on Vercel
- [ ] Production URLs updated in configuration

## 🚀 How to Deploy Now

### Quick Deploy
```bash
# 1. Commit all changes
git add .
git commit -m "Production deployment setup"

# 2. Push to main
git push origin main

# 3. Vercel will auto-deploy (if connected)
# Monitor at: https://vercel.com/dashboard
```

### Manual Deploy
1. Go to Vercel dashboard
2. Select your project
3. Click "Deploy" (or auto-deploys on git push)
4. Monitor build logs for errors

## 🔍 Testing After Deployment

### Step 1: Server Health Check
```
Visit: https://your-api.vercel.app/api/health
Expected: {"status":"ok"}
```

### Step 2: Test CORS
```
Open browser console and try logging in
Should NOT see: "Cross-Origin Request Blocked"
```

### Step 3: Test Authentication
```
- Try to sign up with new account
- Should create user in database
- Should set auth cookies
```

### Step 4: Create & Save Project
```
- Create a new project
- Save some HTML code
- Verify it's saved to database
```

## 📊 Vercel Dashboard Tips

### View Logs
1. Click on your deployment
2. Click "Function Logs" tab
3. See real-time server errors

### Environment Variables
1. Go to Settings → Environment Variables
2. Add/edit production variables
3. Redeploy to apply changes

### Deployments
1. See all deployment history
2. Rollback to previous version if needed
3. Check deployment time & size

## 💡 Common Production Issues & Quick Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| 502 Bad Gateway | Function logs | Check env vars are set |
| CORS errors | Browser console | Update TRUSTED_ORIGINS |
| Auth fails | Database connection | Verify DATABASE_URL |
| Can't login | Cookie settings | Check secure flags |
| 404 on routes | Client routing | vercel.json SPA config |
| Files not uploading | Request size | 50MB limit set |
| Slow API | Vercel logs | Increase function memory |

## 🔐 Security Checklist

- [ ] API keys not in Git
- [ ] HTTPS enforced (Vercel default)
- [ ] HttpOnly cookies enabled
- [ ] CORS properly restricted
- [ ] Database SSL enabled
- [ ] NODE_ENV="production"
- [ ] No console.log with sensitive data
- [ ] Rate limiting considered

## 📞 Getting Help

If issues persist:
1. Check Vercel function logs
2. Look at browser developer console
3. Test locally first: `npm run dev`
4. Check database with Prisma Studio
5. Review DEPLOYMENT.md for detailed guide

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all features work
3. ✅ Set up monitoring/alerts
4. ✅ Configure custom domain (optional)
5. ✅ Set up analytics (optional)
