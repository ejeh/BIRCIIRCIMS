import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './report.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('api/reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate/:type')
  async generateReport(
    @Param('type') type: string,
    @Body('generatedBy') generatedBy: string,
  ) {
    const report = await this.reportService.generateReport(
      type as any,
      generatedBy,
    );
    return { success: true, message: 'Report generated successfully.', report };
  }

  @Get()
  async findAllReports() {
    return this.reportService.findAllReports();
  }

  @Get(':id/download')
  async downloadReport(@Param('id') id: string, @Res() res: Response) {
    const report = await this.reportService.streamReportFile(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${report.name}.pdf"`,
      'Content-Length': report.fileData.length,
    });
    res.end(report.fileData);
  }

  @Post('schedule')
  async scheduleReport(
    @Body()
    createDto: {
      name: string;
      frequency: string;
      lga: string;
      createdBy: string;
    },
  ) {
    return this.reportService.scheduleReport(createDto);
  }

  @Get('scheduled')
  async findAllScheduledReports() {
    return this.reportService.findAllScheduledReports();
  }

  @Get('export/dashboard/pdf')
  async exportDashboardPdf(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const pdfBuffer = await this.reportService.generateDashboardPdfReport(
        startDate,
        endDate,
      );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="dashboard_report_${new Date().toISOString().slice(0, 10)}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generating dashboard PDF:', error);
      res.status(500).send('Error generating PDF report');
    }
  }

  @Get('export/requests/pdf')
  async exportRequestsPdf(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const pdfBuffer = await this.reportService.generateRequestsPdfReport(
        startDate,
        endDate,
      );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="requests_report_${new Date().toISOString().slice(0, 10)}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generating requests PDF:', error);
      res.status(500).send('Error generating PDF report');
    }
  }
}
