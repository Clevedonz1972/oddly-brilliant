// /src/services/ai/evidence/generators/PDFGenerator.ts

import PDFDocument from 'pdfkit';

interface ChallengeInfo {
  id: string;
  title: string;
  bountyAmount: string;
  status: string;
  projectLeaderEmail: string;
  createdAt: Date;
}

interface ContributionBreakdown {
  email: string;
  type: string;
  weight: number;
  payout: number;
}

interface ComplianceCheck {
  label: string;
  passed: boolean;
  details?: string;
}

interface EventTimelineEntry {
  timestamp: Date;
  action: string;
  actorEmail: string;
}

interface FileIntegrityEntry {
  filename: string;
  sha256: string;
}

interface EthicsInfo {
  giniCoefficient: number;
  fairnessScore: number;
  redFlags: string[];
  yellowFlags: string[];
  greenFlags: string[];
}

interface AuditReportData {
  challenge: ChallengeInfo;
  contributions: ContributionBreakdown[];
  complianceChecks: ComplianceCheck[];
  ethicsInfo?: EthicsInfo;
  eventTimeline: EventTimelineEntry[];
  fileIntegrity: FileIntegrityEntry[];
  verificationUrl: string;
  qrCodeBuffer: Buffer;
  packageSha256: string;
  generatedAt: Date;
}

export class PDFGenerator {
  /**
   * Generate professional audit report PDF
   */
  async generateAuditReport(data: AuditReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: `Audit Certificate - ${data.challenge.title}`,
            Author: 'Oddly Brilliant AI Auditor',
            Subject: 'Payout Audit Evidence Package',
            CreationDate: data.generatedAt,
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (error: Error) => reject(error));

        // Dark theme colors
        const colors = {
          primary: '#1a1a1a',
          secondary: '#333333',
          accent: '#4a90e2',
          success: '#4caf50',
          warning: '#ff9800',
          error: '#f44336',
          text: '#333333',
          lightText: '#666666',
          border: '#cccccc',
          background: '#f5f5f5',
        };

        let yPosition = 50;

        // Header
        doc
          .fontSize(24)
          .fillColor(colors.primary)
          .font('Helvetica-Bold')
          .text('ODDLY BRILLIANT AUDIT CERTIFICATE', 50, yPosition, {
            align: 'center',
          });

        yPosition += 40;

        doc
          .fontSize(12)
          .fillColor(colors.lightText)
          .font('Helvetica')
          .text(`Challenge: #${data.challenge.id}`, 50, yPosition, {
            align: 'center',
          });

        yPosition += 15;

        doc.text(
          `Generated: ${data.generatedAt.toISOString().replace('T', ' ').substring(0, 19)} UTC`,
          50,
          yPosition,
          { align: 'center' }
        );

        yPosition += 40;

        // Challenge Overview
        this.drawSectionHeader(doc, 'CHALLENGE OVERVIEW', yPosition, colors);
        yPosition += 25;

        this.drawDivider(doc, yPosition, colors);
        yPosition += 15;

        const overviewData = [
          { label: 'Title', value: data.challenge.title },
          { label: 'Bounty', value: `${data.challenge.bountyAmount} USDC` },
          { label: 'Status', value: data.challenge.status },
          { label: 'Project Leader', value: data.challenge.projectLeaderEmail },
        ];

        overviewData.forEach((item) => {
          doc.fontSize(10).fillColor(colors.lightText).font('Helvetica').text(item.label + ':', 50, yPosition);

          doc
            .fontSize(10)
            .fillColor(colors.text)
            .font('Helvetica-Bold')
            .text(item.value, 200, yPosition, { width: 350 });

          yPosition += 20;
        });

        yPosition += 20;

        // Contribution Breakdown
        if (data.contributions.length > 0) {
          this.drawSectionHeader(doc, 'CONTRIBUTION BREAKDOWN', yPosition, colors);
          yPosition += 25;

          this.drawDivider(doc, yPosition, colors);
          yPosition += 15;

          // Table header
          doc.fontSize(9).fillColor(colors.primary).font('Helvetica-Bold');
          doc.text('Contributor', 50, yPosition);
          doc.text('Type', 220, yPosition);
          doc.text('Weight', 320, yPosition);
          doc.text('Payout', 420, yPosition);

          yPosition += 15;
          this.drawDivider(doc, yPosition, colors);
          yPosition += 10;

          // Table rows
          doc.fontSize(9).fillColor(colors.text).font('Helvetica');
          data.contributions.forEach((contrib) => {
            doc.text(contrib.email, 50, yPosition, { width: 165, ellipsis: true });
            doc.text(contrib.type, 220, yPosition);
            doc.text(`${(contrib.weight * 100).toFixed(1)}%`, 320, yPosition);
            doc.text(contrib.payout.toFixed(2), 420, yPosition);

            yPosition += 18;

            if (yPosition > 720) {
              doc.addPage();
              yPosition = 50;
            }
          });

          yPosition += 20;
        }

        // Compliance Checks
        if (data.complianceChecks.length > 0) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          this.drawSectionHeader(doc, 'COMPLIANCE CHECKS', yPosition, colors);
          yPosition += 25;

          this.drawDivider(doc, yPosition, colors);
          yPosition += 15;

          data.complianceChecks.forEach((check) => {
            const checkmark = check.passed ? '✓' : '✗';
            const checkColor = check.passed ? colors.success : colors.error;

            doc.fontSize(10).fillColor(checkColor).font('Helvetica-Bold').text(checkmark, 50, yPosition);

            doc
              .fontSize(10)
              .fillColor(colors.text)
              .font('Helvetica')
              .text(check.label, 70, yPosition, { width: 480 });

            yPosition += 18;

            if (yPosition > 720) {
              doc.addPage();
              yPosition = 50;
            }
          });

          yPosition += 20;
        }

        // Ethics Analysis
        if (data.ethicsInfo) {
          if (yPosition > 600) {
            doc.addPage();
            yPosition = 50;
          }

          this.drawSectionHeader(doc, 'ETHICS ANALYSIS', yPosition, colors);
          yPosition += 25;

          this.drawDivider(doc, yPosition, colors);
          yPosition += 15;

          doc
            .fontSize(10)
            .fillColor(colors.lightText)
            .font('Helvetica')
            .text('Gini Coefficient:', 50, yPosition);

          doc
            .fontSize(10)
            .fillColor(colors.text)
            .font('Helvetica-Bold')
            .text(data.ethicsInfo.giniCoefficient.toFixed(2), 200, yPosition);

          yPosition += 18;

          doc.fontSize(10).fillColor(colors.lightText).font('Helvetica').text('Fairness Score:', 50, yPosition);

          doc
            .fontSize(10)
            .fillColor(colors.text)
            .font('Helvetica-Bold')
            .text(`${data.ethicsInfo.fairnessScore.toFixed(2)}/1.00`, 200, yPosition);

          yPosition += 20;

          if (data.ethicsInfo.redFlags.length > 0) {
            doc.fontSize(10).fillColor(colors.lightText).font('Helvetica').text('Red Flags:', 50, yPosition);

            yPosition += 15;
            data.ethicsInfo.redFlags.forEach((flag) => {
              doc.fontSize(9).fillColor(colors.error).font('Helvetica').text(`✗ ${flag}`, 70, yPosition);
              yPosition += 15;
            });
            yPosition += 5;
          }

          if (data.ethicsInfo.greenFlags.length > 0) {
            doc.fontSize(10).fillColor(colors.lightText).font('Helvetica').text('Green Flags:', 50, yPosition);

            yPosition += 15;
            data.ethicsInfo.greenFlags.forEach((flag) => {
              doc.fontSize(9).fillColor(colors.success).font('Helvetica').text(`✓ ${flag}`, 70, yPosition);
              yPosition += 15;

              if (yPosition > 720) {
                doc.addPage();
                yPosition = 50;
              }
            });
            yPosition += 5;
          }

          yPosition += 20;
        }

        // Event Timeline
        if (data.eventTimeline.length > 0) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          this.drawSectionHeader(doc, 'EVENT TIMELINE', yPosition, colors);
          yPosition += 25;

          this.drawDivider(doc, yPosition, colors);
          yPosition += 15;

          data.eventTimeline.slice(0, 10).forEach((event) => {
            const timestamp = event.timestamp.toISOString().replace('T', ' ').substring(0, 16);

            doc.fontSize(9).fillColor(colors.lightText).font('Helvetica-Bold').text(timestamp, 50, yPosition);

            doc
              .fontSize(9)
              .fillColor(colors.text)
              .font('Helvetica')
              .text(`${event.action} (${event.actorEmail})`, 150, yPosition, { width: 400 });

            yPosition += 15;

            if (yPosition > 720) {
              doc.addPage();
              yPosition = 50;
            }
          });

          yPosition += 20;
        }

        // File Integrity
        if (data.fileIntegrity.length > 0) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          this.drawSectionHeader(doc, 'FILE INTEGRITY', yPosition, colors);
          yPosition += 25;

          this.drawDivider(doc, yPosition, colors);
          yPosition += 15;

          data.fileIntegrity.slice(0, 10).forEach((file) => {
            doc.fontSize(9).fillColor(colors.text).font('Helvetica-Bold').text(file.filename, 50, yPosition, {
              width: 200,
              ellipsis: true,
            });

            doc
              .fontSize(8)
              .fillColor(colors.lightText)
              .font('Courier')
              .text(file.sha256, 260, yPosition, { width: 290 });

            yPosition += 15;

            if (yPosition > 720) {
              doc.addPage();
              yPosition = 50;
            }
          });

          yPosition += 20;
        }

        // Verification Section
        if (yPosition > 600) {
          doc.addPage();
          yPosition = 50;
        }

        this.drawSectionHeader(doc, 'VERIFICATION', yPosition, colors);
        yPosition += 25;

        this.drawDivider(doc, yPosition, colors);
        yPosition += 15;

        doc.fontSize(10).fillColor(colors.lightText).font('Helvetica').text('Package SHA256:', 50, yPosition);

        yPosition += 15;

        doc
          .fontSize(9)
          .fillColor(colors.text)
          .font('Courier')
          .text(data.packageSha256, 50, yPosition, { width: 500 });

        yPosition += 25;

        doc.fontSize(10).fillColor(colors.lightText).font('Helvetica').text('Verification URL:', 50, yPosition);

        yPosition += 15;

        doc
          .fontSize(9)
          .fillColor(colors.accent)
          .font('Helvetica')
          .text(data.verificationUrl, 50, yPosition, {
            link: data.verificationUrl,
            underline: true,
          });

        yPosition += 30;

        // QR Code
        if (data.qrCodeBuffer) {
          doc.image(data.qrCodeBuffer, 50, yPosition, { width: 150, height: 150 });
          yPosition += 160;
        }

        // Footer
        yPosition += 20;
        this.drawDivider(doc, yPosition, colors);
        yPosition += 15;

        doc
          .fontSize(8)
          .fillColor(colors.lightText)
          .font('Helvetica-Oblique')
          .text(
            'This document is cryptographically signed and tamper-evident. Verify authenticity at the URL above or scan the QR code.',
            50,
            yPosition,
            { align: 'center', width: 500 }
          );

        yPosition += 20;

        doc
          .fontSize(8)
          .fillColor(colors.lightText)
          .font('Helvetica')
          .text('Generated by Oddly Brilliant AI Auditor v1.0', 50, yPosition, {
            align: 'center',
            width: 500,
          });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private drawSectionHeader(doc: PDFKit.PDFDocument, title: string, y: number, colors: any): void {
    doc.fontSize(14).fillColor(colors.primary).font('Helvetica-Bold').text(title, 50, y);
  }

  private drawDivider(doc: PDFKit.PDFDocument, y: number, colors: any): void {
    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .strokeColor(colors.border)
      .lineWidth(0.5)
      .stroke();
  }
}
