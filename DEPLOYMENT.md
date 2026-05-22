# Production Deployment Guide - AI Website Builder

## Overview
This guide explains how to deploy the AI Website Builder application to production (Vercel).

## Architecture
- **Client**: React + Vite frontend (hosted on Vercel)
- **Server**: Express.js backend (serverless functions on Vercel)
- **Database**: PostgreSQL (Neon.tech)

## Environment Setup

### Server Environment Variables (.env)
```
TRUSTED_ORIGINS="http://localhost:5173,https://localhost:5173,http://localhost:3000,https://ai-website-builder-taupe-sigma.vercel.app"
DATABASE_URL="postgresql://..." 
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="https://your-deployment-url.vercel.app"
NODE_ENV="production"
AI_API_KEY="your-api-key"
STRIPE_SECRET_KEY="your-stripe-key"
STRIPE_WEBHOOK_SECRET="your-webhook-secret"
```

### Client Environment Variables (.env)
```
VITE_BASEURL="https://your-deployment-url.vercel.app"
```

## Pre-Deployment Checklist

1. **Environment Variables**
   - ✅ Updated TRUSTED_ORIGINS to include production URL
   - ✅ NODE_ENV set to "production"
   - ✅ BETTER_AUTH_URL matches deployment URL
   - ✅ All API keys configured

2. **Build Configuration**
   - ✅ Server vercel.json configured for serverless functions
   - ✅ Client vercel.json configured for SPA routing
   - ✅ TypeScript compilation enabled

3. **Database**
   - ✅ Prisma migrations up to date
   - ✅ Database URL connection verified
   - ✅ PostgreSQL adapter configured

4. **API Routes**
   - ✅ All routes under /api/* prefix
   - ✅ Better-auth routes properly configured
   - ✅ CORS settings correct for production

## Deployment Steps

### Step 1: Push to Git
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Configure Vercel

#### For Client (Frontend)
1. Go to https://vercel.com and connect your repository
2. Select the `/client` directory as root
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Install Command: `npm install`
6. Add Environment Variables:
   - `VITE_BASEURL`: Your API URL (e.g., `https://api.your-domain.vercel.app`)

#### For Server (Backend API)
1. Create a separate Vercel project for the server
2. Select the `/server` directory as root
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Install Command: `npm install`
6. Add Environment Variables (all from .env file):
   - `TRUSTED_ORIGINS`
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - `NODE_ENV` = "production"
   - `AI_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### Step 3: Verify Deployment
After deployment:
1. Visit the client URL: `https://your-app.vercel.app`
2. Check server health: `https://your-api.vercel.app/api/health`
3. Test authentication: Try logging in
4. Test project creation: Create a new project
5. Check database connection: Verify data is saved

## Common Issues & Fixes

### Issue 1: CORS Errors
**Symptom**: 
- `Cross-Origin Request Blocked` errors in browser console
- Login/API calls fail

**Fix**:
- Update `TRUSTED_ORIGINS` in server .env
- Include both client and server URLs
- Example: `"https://app.vercel.app,https://api.vercel.app"`

### Issue 2: 502 Bad Gateway / API Not Working
**Symptom**:
- API calls return 502 error
- "Function crashed" in Vercel logs

**Fix**:
- Check `api/index.ts` exists in server directory
- Verify Node.js version in vercel.json
- Check all environment variables are set
- Look at Vercel function logs for errors

### Issue 3: Database Connection Failed
**Symptom**:
- `Error: connect ECONNREFUSED`
- Login page loads but auth fails

**Fix**:
- Verify `DATABASE_URL` is correct
- Check database credentials
- Ensure Neon.tech database is active
- Run: `npm run build` to generate Prisma client

### Issue 4: Authentication Not Working
**Symptom**:
- Can't login/register
- 401 Unauthorized errors

**Fix**:
- Verify `BETTER_AUTH_SECRET` is set
- Check `BETTER_AUTH_URL` matches client URL
- Ensure cookies are allowed (check browser settings)
- Clear browser cookies and try again

### Issue 5: Environment Variables Not Loading
**Symptom**:
- API_KEY undefined errors
- Blank values in logs

**Fix**:
- Verify all variables are set in Vercel dashboard
- For client: prefix with `VITE_` 
- For server: use standard naming
- Redeploy after changing variables

## Local Development

### Setup

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Running Locally

```bash
# Option 1: Run both concurrently (from root)
npm run dev

# Option 2: Run separately
# Terminal 1 - Client (port 5173)
cd client
npm run dev

# Terminal 2 - Server (port 3000)
cd server
npm run server
```

### Environment for Local Development

**Client** (`.env.local`):
```
VITE_BASEURL="http://localhost:3000"
```

**Server** (`.env.local`):
```
TRUSTED_ORIGINS="http://localhost:5173,http://localhost:3000"
NODE_ENV="development"
```

## Database Management

### Generate Prisma Client
```bash
cd server
npx prisma generate
```

### Run Migrations
```bash
cd server
npx prisma migrate dev
```

### View Database
```bash
cd server
npx prisma studio
```

## Monitoring & Logs

### Vercel Dashboard
- Monitor function duration and memory usage
- Check error logs for API issues
- Review build logs for compilation errors

### Local Development Logs
- Check browser console for client-side errors
- Check server terminal for API errors
- Use Prisma Studio to inspect database

## Performance Optimization

1. **Frontend**
   - Built-in caching headers for assets
   - SPA routing configured
   - Vite production build enabled

2. **Backend**
   - Connection pooling via Neon.tech
   - Prisma optimized queries
   - Serverless function memory: 1024MB

3. **Database**
   - PostgreSQL with SSL enabled
   - Connection pooling active
   - Query optimization in place

## Security Best Practices

✅ **Already Implemented**:
- HTTPS enforced
- HttpOnly cookies for session
- CORS properly configured
- Environment variables secure
- Database SSL/TLS enabled

❌ **To Review**:
- Implement rate limiting
- Add request validation
- Set up security headers
- Enable HTTPS redirects
- Review OWASP compliance

## Support & Debugging

For more information:
- Vercel Docs: https://vercel.com/docs
- Better Auth: https://www.better-auth.com
- Prisma: https://www.prisma.io/docs
- Express: https://expressjs.com

## Version History

- v1.0.0: Initial production setup
  - Fixed CORS issues
  - Updated environment configuration
  - Added serverless function support
  - Optimized build process
