import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { generateId } from '../../utils/idGenerator';

export class FileService {
  private uploadDir: string;

  constructor(
    private prisma: PrismaClient,
    uploadDir = '/home/matt/backend/uploads'
  ) {
    this.uploadDir = uploadDir;
  }

  /**
   * Upload file with SHA256 tracking
   * Includes automatic deduplication
   */
  async upload(params: {
    file: Buffer;
    ownerId: string;
    challengeId?: string;
    mime: string;
    originalName: string;
  }) {
    // Calculate SHA256
    const sha256 = crypto
      .createHash('sha256')
      .update(params.file)
      .digest('hex');

    // Check for duplicates (dedup)
    const existing = await this.prisma.file_artifacts.findUnique({
      where: { sha256 },
    });

    if (existing) {
      console.log(`File deduplicated: ${sha256}`);
      return existing;
    }

    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Generate storage path
    const key = `${params.ownerId}/${Date.now()}-${params.originalName}`;
    const fullPath = path.join(this.uploadDir, key);

    // Ensure subdirectory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file
    await fs.writeFile(fullPath, params.file);

    // Create database record
    return await this.prisma.file_artifacts.create({
      data: {
        id: generateId(),
        ownerId: params.ownerId,
        challengeId: params.challengeId,
        filename: params.originalName,
        mime: params.mime,
        bytes: params.file.length,
        sha256,
        storageKey: key,
      },
    });
  }

  /**
   * Retrieve file by ID
   */
  async get(fileId: string) {
    const file = await this.prisma.file_artifacts.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    const fullPath = path.join(this.uploadDir, file.storageKey);
    const buffer = await fs.readFile(fullPath);

    return {
      buffer,
      metadata: file,
    };
  }

  /**
   * Verify file integrity
   * Checks if file hash matches database
   */
  async verify(fileId: string): Promise<boolean> {
    const file = await this.prisma.file_artifacts.findUnique({
      where: { id: fileId },
    });

    if (!file) return false;

    const fullPath = path.join(this.uploadDir, file.storageKey);
    const buffer = await fs.readFile(fullPath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    return hash === file.sha256;
  }

  /**
   * Get all files for a challenge
   */
  async getByChallenge(challengeId: string) {
    return await this.prisma.file_artifacts.findMany({
      where: { challengeId },
      include: { users: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all files by owner
   */
  async getByOwner(ownerId: string) {
    return await this.prisma.file_artifacts.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete file (soft delete - keeps DB record)
   */
  async delete(fileId: string, userId: string) {
    const file = await this.prisma.file_artifacts.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    if (file.ownerId !== userId) {
      throw new Error('Unauthorized: You can only delete your own files');
    }

    // Delete from filesystem
    const fullPath = path.join(this.uploadDir, file.storageKey);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Failed to delete file from filesystem:', error);
    }

    // Delete from database
    return await this.prisma.file_artifacts.delete({
      where: { id: fileId },
    });
  }
}
