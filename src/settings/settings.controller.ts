import { Controller, Get, Patch, Body, Post, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  async updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(updateSettingsDto);
  }

    @Post('test-api') 
    async testApiConnection(@Body() body: { apiBaseUrl: string, apiKey: string }) {
        return this.settingsService.testApiConnection(body.apiBaseUrl, body.apiKey);
    }
}