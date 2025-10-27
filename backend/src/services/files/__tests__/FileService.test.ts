import { FileService } from '../FileService';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaFileArtifacts = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => ({
      file_artifacts: mockPrismaFileArtifacts,
    })),
  };
});

// Mock fs/promises
jest.mock('fs/promises');

describe('FileService', () => {
  let fileService: FileService;
  let mockPrisma: any;
  const mockUploadDir = '/tmp/test-uploads';

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    fileService = new FileService(mockPrisma, mockUploadDir);
    jest.clearAllMocks();

    // Default mock implementations
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('test content'));
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
  });

  describe('upload()', () => {
    it('should upload new file and create database record', async () => {
      const fileBuffer = Buffer.from('test file content');
      const uploadParams = {
        file: fileBuffer,
        ownerId: 'user-123',
        challengeId: 'challenge-456',
        mime: 'text/plain',
        originalName: 'test.txt',
      };

      mockPrisma.file_artifacts.findUnique.mockResolvedValue(null); // No existing file
      const mockFileRecord = {
        id: 'file-789',
        ownerId: uploadParams.ownerId,
        challengeId: uploadParams.challengeId,
        filename: uploadParams.originalName,
        mime: uploadParams.mime,
        bytes: fileBuffer.length,
        sha256: expect.any(String),
        storageKey: expect.any(String),
        createdAt: new Date(),
      };
      mockPrisma.file_artifacts.create.mockResolvedValue(mockFileRecord);

      const result = await fileService.upload(uploadParams);

      expect(mockPrisma.file_artifacts.findUnique).toHaveBeenCalledWith({
        where: { sha256: expect.any(String) },
      });
      expect(fs.mkdir).toHaveBeenCalledWith(mockUploadDir, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalled();
      expect(mockPrisma.file_artifacts.create).toHaveBeenCalled();
      expect(result).toEqual(mockFileRecord);
    });

    it('should deduplicate existing files', async () => {
      const fileBuffer = Buffer.from('duplicate content');
      const uploadParams = {
        file: fileBuffer,
        ownerId: 'user-123',
        mime: 'text/plain',
        originalName: 'duplicate.txt',
      };

      const existingFile = {
        id: 'existing-file',
        ownerId: 'other-user',
        filename: 'original.txt',
        mime: 'text/plain',
        bytes: fileBuffer.length,
        sha256: 'abc123hash',
        storageKey: 'other-user/original.txt',
        createdAt: new Date(),
      };

      mockPrisma.file_artifacts.findUnique.mockResolvedValue(existingFile);

      const result = await fileService.upload(uploadParams);

      expect(result).toEqual(existingFile);
      expect(mockPrisma.file_artifacts.create).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should calculate SHA256 correctly', async () => {
      const fileBuffer = Buffer.from('test content for hashing');
      const uploadParams = {
        file: fileBuffer,
        ownerId: 'user-123',
        mime: 'text/plain',
        originalName: 'test.txt',
      };

      mockPrisma.file_artifacts.findUnique.mockResolvedValue(null);
      mockPrisma.file_artifacts.create.mockResolvedValue({
        id: 'file-123',
        sha256: 'computed-hash',
      });

      await fileService.upload(uploadParams);

      const createCall = mockPrisma.file_artifacts.create.mock.calls[0][0];
      expect(createCall.data.sha256).toBeTruthy();
      expect(typeof createCall.data.sha256).toBe('string');
      expect(createCall.data.sha256.length).toBe(64); // SHA256 = 64 hex chars
    });
  });

  describe('get()', () => {
    it('should retrieve file with metadata', async () => {
      const mockFile = {
        id: 'file-123',
        ownerId: 'user-123',
        filename: 'test.txt',
        mime: 'text/plain',
        bytes: 100,
        sha256: 'abc123',
        storageKey: 'user-123/test.txt',
        createdAt: new Date(),
      };

      mockPrisma.file_artifacts.findUnique.mockResolvedValue(mockFile);
      const mockBuffer = Buffer.from('file content');
      (fs.readFile as jest.Mock).mockResolvedValue(mockBuffer);

      const result = await fileService.get('file-123');

      expect(result.buffer).toEqual(mockBuffer);
      expect(result.metadata).toEqual(mockFile);
    });

    it('should throw error if file not found', async () => {
      mockPrisma.file_artifacts.findUnique.mockResolvedValue(null);

      await expect(fileService.get('non-existent')).rejects.toThrow('File not found');
    });
  });

  describe('verify()', () => {
    it('should return true for valid file', async () => {
      const fileContent = Buffer.from('test content');
      const mockFile = {
        id: 'file-123',
        sha256: require('crypto').createHash('sha256').update(fileContent).digest('hex'),
        storageKey: 'user-123/test.txt',
      };

      mockPrisma.file_artifacts.findUnique.mockResolvedValue(mockFile);
      (fs.readFile as jest.Mock).mockResolvedValue(fileContent);

      const result = await fileService.verify('file-123');

      expect(result).toBe(true);
    });

    it('should return false for corrupted file', async () => {
      const mockFile = {
        id: 'file-123',
        sha256: 'original-hash',
        storageKey: 'user-123/test.txt',
      };

      mockPrisma.file_artifacts.findUnique.mockResolvedValue(mockFile);
      (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('corrupted content'));

      const result = await fileService.verify('file-123');

      expect(result).toBe(false);
    });

    it('should return false if file not found', async () => {
      mockPrisma.file_artifacts.findUnique.mockResolvedValue(null);

      const result = await fileService.verify('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getByChallenge()', () => {
    it('should return files for challenge with owner info', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          filename: 'file1.txt',
          owner: { id: 'user-1', email: 'user1@example.com', role: 'USER' },
        },
        {
          id: 'file-2',
          filename: 'file2.txt',
          owner: { id: 'user-2', email: 'user2@example.com', role: 'USER' },
        },
      ];

      mockPrisma.file_artifacts.findMany.mockResolvedValue(mockFiles);

      const result = await fileService.getByChallenge('challenge-123');

      expect(mockPrisma.file_artifacts.findMany).toHaveBeenCalledWith({
        where: { challengeId: 'challenge-123' },
        include: { users: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockFiles);
    });
  });

  describe('delete()', () => {
    it('should delete file owned by user', async () => {
      const mockFile = {
        id: 'file-123',
        ownerId: 'user-123',
        storageKey: 'user-123/test.txt',
      };

      mockPrisma.file_artifacts.findUnique.mockResolvedValue(mockFile);
      mockPrisma.file_artifacts.delete.mockResolvedValue(mockFile);

      await fileService.delete('file-123', 'user-123');

      expect(fs.unlink).toHaveBeenCalledWith(path.join(mockUploadDir, mockFile.storageKey));
      expect(mockPrisma.file_artifacts.delete).toHaveBeenCalledWith({
        where: { id: 'file-123' },
      });
    });

    it('should throw error if user does not own file', async () => {
      const mockFile = {
        id: 'file-123',
        ownerId: 'other-user',
        storageKey: 'other-user/test.txt',
      };

      mockPrisma.file_artifacts.findUnique.mockResolvedValue(mockFile);

      await expect(fileService.delete('file-123', 'user-123')).rejects.toThrow('Unauthorized');
    });

    it('should throw error if file not found', async () => {
      mockPrisma.file_artifacts.findUnique.mockResolvedValue(null);

      await expect(fileService.delete('non-existent', 'user-123')).rejects.toThrow('File not found');
    });
  });
});
