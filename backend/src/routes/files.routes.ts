import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { FileService } from '../services/files/FileService';
import { prisma } from '../config/database';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});
const fileService = new FileService(prisma);

// Upload file
router.post('/upload', authenticate, upload.single('file'), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const file = await fileService.upload({
      file: req.file.buffer,
      ownerId: (req as any).user.id,
      challengeId: req.body.challengeId,
      mime: req.file.mimetype,
      originalName: req.file.originalname,
    });

    res.json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Download file
router.get('/:fileId', authenticate, async (req, res) => {
  try {
    const { buffer, metadata } = await fileService.get(req.params.fileId);

    res.setHeader('Content-Type', metadata.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('File download error:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Verify file integrity
router.get('/:fileId/verify', authenticate, async (req, res) => {
  try {
    const valid = await fileService.verify(req.params.fileId);
    res.json({
      success: true,
      data: {
        valid,
        verified: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('File verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Get files for challenge
router.get('/challenge/:challengeId', authenticate, async (req, res) => {
  try {
    const files = await fileService.getByChallenge(req.params.challengeId);
    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('Failed to fetch challenge files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get my files
router.get('/my/files', authenticate, async (req, res) => {
  try {
    const files = await fileService.getByOwner((req as any).user.id);
    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('Failed to fetch user files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Delete file
router.delete('/:fileId', authenticate, async (req, res): Promise<void> => {
  try {
    await fileService.delete(req.params.fileId, (req as any).user.id);
    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('File deletion error:', error);
    if (error.message.includes('Unauthorized')) {
      res.status(403).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Deletion failed' });
  }
});

export default router;
