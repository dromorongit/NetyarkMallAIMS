# Railway Deployment Guide

This guide will help you deploy the Netyark Mall Admin & Inventory Management System to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket
3. **MongoDB Database**: Railway provides MongoDB or you can use MongoDB Atlas

## Step 1: Prepare Your Code

Make sure your repository includes these files:
- `package.json` (root)
- `backend/` directory with `package.json`
- `frontend/` directory with `package.json`
- `railway.json`
- `nixpacks.toml`
- `.env.example`

## Step 2: Deploy to Railway

### Option A: One-Click Deploy (Recommended)

1. Click the button below to deploy directly to Railway:
   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/your-username/netyark-mall-aims)

### Option B: Manual Deploy

1. **Connect Repository**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Choose "Deploy from GitHub" (or GitLab/Bitbucket)
   - Select your repository

2. **Configure Environment**:
   - Railway will automatically detect your Node.js application
   - The `railway.json` and `nixpacks.toml` files will configure the build

3. **Set Environment Variables**:
   In your Railway project dashboard, go to "Variables" and add:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   NODE_ENV=production
   ```

## Step 3: Database Setup

### Option A: Railway MongoDB (Easiest)

1. In your Railway project, click "Add Plugin"
2. Search for "MongoDB" and add it
3. Railway will automatically set the `MONGODB_URI` environment variable

### Option B: MongoDB Atlas (Cloud)

1. Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Get your connection string
3. Add it as `MONGODB_URI` in Railway environment variables
4. Make sure to whitelist Railway's IP addresses (0.0.0.0/0 for development)

## Step 4: Initial Setup

1. **Wait for Deployment**: Railway will build and deploy your application
2. **Check Logs**: Monitor the deployment logs for any errors
3. **Access Application**: Once deployed, click on your service to get the URL
4. **Create Admin Account**: Visit `https://your-app.railway.app/setup` to create the first admin account

## Step 5: Post-Deployment Configuration

### File Uploads
- The app uses local file storage by default
- For production, consider using Railway Volumes or cloud storage (AWS S3, Cloudinary)
- Update the upload middleware in `backend/middleware/upload.js`

### Domain Setup (Optional)
1. Go to your Railway project settings
2. Click "Domains"
3. Add your custom domain or use the provided Railway domain

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret (use a long random string) | Yes | - |
| `JWT_EXPIRE` | JWT expiration time | No | 7d |
| `NODE_ENV` | Environment mode | No | production |
| `PORT` | Server port | No | 5000 |

## Troubleshooting

### Build Issues
- Check Railway build logs
- Ensure all dependencies are in `package.json` files
- Verify Node.js version compatibility

### Database Connection
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access
- Ensure database user has proper permissions

### Application Errors
- Check application logs in Railway dashboard
- Verify environment variables are set correctly
- Test API endpoints with Railway's provided URL

### File Upload Issues
- Check file permissions in Railway
- Consider using Railway Volumes for persistent storage
- Implement cloud storage for production

## Performance Optimization

1. **Enable Caching**: Consider adding Redis for session/cache storage
2. **CDN**: Use a CDN for static assets
3. **Database Indexing**: Ensure proper MongoDB indexes
4. **Image Optimization**: Implement image compression and WebP format

## Security Considerations

1. **Environment Variables**: Never commit secrets to code
2. **HTTPS**: Railway provides SSL certificates automatically
3. **Rate Limiting**: Consider adding rate limiting for API endpoints
4. **Input Validation**: Already implemented with express-validator
5. **CORS**: Configure properly for production domains

## Monitoring

Railway provides:
- Application logs
- Performance metrics
- Error tracking
- Usage statistics

## Support

- Railway Documentation: https://docs.railway.app/
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- This application uses Express.js, React, and MongoDB

## Cost Estimation

Railway offers a generous free tier:
- 512MB RAM
- 1GB storage
- 1GB bandwidth per month

For production use, consider their paid plans based on your usage.

---

**Need Help?** Check the Railway documentation or create an issue in the repository.