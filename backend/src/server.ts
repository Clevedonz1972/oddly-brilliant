import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env, validateEnv } from './config/env';
import { testConnection, disconnect } from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error';
import { requestLogger } from './middleware/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import challengesRoutes from './routes/challenges.routes';
import contributionsRoutes from './routes/contributions.routes';
import proposalsRoutes from './routes/proposals.routes';
import submissionsRoutes from './routes/submissions.routes';
import paymentsRoutes from './routes/payments.routes';
import adminRoutes from './routes/admin.routes';
import filesRoutes from './routes/files.routes';

/**
 * Express Application Setup
 */
class Server {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = env.PORT;

    this.validateEnvironment();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Validate required environment variables
   */
  private validateEnvironment(): void {
    try {
      validateEnv();
      logger.info('Environment variables validated successfully');
    } catch (error) {
      logger.error('Environment validation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize Express middlewares
   */
  private initializeMiddlewares(): void {
    // CORS configuration
    this.app.use(
      cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    logger.info('Middlewares initialized');
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (_req: Request, res: Response) => {
      try {
        const dbConnected = await testConnection();

        res.status(dbConnected ? 200 : 503).json({
          success: true,
          data: {
            status: dbConnected ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            environment: env.NODE_ENV,
            database: dbConnected ? 'connected' : 'disconnected',
          },
        });
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
          success: false,
          error: {
            message: 'Service unavailable',
          },
        });
      }
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/challenges', challengesRoutes);
    this.app.use('/api/contributions', contributionsRoutes);
    this.app.use('/api/proposals', proposalsRoutes);
    this.app.use('/api/submissions', submissionsRoutes);
    this.app.use('/api/payments', paymentsRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/files', filesRoutes);

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          message: 'Oddly Brilliant API',
          version: '1.0.0',
          endpoints: {
            health: '/health',
            auth: '/api/auth',
            challenges: '/api/challenges',
            contributions: '/api/contributions',
            proposals: '/api/proposals',
            submissions: '/api/submissions',
            payments: '/api/payments',
            admin: '/api/admin',
            files: '/api/files',
          },
        },
      });
    });

    logger.info('Routes initialized');
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);

    logger.info('Error handling initialized');
  }

  /**
   * Start the Express server
   */
  public async start(): Promise<void> {
    try {
      // Test database connection
      const dbConnected = await testConnection();
      if (!dbConnected) {
        throw new Error('Database connection failed');
      }

      // Start listening
      this.app.listen(this.port, () => {
        logger.info(`Server started successfully`);
        logger.info(`Environment: ${env.NODE_ENV}`);
        logger.info(`Port: ${this.port}`);
        logger.info(`CORS Origin: ${env.CORS_ORIGIN}`);
        logger.info(`API URL: http://localhost:${this.port}`);
        logger.info(`Health Check: http://localhost:${this.port}/health`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown handler
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down server...');

    try {
      await disconnect();
      logger.info('Server shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start server
const server = new Server();

// Start server
server.start();

// Graceful shutdown handlers
process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());

// Unhandled rejection handler
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  server.shutdown();
});

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  server.shutdown();
});

export default server.app;
