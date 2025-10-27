// /src/services/ai/base/BaseAIService.ts

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { generateId } from '../../../utils/idGenerator';

export interface AIServiceConfig {
  cacheTTLSeconds: number;
  enableCaching: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export abstract class BaseAIService {
  protected prisma: PrismaClient;
  protected config: AIServiceConfig;
  protected serviceName: string;

  constructor(
    prisma: PrismaClient,
    serviceName: string,
    config: Partial<AIServiceConfig> = {}
  ) {
    this.prisma = prisma;
    this.serviceName = serviceName;
    this.config = {
      cacheTTLSeconds: 2592000, // 30 days
      enableCaching: true,
      maxRetries: 3,
      timeoutMs: 5000,
      ...config,
    };
  }

  /**
   * Hash input for privacy-preserving cache lookups
   */
  protected hashInput(input: any): string {
    const canonical = JSON.stringify(input, Object.keys(input).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Check cache before running expensive operations
   */
  protected async checkCache<T>(inputHash: string): Promise<T | null> {
    if (!this.config.enableCaching) return null;

    try {
      const cached = await this.prisma.ai_cache.findUnique({
        where: { inputHash },
      });

      if (!cached) return null;

      // Check if expired
      if (new Date() > cached.expiresAt) {
        await this.prisma.ai_cache.delete({ where: { id: cached.id } });
        return null;
      }

      console.log(`[${this.serviceName}] Cache hit: ${inputHash}`);
      return cached.response as T;
    } catch (error) {
      console.warn(`[${this.serviceName}] Cache check failed:`, error);
      return null;
    }
  }

  /**
   * Store result in cache
   */
  protected async setCache<T>(
    inputHash: string,
    response: T,
    confidence?: number
  ): Promise<void> {
    if (!this.config.enableCaching) return;

    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + this.config.cacheTTLSeconds);

      await this.prisma.ai_cache.create({
        data: {
          id: generateId(),
          service: this.serviceName,
          inputHash,
          response: response as any,
          confidence,
          expiresAt,
          createdAt: new Date(),
        },
      });

      console.log(`[${this.serviceName}] Cached result: ${inputHash}`);
    } catch (error) {
      console.warn(`[${this.serviceName}] Cache storage failed:`, error);
    }
  }

  /**
   * Retry wrapper for unreliable operations
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    retries = this.config.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        console.warn(`[${this.serviceName}] Retry ${this.config.maxRetries - retries + 1}/${this.config.maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.withRetry(operation, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Timeout wrapper for long-running operations
   */
  protected async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs = this.config.timeoutMs
  ): Promise<T> {
    return Promise.race([
      operation,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      ),
    ]);
  }
}
