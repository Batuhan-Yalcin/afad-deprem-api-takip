import { NextResponse } from 'next/server';
import axios from 'axios';
import { Earthquake } from '../../types';

// AFAD Resmi API
const AFAD_API = 'https://deprem.afad.gov.tr/apiv2/event/filter';

// Bugünün ve son 7 günün tarihlerini alalım
function getDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1); // Son 1 gün
  
  // YYYY-MM-DD formatına çevir
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate)
  };
}

// İl isim çıkarma
function extractProvince(location: string): string {
  if (!location) return '';
  
  const lowercaseLocation = location.toLowerCase();
  
  if (lowercaseLocation.includes('istanbul') || lowercaseLocation.includes('ist')) {
    return 'İstanbul';
  }
  if (lowercaseLocation.includes('izmir')) {
    return 'İzmir';
  }
  if (lowercaseLocation.includes('ankara')) {
    return 'Ankara';
  }
  if (lowercaseLocation.includes('bursa')) {
    return 'Bursa';
  }
  
  const parts = location.split(/[\s-]+/);
  if (parts.length > 0) {
    return parts[0];
  }
  
  return location;
}

export async function GET() {
  try {
    // Sunucu tarafında API çağrıları
    const allEarthquakes: Earthquake[] = [];
    const dateRange = getDateRange();
    
    console.log('AFAD resmi API çağrılıyor...');
    
    // AFAD API parametreleri
    const params = {
      start: dateRange.start, // Son 7 gün
      end: dateRange.end,
      orderby: 'time',        // Zamana göre sırala
      minmag: 1.0,            // En az 1.0 büyüklüğünde
      limit: 200              // Makul sayıda deprem verisi
    };
    
    try {
      // AFAD API çağrısı
      const response = await axios.get(AFAD_API, { 
        params,
        timeout: 10000  // Timeout süresini normale çevir
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`AFAD API'sinden ${response.data.length} deprem verisi alındı`);
        
        // AFAD API'den gelen verileri formatlama
        const earthquakes = response.data.map((eq: any, index: number) => {
          // Tarih ve saat bilgisini ayırma
          const eventDate = new Date(eq.date);
          const dateStr = `${eventDate.getDate().toString().padStart(2, '0')}.${(eventDate.getMonth() + 1).toString().padStart(2, '0')}.${eventDate.getFullYear()}`;
          const timeStr = `${eventDate.getHours().toString().padStart(2, '0')}:${eventDate.getMinutes().toString().padStart(2, '0')}:${eventDate.getSeconds().toString().padStart(2, '0')}`;
          
          // Lokasyonu ayırma
          const locationParts = eq.location.split('(');
          const locationName = locationParts[0].trim();
          const locationProvince = locationParts.length > 1 
            ? locationParts[1].replace(')', '').trim() 
            : extractProvince(locationName);
          
          return {
            id: `afad-${eq.eventID || index}`,
            date: dateStr,
            time: timeStr,
            latitude: parseFloat(eq.latitude) || 0,
            longitude: parseFloat(eq.longitude) || 0,
            depth: parseFloat(eq.depth) || 0,
            magnitude: parseFloat(eq.magnitude) || 0,
            location: locationName,
            province: locationProvince
          };
        });
        
        allEarthquakes.push(...earthquakes);
      } else {
        throw new Error('AFAD API geçersiz veri formatı döndürdü');
      }
    } catch (error) {
      console.error('AFAD API hatası:', error);
      throw new Error('AFAD verilerine erişilemedi, lütfen daha sonra tekrar deneyin');
    }
    
    // API'dan veri gelmezse hata fırlat
    if (allEarthquakes.length === 0) {
      throw new Error('Deprem verisi bulunamadı, lütfen daha sonra tekrar deneyin');
    }
    
    // En son depremler (tarih ve saate göre sırala)
    const sortedEarthquakes = allEarthquakes.sort((a, b) => {
      // Tarih karşılaştırma
      const [aDay, aMonth, aYear] = a.date.split('.').map(Number);
      const [bDay, bMonth, bYear] = b.date.split('.').map(Number);
      
      const aDate = new Date(aYear, aMonth - 1, aDay);
      const bDate = new Date(bYear, bMonth - 1, bDay);
      
      if (aDate.getTime() !== bDate.getTime()) {
        return bDate.getTime() - aDate.getTime();
      }
      
      // Saat karşılaştırma
      const [aHour, aMinute] = a.time.split(':').map(Number);
      const [bHour, bMinute] = b.time.split(':').map(Number);
      
      if (aHour !== bHour) {
        return bHour - aHour;
      }
      
      return bMinute - aMinute;
    });
    
    // CORS header'ları ekleyerek yanıt döndür
    return NextResponse.json(sortedEarthquakes, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Deprem verileri getirme hatası:', error);
    
    // Hata durumunda boş dizi ve uygun hata mesajı döndür
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Deprem verileri alınamadı' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
}

// CORS için OPTIONS isteğini yanıtla
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
} 