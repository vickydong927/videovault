import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';
import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import streamRoutes from './routes/streams';
import searchRoutes from './routes/search';
import { errorHandler } from './middleware/errorHandler';
import { SERVER_CONFIG } from './config/constants';
import passport from './config/passport';

// Debug environment variables
console.log('Environment variables loaded:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set',
});

const app = express();

// Middleware
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// Serve static files from the React frontend app
const REACT_BUILD_FOLDER = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(REACT_BUILD_FOLDER));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/search', searchRoutes);

// Stripe routes would be added here if needed in the future

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// Important: Catch-all route to handle React Router paths
// This should always be before error handler
app.get('*', (_req, res) => {
  res.sendFile(path.join(REACT_BUILD_FOLDER, 'index.html'));
});

// Error handling middleware should be last
app.use(errorHandler as ErrorRequestHandler);

app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`🚀 Distributed Video Platform Backend ready on port ${SERVER_CONFIG.PORT}`);
  console.log(`📊 Health check available at /api/health`);
  console.log(`🎥 Video API available at /api/videos`);
  console.log(`📺 Streaming API available at /api/streams`);
  console.log(`🔍 Search API available at /api/search`);
});

export default app;