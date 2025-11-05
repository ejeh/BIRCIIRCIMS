import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './schemas/settings.schema';
import { UpdateSettingsDto } from './dto/settings.dto';
import axios, { Axios } from 'axios';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
  ) {}

  async getSettings(): Promise<SettingsDocument> {
    let settings = await this.settingsModel.findOne().exec();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await this.createDefaultSettings();
    }
    
    return settings;
  }

  async updateSettings(updateSettingsDto: UpdateSettingsDto): Promise<SettingsDocument> {
    let settings = await this.settingsModel.findOne().exec();
    
    // If no settings exist, create default settings first
    if (!settings) {
      settings = await this.createDefaultSettings();
    }
    
    // Update only the provided fields
    Object.keys(updateSettingsDto).forEach(key => {
      if (updateSettingsDto[key] !== undefined) {
        settings[key] = updateSettingsDto[key];
      }
    });
    
    return settings.save();
  }

  // async testApiConnection(apiBaseUrl: string, apiKey: string): Promise<{ success: boolean, message: string }> {
  //   try {
  //     // This is a mock implementation
  //     // In a real scenario, you would make an actual HTTP request to the API
  //     // For example using axios or http module
      
  //     // Simulate API test
  //     if (apiBaseUrl && apiKey) {
  //       return {
  //         success: true,
  //         message: 'API connection successful'
  //       };
  //     } else {
  //       return {
  //         success: false,
  //         message: 'Invalid API configuration'
  //       };
  //     }
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: `API connection failed: ${error.message}`
  //     };
  //   }
  // }


//   async testApiConnection(apiBaseUrl: string, apiKey: string): Promise<{ success: boolean, message: string }> {
//   try {
//     // Log the received parameters for debugging
//     console.log('testApiConnection received:', { apiBaseUrl, apiKey });
    
//     // Validate input parameters
//     if (!apiBaseUrl || !apiKey) {
//       console.log('Validation failed:', { 
//         apiBaseUrl: !!apiBaseUrl, 
//         apiKey: !!apiKey,
//         apiBaseUrlValue: apiBaseUrl,
//         apiKeyValue: apiKey
//       });
      
//       return {
//         success: false,
//         message: 'API Base URL and API Key are required'
//       };
//     }

//     // Ensure the URL has a proper format
//     const formattedUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    
//     // Create headers with the API key
//     const headers = {
//       'Authorization': `Bearer ${apiKey}`,
//       'Content-Type': 'application/json'
//     };

//     // Make a test request to the API
//     let response;
    
//     try {
//       // First try to hit a common health endpoint
//       response = await this.httpService.get(`${formattedUrl}/health`, { 
//         headers,
//         timeout: 10000 // 10 second timeout
//       });
//     } catch (healthError) {
//       try {
//         // If health endpoint fails, try the base URL
//         response = await this.httpService.get(formattedUrl, { 
//           headers,
//           timeout: 10000
//         });
//       } catch (baseError) {
//         // If both fail, throw the last error
//         throw baseError;
//       }
//     }

//     console.log('API response status:', response.status);
//     // Check if the response is successful
//     if (response.status >= 200 && response.status < 300) {
//       return {
//         success: true,
//         message: `API connection successful (Status: ${response.status})`
//       };
//     } else {
//       return {
//         success: false,
//         message: `API returned unexpected status: ${response.status}`
//       };
//     }
//   } catch (error) {
//     // Handle different types of errors
//     if (error.response) {
//       // The request was made and the server responded with a status code
//       return {
//         success: false,
//         message: `API responded with error status: ${error.response.status} - ${error.response.statusText || 'Unknown error'}`
//       };
//     } else if (error.request) {
//       // The request was made but no response was received
//       return {
//         success: false,
//         message: 'No response received from API. Please check if the URL is correct and the server is running.'
//       };
//     } else {
//       // Something happened in setting up the request that triggered an Error
//       return {
//         success: false,
//         message: `API connection failed: ${error.message}`
//       };
//     }
//   }
// }



  // async testApiConnection(apiBaseUrl: string, apiKey: string): Promise<{ success: boolean, message: string }> {
  //   try {
  //     // Log the received parameters for debugging
  //     console.log('testApiConnection received:', { apiBaseUrl, apiKey });
      
  //     // Validate input parameters
  //     if (!apiBaseUrl || !apiKey) {
  //       console.log('Validation failed:', { 
  //         apiBaseUrl: !!apiBaseUrl, 
  //         apiKey: !!apiKey,
  //         apiBaseUrlValue: apiBaseUrl,
  //         apiKeyValue: apiKey
  //       });
        
  //       return {
  //         success: false,
  //         message: 'API Base URL and API Key are required'
  //       };
  //     }

  //     // Ensure the URL has a proper format
  //     const formattedUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
      
  //     // Create headers with the API key
  //     const headers = {
  //       'Authorization': `Bearer ${apiKey}`,
  //       'Content-Type': 'application/json'
  //     };

  //     // Make a test request to the API
  //     let response;
      
  //     try {
  //       // First try to hit a common health endpoint
  //       response = await firstValueFrom(
  //         this.httpService.get(`${formattedUrl}/health`, { 
  //           headers,
  //           timeout: 10000 // 10 second timeout
  //         })
  //       );
  //     } catch (healthError) {
  //       try {
  //         // If health endpoint fails, try the base URL
  //         response = await firstValueFrom(
  //           this.httpService.get(formattedUrl, { 
  //             headers,
  //             timeout: 10000
  //           })
  //         );
  //       } catch (baseError) {
  //         // If both fail, throw the last error
  //         throw baseError;
  //       }
  //     }

  //     // Log the full response for debugging
  //     console.log('API response:', response);
      
  //     // Check if the response is successful
  //     if (response.status >= 200 && response.status < 300) {
  //       return {
  //         success: true,
  //         message: `API connection successful (Status: ${response.status})`
  //       };
  //     } else {
  //       return {
  //         success: false,
  //         message: `API returned unexpected status: ${response.status}`
  //       };
  //     }
  //   } catch (error) {
  //     // Handle different types of errors
  //     if (error instanceof AxiosError && error.response) {
  //       // The request was made and the server responded with a status code
  //       return {
  //         success: false,
  //         message: `API responded with error status: ${error.response.status} - ${error.response.statusText || 'Unknown error'}`
  //       };
  //     } else if (error instanceof AxiosError && error.request) {
  //       // The request was made but no response was received
  //       return {
  //         success: false,
  //         message: 'No response received from API. Please check if the URL is correct and the server is running.'
  //       };
  //     } else {
  //       // Something happened in setting up the request that triggered an Error
  //       return {
  //         success: false,
  //         message: `API connection failed: ${error.message}`
  //       };
  //     }
  //   }
  // }

  async testApiConnection(apiBaseUrl: string, apiKey: string): Promise<{ success: boolean, message: string }> {
  try {    
    // Validate input parameters
    if (!apiBaseUrl || !apiKey) {
      console.log('Validation failed:', { 
        apiBaseUrl: !!apiBaseUrl, 
        apiKey: !!apiKey,
        apiBaseUrlValue: apiBaseUrl,
        apiKeyValue: apiKey
      });
      
      return {
        success: false,
        message: 'API Base URL and API Key are required'
      };
    }

    // Ensure the URL has a proper format
    const formattedUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    
    // Create headers with the API key
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    // Make a test request to the API
    let response;
    
    try {
      // First try to hit a common health endpoint
      response = await axios.get(`${formattedUrl}`, { 
        headers,
        timeout: 10000 // 10 second timeout
      });
    } catch (healthError) {
      try {
        // If health endpoint fails, try the base URL
        response = await axios.get(formattedUrl, { 
          headers,
          timeout: 10000
        });
      } catch (baseError) {
        // If both fail, throw the last error
        throw baseError;
      }
    }

    // Check if the response is successful
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        message: `API connection successful (Status: ${response.status})`
      };
    } else {
      return {
        success: false,
        message: `API returned unexpected status: ${response.status}`
      };
    }
  } catch (error) {
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      return {
        success: false,
        message: `API responded with error status: ${error.response.status} - ${error.response.statusText || 'Unknown error'}`
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        message: 'No response received from API. Please check if the URL is correct and the server is running.'
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        success: false,
        message: `API connection failed: ${error.message}`
      };
    }
  }
}


  private async createDefaultSettings(): Promise<SettingsDocument> {
    const defaultSettings = new this.settingsModel({
      systemName: 'BICRIRMS Admin Dashboard',
      systemEmail: 'bdic@bdic.ng',
      currency: 'NGN',
      timezone: 'West Africa Time (WAT)',
      dateFormat: 'DD/MM/YYYY',
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newUserAlerts: true,
      requestAlerts: true,
      systemAlerts: true,
      sessionTimeout: 30,
      twoFactorAuth: true,
      passwordComplexity: true,
      limitLoginAttempts: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      apiBaseUrl: 'https://api.citizenship.benuestate.gov.ng',
      apiKey: 'sk_test_4242424242424242',
      webhookUrl: 'https://api.citizenship.benuestate.gov.ng/webhooks',
      webhookSecret: 'whsec_4242424242424242'
    });
    
    return defaultSettings.save();
  }
}