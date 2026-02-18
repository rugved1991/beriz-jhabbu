# Deployment Guide for Beriz Jhabbu Online Multiplayer

This guide provides step-by-step instructions for deploying the Beriz Jhabbu online multiplayer game to production.

## Architecture Overview

The application consists of two separate components:
- **Frontend**: React application (deployed to Vercel)
- **Backend**: Node.js + Socket.io server (deployed to Render)

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Render account (free tier available)
- Git repository with your code

## Backend Deployment (Render)

### Step 1: Prepare Backend for Deployment

The backend is already configured for deployment. Ensure these files exist:
- `server/package.json` - Contains dependencies and build scripts
- `server/tsconfig.json` - TypeScript configuration
- `server/index.ts` - Server entry point

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `beriz-jhabbu-server` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (for MVP)

### Step 3: Configure Environment Variables

In Render dashboard, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3001` | Server port (Render will override this) |
| `CLIENT_URL` | `https://your-app.vercel.app` | Frontend URL (update after frontend deployment) |

**Note**: You'll update `CLIENT_URL` after deploying the frontend.

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Wait for deployment to complete (5-10 minutes)
4. Note your backend URL: `https://beriz-jhabbu-server.onrender.com`

### Step 5: Test Backend Health Check

Visit your backend URL + `/health`:
```
https://beriz-jhabbu-server.onrender.com/health
```

You should see:
```json
{
  "status": "ok",
  "rooms": 0,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Deployment

The frontend is already configured. The build process uses `react-scripts build`.

### Step 2: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `./` (project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Step 3: Configure Environment Variables

In Vercel project settings, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `REACT_APP_SERVER_URL` | `https://beriz-jhabbu-server.onrender.com` | Backend server URL |

**Important**: Replace with your actual Render backend URL from Step 4 above.

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will build and deploy automatically (2-5 minutes)
3. Note your frontend URL: `https://beriz-jhabbu.vercel.app`

### Step 5: Update Backend CORS Configuration

1. Go back to Render dashboard
2. Update the `CLIENT_URL` environment variable with your Vercel URL
3. Render will automatically redeploy with the new configuration

## Frontend Socket Configuration

The frontend needs to connect to the backend WebSocket server. Update `src/services/SocketManager.ts` if needed:

```typescript
const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
```

This is already configured to use the environment variable.

## Verification Steps

### 1. Test Frontend Access
- Visit your Vercel URL
- You should see the game interface
- Check browser console for any errors

### 2. Test Backend Connection
- Open browser DevTools → Network tab
- Filter by "WS" (WebSocket)
- You should see a WebSocket connection to your Render backend

### 3. Test Room Creation
- Click "Create Room" in the game
- A room ID should be generated
- Check that the room appears in the lobby

### 4. Test Multiplayer
- Open the game in two different browsers/devices
- Create a room in one browser
- Join the room from the other browser using the room ID
- Verify both players appear in the lobby

## Production Environment Variables Summary

### Backend (Render)
```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://beriz-jhabbu.vercel.app
```

### Frontend (Vercel)
```env
REACT_APP_SERVER_URL=https://beriz-jhabbu-server.onrender.com
```

## Monitoring and Logging

### Health Check Monitoring

The backend provides a health check endpoint at `/health`:

```bash
curl https://beriz-jhabbu-server.onrender.com/health
```

Response:
```json
{
  "status": "ok",
  "rooms": 3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Server Logs

**Render Logs**:
1. Go to Render dashboard
2. Select your web service
3. Click "Logs" tab
4. View real-time server logs

**Log Events**:
- Server startup: `Server running on port 3001`
- Client connections: `Client connected: <socket-id>`
- Room operations: `Room created: <room-id>`
- Errors: All errors are logged with stack traces

### Vercel Logs

1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Click on a deployment to view logs

## Troubleshooting

### Frontend Cannot Connect to Backend

**Symptoms**: "Connection failed" error in browser console

**Solutions**:
1. Verify `REACT_APP_SERVER_URL` is set correctly in Vercel
2. Check that backend is running (visit `/health` endpoint)
3. Verify CORS is configured correctly on backend
4. Check browser console for specific error messages

### CORS Errors

**Symptoms**: "CORS policy" error in browser console

**Solutions**:
1. Verify `CLIENT_URL` matches your Vercel URL exactly
2. Ensure no trailing slash in URLs
3. Redeploy backend after changing `CLIENT_URL`

### WebSocket Connection Fails

**Symptoms**: WebSocket connection shows "failed" in Network tab

**Solutions**:
1. Verify backend is running and accessible
2. Check that Socket.io is properly configured
3. Ensure firewall/proxy allows WebSocket connections
4. Try accessing backend `/health` endpoint directly

### Render Free Tier Cold Starts

**Symptoms**: First request takes 30-60 seconds

**Explanation**: Render free tier spins down after 15 minutes of inactivity

**Solutions**:
1. Upgrade to paid tier ($7/month) for always-on service
2. Use a service like UptimeRobot to ping `/health` every 5 minutes
3. Accept cold starts as part of free tier limitations

### Room State Lost After Deployment

**Explanation**: In-memory storage is cleared on each deployment

**Solutions**:
1. This is expected behavior with in-memory storage
2. For persistent rooms, implement Redis or database storage (future enhancement)
3. Inform users that rooms are temporary

## Performance Optimization

### Frontend Optimization

The React build process automatically:
- Minifies JavaScript and CSS
- Optimizes images
- Generates source maps
- Enables code splitting

### Backend Optimization

Current optimizations:
- Room cleanup runs every 5 minutes
- Inactive rooms deleted after 30 minutes
- Efficient in-memory storage with Map data structures

### CDN and Caching

Vercel automatically provides:
- Global CDN for static assets
- Automatic HTTPS
- Compression (gzip/brotli)

## Scaling Considerations

### Current Capacity (Free Tier)

- **Concurrent rooms**: ~100
- **Players per room**: 2-8
- **Total concurrent players**: ~400-800
- **Memory usage**: ~512MB (Render free tier limit)

### When to Scale

Consider upgrading when:
- Consistent 50+ concurrent rooms
- Frequent cold starts affecting UX
- Need for persistent room storage
- Multiple geographic regions needed

### Scaling Options

1. **Vertical Scaling**: Upgrade Render instance ($7-25/month)
2. **Horizontal Scaling**: Multiple server instances + Redis
3. **Database**: Add PostgreSQL/MongoDB for persistence
4. **Load Balancer**: Distribute traffic across servers

## Cost Breakdown

### MVP (Free Tier)
- Backend (Render): $0/month
- Frontend (Vercel): $0/month
- **Total**: $0/month

### Production (Paid Tier)
- Backend (Render Starter): $7/month
- Frontend (Vercel Pro): $20/month (optional)
- Redis (Upstash): $0-10/month
- **Total**: $7-37/month

## Security Considerations

### Current Security Measures

1. **CORS Protection**: Only allows requests from configured frontend URL
2. **Input Validation**: All player moves validated server-side
3. **Rate Limiting**: Prevents spam and DoS attacks
4. **Session Management**: Secure session IDs for reconnection
5. **Hand Privacy**: Players only see their own cards

### Additional Security (Future)

1. **Authentication**: Add user accounts and login
2. **HTTPS Only**: Enforce secure connections (already enabled by Render/Vercel)
3. **DDoS Protection**: Use Cloudflare or similar
4. **Audit Logging**: Log all security-relevant events

## Backup and Recovery

### Current State

- No persistent storage (in-memory only)
- Rooms are temporary and cleared on restart
- No backup needed for MVP

### Future Enhancements

- Database backups for persistent rooms
- Player statistics and history
- Game replay storage

## Continuous Deployment

Both Render and Vercel support automatic deployments:

### Automatic Deployment Triggers

- Push to `main` branch → Automatic deployment
- Pull request → Preview deployment (Vercel)
- Manual trigger → Deploy from dashboard

### Deployment Workflow

1. Push code to GitHub
2. Render/Vercel detect changes
3. Automatic build and deploy
4. Health checks verify deployment
5. Traffic switches to new version

### Rollback

If deployment fails:
1. Render: Click "Rollback" in dashboard
2. Vercel: Select previous deployment and promote

## Support and Maintenance

### Regular Maintenance Tasks

1. **Monitor Logs**: Check for errors weekly
2. **Health Checks**: Verify `/health` endpoint daily
3. **Update Dependencies**: Monthly security updates
4. **Performance Review**: Monitor response times

### Emergency Contacts

- Render Status: https://status.render.com/
- Vercel Status: https://www.vercel-status.com/
- GitHub Status: https://www.githubstatus.com/

## Next Steps

After successful deployment:

1. ✅ Test all game features in production
2. ✅ Share game URL with friends for testing
3. ✅ Monitor logs for errors
4. ✅ Gather user feedback
5. ✅ Plan future enhancements

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
