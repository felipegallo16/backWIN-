import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rafflesRouter from './routes/raffles';
import authRouter from './routes/auth';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['APP_ID', 'ACTION_ID'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
app.use('/sorteos', rafflesRouter);
app.use('/api/auth', authRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
  console.log(`📝 API endpoints:`);
  console.log(`   GET    http://localhost:${port}/sorteos`);
  console.log(`   GET    http://localhost:${port}/sorteos/:id`);
  console.log(`   POST   http://localhost:${port}/sorteos/participar`);
  console.log(`   GET    http://localhost:${port}/sorteos/:id/ganador`);
  console.log(`   POST   http://localhost:${port}/api/auth/login`);
  console.log(`   POST   http://localhost:${port}/api/auth/register`);
  console.log(`   POST   http://localhost:${port}/api/auth/logout`);
}); 