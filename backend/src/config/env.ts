import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string | number;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN: string;
}

/**
 * Validates and exports environment variables with proper type safety
 */
export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variable is missing
 */
export const validateEnv = (): void => {
  const requiredVars: (keyof EnvConfig)[] = ['DATABASE_URL', 'JWT_SECRET'];

  const missing = requiredVars.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }

  if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be changed in production environment');
  }
};
