// /src/services/ai/evidence/generators/QRGenerator.ts

import * as QRCode from 'qrcode';

export class QRGenerator {
  /**
   * Generate QR code as PNG buffer
   */
  async generate(url: string): Promise<Buffer> {
    try {
      const buffer = await QRCode.toBuffer(url, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return buffer;
    } catch (error) {
      console.error('[QRGenerator] Failed to generate QR code:', error);
      throw new Error(`QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
