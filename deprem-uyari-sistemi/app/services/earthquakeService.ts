'use client';

import axios from 'axios';
import { EarthquakeResponse, Earthquake } from '../types';

// Örnek deprem verileri - API'ler çalışmadığında kullanılır
const SAMPLE_EARTHQUAKES: Earthquake[] = [
  {
    id: "1",
    date: "05.11.2023",
    time: "16:30:00",
    latitude: 40.9861,
    longitude: 28.7929,
    depth: 8.3,
    magnitude: 3.2,
    location: "İstanbul Silivri",
    province: "İstanbul"
  },
  {
    id: "2",
    date: "05.11.2023",
    time: "15:45:00",
    latitude: 41.0214,
    longitude: 28.9684,
    depth: 5.7,
    magnitude: 2.8,
    location: "İstanbul Beyoğlu",
    province: "İstanbul"
  },
  {
    id: "3",
    date: "05.11.2023",
    time: "14:12:00",
    latitude: 40.9732,
    longitude: 29.1226,
    depth: 7.1,
    magnitude: 2.5,
    location: "İstanbul Kadıköy",
    province: "İstanbul"
  },
  {
    id: "4", 
    date: "05.11.2023",
    time: "13:05:00",
    latitude: 38.4192,
    longitude: 27.1286,
    depth: 6.2,
    magnitude: 3.7,
    location: "İzmir Konak",
    province: "İzmir"
  },
  {
    id: "5",
    date: "05.11.2023",
    time: "12:30:00",
    latitude: 40.1885,
    longitude: 29.0610,
    depth: 5.0,
    magnitude: 2.9,
    location: "Bursa Merkez",
    province: "Bursa"
  },
  {
    id: "6",
    date: "05.11.2023",
    time: "11:45:00",
    latitude: 40.9861,
    longitude: 28.7929,
    depth: 6.8,
    magnitude: 3.5,
    location: "İstanbul Avcılar",
    province: "İstanbul"
  },
  {
    id: "7",
    date: "05.11.2023",
    time: "10:30:00",
    latitude: 41.0082,
    longitude: 28.9784,
    depth: 4.3,
    magnitude: 2.7,
    location: "İstanbul Fatih",
    province: "İstanbul"
  },
  {
    id: "8",
    date: "05.11.2023",
    time: "09:15:00",
    latitude: 40.9925,
    longitude: 29.0290,
    depth: 5.1,
    magnitude: 3.0,
    location: "İstanbul Üsküdar",
    province: "İstanbul"
  },
  {
    id: "9",
    date: "05.11.2023",
    time: "08:45:00",
    latitude: 40.9922,
    longitude: 29.1277,
    depth: 7.2,
    magnitude: 2.6,
    location: "İstanbul Maltepe",
    province: "İstanbul"
  },
  {
    id: "10",
    date: "05.11.2023",
    time: "07:30:00",
    latitude: 41.0183,
    longitude: 28.8487,
    depth: 5.9,
    magnitude: 3.1,
    location: "İstanbul Bağcılar",
    province: "İstanbul"
  }
];

// İstanbul için ek deprem verileri - daha güncel
const ISTANBUL_EARTHQUAKES: Earthquake[] = [
  {
    id: "ist-1",
    date: "05.11.2023",
    time: "23:45:00",
    latitude: 40.9861,
    longitude: 28.7929,
    depth: 5.3,
    magnitude: 3.4,
    location: "İstanbul Silivri Açıkları",
    province: "İstanbul"
  },
  {
    id: "ist-2",
    date: "05.11.2023",
    time: "22:30:00",
    latitude: 41.0214,
    longitude: 28.9684,
    depth: 6.7,
    magnitude: 2.9,
    location: "İstanbul Marmara Denizi",
    province: "İstanbul"
  },
  {
    id: "ist-3",
    date: "05.11.2023",
    time: "21:15:00",
    latitude: 40.9732,
    longitude: 29.1226,
    depth: 8.1,
    magnitude: 3.2,
    location: "İstanbul Adalar",
    province: "İstanbul"
  },
  {
    id: "ist-4",
    date: "05.11.2023",
    time: "20:05:00",
    latitude: 40.9925,
    longitude: 29.0290,
    depth: 4.8,
    magnitude: 3.3,
    location: "İstanbul Kartal",
    province: "İstanbul"
  },
  {
    id: "ist-5",
    date: "05.11.2023",
    time: "19:30:00",
    latitude: 41.0183,
    longitude: 28.8487,
    depth: 7.5,
    magnitude: 2.7,
    location: "İstanbul Bakırköy",
    province: "İstanbul"
  }
];

export const getLatestEarthquakes = async (limit: number = 100): Promise<EarthquakeResponse> => {
  try {
    console.log('Deprem verileri getiriliyor...');

    // Local API endpoint ile CORS sorununu aşıyoruz
    const apiUrl = '/api/earthquakes';
    
    // API isteği
    console.log(`API endpoint çağrılıyor: ${apiUrl}`);
    const response = await axios.get(apiUrl);
    
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      console.log(`API'den ${response.data.length} deprem verisi alındı`);
      
      return {
        status: true,
        message: 'Deprem verileri başarıyla alındı',
        count: response.data.length,
        result: response.data.slice(0, limit)
      };
    }
    
    // API bir hata objesi döndürdüyse
    if (response.data && response.data.error) {
      throw new Error(response.data.error);
    }
    
    // API yanıt verdi ama veri yoksa
    throw new Error('API yanıtı geçersiz veya deprem verisi yok');
  } catch (error) {
    console.error('Deprem verileri alınırken bir hata oluştu:', error);
    
    return {
      status: false,
      message: 'Deprem verileri alınamadı: ' + (error instanceof Error ? error.message : String(error)),
      count: 0,
      result: []
    };
  }
};

// Lokasyon bilgisinden il ismini çıkarma fonksiyonu - geliştirilmiş versiyon
export function extractProvince(location: string): string {
  // Boş veya undefined lokasyon kontrolü
  if (!location) return '';
  
  // Türkçe karakterlerle birlikte, lokasyonun küçük harfe çevrilmesi
  const lowercaseLocation = location.toLowerCase()
    .replace(/i̇/g, 'i') // i ile İ karışıklığını önlemek için
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Lokasyon içinde il adı arama için hazır ifadeler
  const provincePrefixes = ['ili', 'ilcesi', 'bolgesi', 'korfezi', 'aciklari'];
  
  // İstanbul için özel kontrol
  if (
    lowercaseLocation.includes('istanbul') || 
    lowercaseLocation.includes('ist.') || 
    lowercaseLocation.includes('ist ') ||
    lowercaseLocation.includes('ist-') ||
    /\bist\b/.test(lowercaseLocation) // Sadece "ist" kelimesi varsa
  ) {
    return 'İstanbul';
  }
  
  // Diğer popüler şehirler için özel kontroller
  const cityMappings = [
    { patterns: ['izmir', 'izm.', 'izm '], name: 'İzmir' },
    { patterns: ['ankara', 'ank.', 'ank '], name: 'Ankara' },
    { patterns: ['mugla', 'muğla'], name: 'Muğla' },
    { patterns: ['manisa'], name: 'Manisa' },
    { patterns: ['balikesir', 'balıkesir'], name: 'Balıkesir' },
    { patterns: ['canakkale', 'çanakkale'], name: 'Çanakkale' },
    { patterns: ['bursa'], name: 'Bursa' },
    { patterns: ['antalya'], name: 'Antalya' },
    { patterns: ['aydin', 'aydın'], name: 'Aydın' },
  ];
  
  for (const city of cityMappings) {
    if (city.patterns.some(pattern => lowercaseLocation.includes(pattern))) {
      return city.name;
    }
  }

  // İl adlarını bulmak için regex
  const regex = new RegExp(
    `\\b(${provincePrefixes.join('|')})\\b`, 'i'
  );
  
  const match = location.match(regex);
  if (match && match.index !== undefined) {
    // İl adı, muhtemelen lokasyonun başındadır
    const possibleProvince = location.substring(0, match.index).trim();
    if (possibleProvince && possibleProvince.length > 2) {
      return possibleProvince;
    }
  }
  
  // Eğer regex ile bulunamadıysa, lokasyonu boşluklara göre ayırıp ilk kelimeyi il olarak kabul et
  const parts = location.split(/[\s-]+/);
  if (parts.length > 0 && parts[0].length > 2) {
    return parts[0];
  }
  
  // Hiçbir şekilde il bulunamadıysa orijinal lokasyonu döndür
  return location;
}

// Tekrarlanan deprem kayıtlarını kaldır
function removeDuplicateEarthquakes(earthquakes: Earthquake[]): Earthquake[] {
  const uniqueMap = new Map<string, Earthquake>();
  
  earthquakes.forEach(eq => {
    // Lokasyon ve zaman bilgisine göre tekil anahtar oluştur
    const key = `${eq.latitude.toFixed(2)}-${eq.longitude.toFixed(2)}-${eq.magnitude.toFixed(1)}-${eq.date}-${eq.time.substring(0, 5)}`;
    
    // Eğer bu anahtar daha önce eklenmemişse veya daha yüksek büyüklüğe sahipse ekle
    if (!uniqueMap.has(key) || uniqueMap.get(key)!.magnitude < eq.magnitude) {
      uniqueMap.set(key, eq);
    }
  });
  
  return Array.from(uniqueMap.values());
}

// Depremleri tarihe göre sırala (en son olanlar önce)
function sortEarthquakesByDate(earthquakes: Earthquake[]): Earthquake[] {
  return [...earthquakes].sort((a, b) => {
    // Tarih karşılaştırma (GG.AA.YYYY formatı)
    const [aDay, aMonth, aYear] = a.date.split('.').map(Number);
    const [bDay, bMonth, bYear] = b.date.split('.').map(Number);
    
    const aDate = new Date(aYear, aMonth - 1, aDay);
    const bDate = new Date(bYear, bMonth - 1, bDay);
    
    if (aDate.getTime() !== bDate.getTime()) {
      return bDate.getTime() - aDate.getTime(); // Daha yeni tarihler önce
    }
    
    // Aynı tarih ise saate göre karşılaştır
    const [aHour, aMinute] = a.time.split(':').map(Number);
    const [bHour, bMinute] = b.time.split(':').map(Number);
    
    if (aHour !== bHour) {
      return bHour - aHour; // Daha geç saat önce
    }
    
    return bMinute - aMinute; // Daha geç dakika önce
  });
} 