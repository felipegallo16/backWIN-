import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://wintrust.vercel.app'
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

export const corsMiddleware = cors(corsOptions);

// Configuración específica para rutas de Next.js API
export const nextApiCorsOptions = {
  ...corsOptions,
  origin: true, // Permitir todas las origenes para rutas de API de Next.js
  credentials: true
}; 