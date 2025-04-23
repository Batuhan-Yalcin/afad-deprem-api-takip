'use client';

import axios from 'axios';
import { EarthquakeResponse } from '../types';

// API'nin base URL'si
const API_URL = 'https://api.orhanaydogdu.com.tr/deprem/kandilli/live';

export const getLatestEarthquakes = async (limit: number = 100): Promise<EarthquakeResponse> => {
  try {
    const response = await axios.get<EarthquakeResponse>(API_URL, {
      params: {
        limit
      }
    });
    return response.data;
  } catch (error) {
    console.error('Deprem verileri alınırken bir hata oluştu:', error);
    return {
      status: false,
      message: 'Veri alınamadı',
      count: 0,
      result: []
    };
  }
}; 