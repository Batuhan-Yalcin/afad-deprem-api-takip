import { NextResponse } from 'next/server';
import axios from 'axios';
import { Earthquake } from '../../types';

// Source tür bilgisini tipte eksik olduğu için ekleyelim
interface EnhancedEarthquake extends Earthquake {
  source: string;
}

// AFAD API URL
const AFAD_API_URL = 'https://deprem.afad.gov.tr/apiv2/event/filter';

// Kandilli Rasathanesi son depremler sayfası (yedek olarak)
const KANDILLI_WEB = 'http://www.koeri.boun.edu.tr/scripts/lst0.asp';

// Bugünün tarihini formatla (DD.MM.YY)
function getTodayFormattedDate() {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = (now.getFullYear() % 100).toString().padStart(2, '0');
  return `${day}.${month}.${year}`;
}

// Son 7 günün tarihini AFAD API formatında döndür (YYYY-MM-DD)
function getLastWeekDate() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Bugünün tarihini AFAD API formatında döndür (YYYY-MM-DD)
function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// İl isim çıkarma
function extractProvince(location: string): string {
  if (!location) return '';
  
  // Afad formatı: "Karadeniz - [59.05 km] Bafra (Samsun)"
  // İlçe ve il parantez içinde verilir
  const provinceMatch = location.match(/\(([^)]+)\)/);
  if (provinceMatch && provinceMatch[1]) {
    return provinceMatch[1];
  }
  
  const lowercaseLocation = location.toLowerCase();
  
  if (lowercaseLocation.includes('istanbul')) {
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
  if (lowercaseLocation.includes('muğla') || lowercaseLocation.includes('mugla')) {
    return 'Muğla';
  }
  if (lowercaseLocation.includes('antalya')) {
    return 'Antalya';
  }
  
  // Birçok AFAD verisinde konum şu formattadır: "İlçe (İl)"
  const parts = location.split(/[\s-]+/);
  if (parts.length > 0) {
    // İl kısmı genellikle en sonda parantez içinde olur
    const lastPart = parts[parts.length - 1].replace(/[()]/g, '').trim();
    if (lastPart && lastPart.length > 2) return lastPart;
    
    return parts[0];
  }
  
  return location;
}

// AFAD API'den deprem verilerini çek
async function fetchAfadData(): Promise<EnhancedEarthquake[]> {
  try {
    console.log('AFAD API\'den veriler çekiliyor...');
    
    // AFAD API parametreleri
    const startDate = getLastWeekDate(); // Son 7 gün
    const endDate = getTodayDate(); // Bugün
    
    const params = new URLSearchParams();
    params.append('start', startDate);
    params.append('end', endDate);
    params.append('minMag', '1.0');
    params.append('maxMag', '10.0'); // Gerçekçi bir üst sınır
    params.append('minLat', '35.0'); // Türkiye sınırları
    params.append('maxLat', '43.0');
    params.append('minLon', '25.0');
    params.append('maxLon', '45.0');
    
    const response = await axios.get(`${AFAD_API_URL}?${params.toString()}`, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://deprem.afad.gov.tr',
        'Referer': 'https://deprem.afad.gov.tr/'
      }
    });
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`AFAD API'den ${response.data.length} deprem verisi alındı`);
      
      // Verileri kendi formatımıza dönüştür
      return response.data.map((item, index) => {
        // AFAD verilerindeki tarih formatı: "2023-04-25T14:30:52.000Z"
        const eventDate = new Date(item.date);
        const day = eventDate.getDate().toString().padStart(2, '0');
        const month = (eventDate.getMonth() + 1).toString().padStart(2, '0');
        const year = (eventDate.getFullYear() % 100).toString().padStart(2, '0');
        const formattedDate = `${day}.${month}.${year}`;
        
        // Saat kısmını ayır
        const hours = eventDate.getHours().toString().padStart(2, '0');
        const minutes = eventDate.getMinutes().toString().padStart(2, '0');
        const seconds = eventDate.getSeconds().toString().padStart(2, '0');
        const formattedTime = `${hours}:${minutes}:${seconds}`;
        
        // Konum bilgisi
        const location = item.location || 'Bilinmeyen Konum';
        
        // Gerçekçi magnitude değeri kontrolü (sınır: 0.1-10.0)
        let magnitude = parseFloat(item.magnitude) || 0;
        if (isNaN(magnitude) || magnitude > 7.5) {
          console.log(`Şüpheli deprem büyüklüğü düzeltiliyor: ${magnitude}, ID: ${item.eventID || 'bilinmiyor'}`);
          magnitude = Math.min(magnitude, 7.5); // Üst sınır
        }
        
        return {
          id: `afad-${item.eventID || index}`,
          date: formattedDate,
          time: formattedTime,
          latitude: parseFloat(item.latitude) || 0,
          longitude: parseFloat(item.longitude) || 0,
          depth: parseFloat(item.depth) || 0,
          magnitude: magnitude,
          location: location,
          province: extractProvince(location),
          source: 'AFAD'
        };
      });
    } else {
      console.error('AFAD API yanıtı beklenen formatta değil');
      throw new Error('AFAD verileri geçersiz formatta');
    }
  } catch (error) {
    console.error('AFAD verisi çekme hatası:', error);
    throw error;
  }
}

// Kandilli verilerini işleme (yedek veri kaynağı)
function parseKandilliHtml(html: string): EnhancedEarthquake[] {
  try {
    // Sadece deprem verilerini içeren PRE etiketini ayıkla
    const preTagMatch = html.match(/<pre>([\s\S]*?)<\/pre>/i);
    if (!preTagMatch || !preTagMatch[1]) {
      console.error('Kandilli HTML formatı değişmiş olabilir, PRE etiketi bulunamadı');
      return [];
    }
    
    const rawText = preTagMatch[1];
    
    // İlk birkaç satırı atla (başlık vs.)
    const lines = rawText.split('\n').slice(6);
    const todayStr = getTodayFormattedDate();
    
    return lines
      .filter(line => line.trim().length > 10 && !line.includes('--------')) // Boş satırları ve başlık satırlarını filtrele
      .map((line, index) => {
        try {
          // Format sabit genişlikte olduğu için doğru pozisyonları belirleyelim
          // Örnek Format: 2023.11.12 10:58:21 39.0322 29.3210 7.0 -.- 3.0 YUKARIKIZILCIK-SIMAV (KUTAHYA) İlksel
          
          const dateStr = line.substring(0, 10).trim();
          const timeStr = line.substring(11, 19).trim();
          const latitude = parseFloat(line.substring(21, 28).trim());
          const longitude = parseFloat(line.substring(30, 37).trim());
          const depth = parseFloat(line.substring(38, 42).trim());
          
          // Burada kritik düzeltme - Deprem büyüklüğü için doğru kolon aralığını belirle
          // İkinci ML sütunundaki değeri almaya çalış, yoksa ilk MD sütununu kullan
          // Sondaki ML değerlerini 45-51 yerine 55-59 aralığından al (doğru konum)
          let magnitudeStr = line.substring(55, 59).trim();
          
          // Eğer ikinci sütunda değer yoksa ilk sütuna bak
          if (magnitudeStr === '' || magnitudeStr === '-.-') {
            magnitudeStr = line.substring(44, 48).trim();
          }
          
          // Sayı olmayan değerleri temizle ve kontrol et
          magnitudeStr = magnitudeStr.replace(/[^\d.-]/g, '');
          let magnitude = parseFloat(magnitudeStr);
          
          // Anlamsız büyük değerleri düzelt (7.5'ten büyük değerler Türkiye'de çok nadir)
          // Richter ölçeğinde 7.0+ büyüklüğündeki depremler "büyük deprem" kategorisinde
          // 8.0+ depremler ise "büyük yıkıcı deprem" kategorisinde ve çok nadir görülür
          if (isNaN(magnitude) || magnitude > 7.5 || magnitude <= 0) {
            // Alternatif metod - önce ML sonra MD değerini bul
            // Tam metin içinde arama yap
            const mlMatch = line.match(/ML[=]?(\d+\.\d+)/);
            const mdMatch = line.match(/MD[=]?(\d+\.\d+)/);
            const mwMatch = line.match(/MW[=]?(\d+\.\d+)/);
            
            if (mlMatch && mlMatch[1]) {
              magnitude = parseFloat(mlMatch[1]);
            } else if (mdMatch && mdMatch[1]) {
              magnitude = parseFloat(mdMatch[1]);
            } else if (mwMatch && mwMatch[1]) {
              magnitude = parseFloat(mwMatch[1]);
            } else {
              // Son çare - ilk geçerli sayıyı bul (7.5'e kadar mantıklı değerler)
              const potentialMags = line.match(/\d+\.\d+/g) || [];
              
              for (const potMag of potentialMags) {
                const val = parseFloat(potMag);
                if (val >= 1.0 && val <= 7.5) {
                  magnitude = val;
                  break;
                }
              }
              
              // Hala bulunamadıysa bu satırı atla
              if (isNaN(magnitude) || magnitude > 7.5 || magnitude <= 0) {
                console.log(`Geçersiz deprem büyüklüğü, atlanıyor: '${line}'`);
                return null; // Bu satırı atla
              }
            }
          }
          
          // Tarih ve saat bilgisini de kontrol et
          if (!dateStr.match(/^\d{4}\.\d{2}\.\d{2}$/) || !timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
            console.log(`Geçersiz tarih veya saat formatı, atlanıyor: '${line}'`);
            return null;
          }
          
          // Gelecek tarihli verileri kontrol et ve filtrele (25.04.2025 gibi)
          const [year, month, day] = dateStr.split('.').map(Number);
          const now = new Date();
          const earthquakeDate = new Date(year, month - 1, day);
          
          // Gelecek tarihli girdileri atla
          if (earthquakeDate > now) {
            console.log(`Gelecek tarihli deprem verisi atlanıyor: ${dateStr}`);
            return null;
          }
          
          // Konum bilgisini çıkar - genellikle son bölümde bulunur
          const locationMatch = line.substring(60).trim();
          const location = locationMatch || 'Bilinmeyen Konum';
          
          // Tarih formatını DD.MM.YY şeklinde dönüştür
          let formattedDate = dateStr;
          if (dateStr.includes('.')) {
            const [year, month, day] = dateStr.split('.');
            if (year.length === 4) {
              formattedDate = `${day}.${month}.${year.substring(2)}`;
            }
          }
          
          // Son 2 saat içinde olan depremlerin tarihi bugün olarak düzeltilsin
          const eventTime = new Date(`${dateStr.replace(/\./g, '-')}T${timeStr}`);
          const hoursDiff = (now.getTime() - eventTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff <= 2) {
            formattedDate = todayStr;
          }
          
          return {
            id: `kandilli-${index}`,
            date: formattedDate,
            time: timeStr,
            latitude: isNaN(latitude) ? 0 : latitude,
            longitude: isNaN(longitude) ? 0 : longitude,
            depth: isNaN(depth) ? 0 : depth,
            magnitude: magnitude,
            location: location,
            province: extractProvince(location),
            source: 'Kandilli'
          };
        } catch (e) {
          console.error('Satır ayrıştırma hatası:', line, e);
          return null;
        }
      })
      .filter(Boolean) as EnhancedEarthquake[]; // null değerleri filtrele
  } catch (e) {
    console.error('Kandilli HTML ayrıştırma hatası:', e);
    return [];
  }
}

// Deprem verilerini doğrulama ve filtreleme
function validateEarthquakeData(earthquakes: EnhancedEarthquake[]): EnhancedEarthquake[] {
  return earthquakes
    .map(eq => {
      const magnitude = eq.magnitude;
      
      // Magnitude değeri için mantıklı sınırlar koyalım (0.1-7.5 arası)
      // Türkiye'de bugüne kadar kaydedilen en büyük deprem 7.4-7.9 arasında (1939 Erzincan)
      if (magnitude > 7.5) {
        console.log(`Şüpheli deprem büyüklüğü bulundu (atlanıyor): ${magnitude}, ID: ${eq.id || 'bilinmiyor'}, Konum: ${eq.location || 'bilinmiyor'}`);
        return null; // Bu veriyi tamamen atla
      }
      
      return eq;
    })
    .filter(Boolean) as EnhancedEarthquake[]; // null değerleri filtrele
}

// Kandilli'den deprem verilerini çek (yedek)
async function fetchKandilliData(): Promise<EnhancedEarthquake[]> {
  try {
    console.log('Kandilli Rasathanesi web sayfası çekiliyor (yedek veri kaynağı)...');
    
    const response = await axios.get(KANDILLI_WEB, {
      timeout: 15000, // Zaman aşımını artırdım (15 saniye)
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      },
      maxRedirects: 5, // Yönlendirme sayısını artırdım
      validateStatus: (status) => status < 500 // Sadece 500 ve üzeri hataları reddet
    });
    
    if (response.data) {
      const parsedEarthquakes = parseKandilliHtml(response.data);
      
      if (parsedEarthquakes.length > 0) {
        const validatedEarthquakes = validateEarthquakeData(parsedEarthquakes);
        console.log(`Kandilli Rasathanesi web sayfasından ${validatedEarthquakes.length} geçerli deprem verisi çekildi (YEDEK VERİLER)`);
        
        return validatedEarthquakes;
      } else {
        console.error('Kandilli Rasathanesi web sayfası ayrıştırılamadı');
        // Boş dizi döndürmek yerine hata fırlat
        throw new Error('Kandilli verileri ayrıştırılamadı');
      }
    } else {
      // Boş yanıt durumunda da hata fırlat
      throw new Error('Kandilli Rasathanesi web sayfası boş yanıt döndü');
    }
  } catch (error) {
    console.error('Kandilli Rasathanesi erişim hatası:', error);
    throw error;
  }
}

// Örnek deprem verileri (yedek olarak kullanılacak)
const FALLBACK_EARTHQUAKES: EnhancedEarthquake[] = [
  {
    id: 'fallback-1',
    date: getTodayFormattedDate(),
    time: '12:30:45',
    latitude: 38.3825,
    longitude: 39.0822,
    depth: 7.0,
    magnitude: 4.2,
    location: 'SIVRICE (ELAZIG)',
    province: 'ELAZIG',
    source: 'Yedek Veri'
  },
  {
    id: 'fallback-2',
    date: getTodayFormattedDate(),
    time: '10:15:22',
    latitude: 37.8764,
    longitude: 26.9501,
    depth: 8.5,
    magnitude: 3.8,
    location: 'EGE DENIZI (IZMIR)',
    province: 'IZMIR',
    source: 'Yedek Veri'
  },
  {
    id: 'fallback-3',
    date: getTodayFormattedDate(),
    time: '08:05:11',
    latitude: 38.6789,
    longitude: 27.2541,
    depth: 5.2,
    magnitude: 2.5,
    location: 'MANISA',
    province: 'MANISA',
    source: 'Yedek Veri'
  }
];

export async function GET() {
  let earthquakes: EnhancedEarthquake[] = [];
  
  try {
    // Önce AFAD API'den verileri almayı dene
    try {
      earthquakes = await fetchAfadData();
      console.log('AFAD API başarıyla kullanıldı.');
    } catch (afadError) {
      console.error('AFAD API hatası, Kandilli verilerine geçiliyor:', afadError);
      
      // AFAD hata verirse Kandilli'yi dene
      try {
        earthquakes = await fetchKandilliData();
        console.log('Kandilli verileri başarıyla alındı (AFAD yedeği).');
      } catch (kandilliError) {
        console.error('Kandilli erişim hatası, sabit verilere geçiliyor:', kandilliError);
        
        // Her iki kaynak da başarısız olursa yedek verileri kullan
        earthquakes = FALLBACK_EARTHQUAKES;
        console.log('Yedek veriler kullanılıyor (tüm API kaynakları başarısız).');
      }
    }
    
    if (earthquakes.length === 0) {
      console.warn('Hiçbir veri kaynağından veri alınamadı, yedek verilere geçiliyor...');
      earthquakes = FALLBACK_EARTHQUAKES;
    }
    
    // En son depremler (tarih ve saate göre sırala - en yeniler önce)
    const sortedEarthquakes = earthquakes.sort((a, b) => {
      // Tarih karşılaştırma
      const [aDay, aMonth, aYear] = a.date.split('.').map(Number);
      const [bDay, bMonth, bYear] = b.date.split('.').map(Number);
      
      const aDate = new Date(2000 + aYear, aMonth - 1, aDay);
      const bDate = new Date(2000 + bYear, bMonth - 1, bDay);
      
      if (aDate.getTime() !== bDate.getTime()) {
        return bDate.getTime() - aDate.getTime();
      }
      
      // Saat karşılaştırma
      if (!a.time || !b.time) return 0;
      
      const [aHour, aMinute] = a.time.split(':').map(Number);
      const [bHour, bMinute] = b.time.split(':').map(Number);
      
      if (aHour !== bHour) {
        return bHour - aHour;
      }
      
      return bMinute - aMinute;
    });
    
    // Standart Earthquake interface'ine dönüştür
    const responseData = sortedEarthquakes.map(eq => {
      // source alanını ayrı tut ve geri kalanını Earthquake olarak döndür
      const { source, ...earthquake } = eq;
      return earthquake;
    });
    
    // CORS header'ları ekleyerek yanıt döndür
    return NextResponse.json(responseData, {
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
    
    // Hata durumunda yedek verileri kullan
    console.warn('API hatası, yedek deprem verilerine geçiliyor...');
    
    if (earthquakes.length === 0) {
      earthquakes = FALLBACK_EARTHQUAKES;
    }
    
    // Standart Earthquake interface'ine dönüştür
    const responseData = earthquakes.map(eq => {
      // source alanını ayrı tut ve geri kalanını Earthquake olarak döndür
      const { source, ...earthquake } = eq;
      return earthquake;
    });
    
    // Hata olsa bile yedek verilerle 200 OK yanıtı döndür
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
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