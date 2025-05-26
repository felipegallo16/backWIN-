import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './middleware/cors';
import { rateLimiter } from './middleware/rateLimiter';
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

export const app = express();
const port = process.env.PORT || 3001;

// Middlewares básicos
app.use(express.json());
app.use(cookieParser());

// Aplicar middlewares de seguridad
app.use(corsMiddleware);
app.use(rateLimiter);

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

// Solo iniciar el servidor si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
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
} 