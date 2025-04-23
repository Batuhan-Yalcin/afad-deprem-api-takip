"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getLatestEarthquakes } from './services/earthquakeService';
import { Earthquake } from './types';
import EarthquakeCard from './components/EarthquakeCard';
import EarthquakeMap from './components/EarthquakeMap';
import { FiBell, FiBellOff, FiRefreshCw, FiAlertTriangle } from "react-icons/fi";
import { GoLocation } from "react-icons/go";

export default function Home() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [filteredEarthquakes, setFilteredEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [magnitude, setMagnitude] = useState<number>(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [bgColorIndex, setBgColorIndex] = useState(0);
  const [isRetryingApi, setIsRetryingApi] = useState<boolean>(false);
  const [apiAttempts, setApiAttempts] = useState<number>(0);
  
  // Lokasyondan il adını çıkaran yardımcı fonksiyon
  const extractProvince = (location: string): string | null => {
    if (!location) return null;
    
    // Lokasyon formatını kontrol et
    const parts = location.split('-').map(part => part.trim());
    if (parts.length > 1) {
      return parts[parts.length - 1]; // Son kısım genellikle il adıdır
    }
    
    // Alternatif format kontrolü
    const altParts = location.split('(');
    if (altParts.length > 1) {
      const possibleProvince = altParts[altParts.length - 1].replace(')', '').trim();
      return possibleProvince;
    }
    
    return null;
  };
  
  // Renk geçişleri için renkler - daha canlı ve modern renkler uygulanacak ! 
  const bgColors = [
    'bg-gradient-to-br from-blue-600 to-purple-700',
    'bg-gradient-to-br from-emerald-500 to-teal-800',
    'bg-gradient-to-br from-red-500 to-pink-600',
    'bg-gradient-to-br from-amber-500 to-orange-700',
    'bg-gradient-to-br from-indigo-600 to-blue-900'
  ];

  useEffect(() => {
    // Arka plan rengini belirli aralıklarla değiştir
    const colorInterval = setInterval(() => {
      setBgColorIndex(current => (current + 1) % bgColors.length);
    }, 8000); // Daha hızlı değişim
    
    return () => clearInterval(colorInterval);
  }, []);
  
  // Bildirim iznini kontrol et
  const checkNotificationPermission = () => {
    if ("Notification" in window) {
      return Notification.permission === "granted";
    }
    return false;
  };
  
  // Deprem verilerini çek
  const fetchEarthquakeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsRetryingApi(true);
    
    try {
      console.log('🔄 Deprem verileri getiriliyor... Deneme:', apiAttempts + 1);
      const response = await getLatestEarthquakes(500);
      
      if (response.status && response.result && response.result.length > 0) {
        console.log(`✅ ${response.result.length} deprem kaydı alındı.`);
        
        // İl bilgisi olmayan depremlere il bilgisi ekle
        const enhancedData = response.result.map(quake => {
          if (!quake.province && quake.location) {
            const province = extractProvince(quake.location);
            return { ...quake, province };
          }
          return quake;
        });
        
        setEarthquakes(enhancedData);
        setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
        
        // Filtre uygula
        if (selectedCity) {
          applyFilter(enhancedData, selectedCity);
        } else {
          setFilteredEarthquakes(enhancedData);
        }
        
        // APİ YANITI RESPONSE 200 İSE SAYACI SIFIRLA 
        setApiAttempts(0);
      } else {
        console.error('❌ API verisi boş veya geçersiz format:', response);
        
        // API YANITI ERROR İSE SAYACI ARTTIR.
        setApiAttempts(prev => prev + 1);
        
        if (apiAttempts >= 2) {
          // Eğer birkaç kez denedikten sonra hala başarısızsa, daha açık bir hata göster
          setError('API yanıt vermiyor veya veri formatı değişmiş olabilir. Lütfen daha sonra tekrar deneyin.');
        } else {
          setError('Deprem verileri alınamadı. Yeniden deneniyor...');
          // Otomatik yeniden deneme
          setTimeout(() => fetchEarthquakeData(), 5000);
        }
      }
    } catch (err) {
      console.error('❌ Veri alınırken hata oluştu:', err);
      
      // API çağrısı başarısız, sayacı artır
      setApiAttempts(prev => prev + 1);
      
      if (apiAttempts >= 2) {
        setError('Deprem verileri alınırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin ve daha sonra tekrar deneyin.');
      } else {
        setError('Bağlantı hatası. Yeniden deneniyor...');
        // Otomatik yeniden deneme
        setTimeout(() => fetchEarthquakeData(), 5000);
      }
    } finally {
      setLoading(false);
      setIsRetryingApi(false);
    }
  }, [selectedCity, apiAttempts]);

  // Sayfa yüklendiğinde ve belirli aralıklarla verileri çek
  useEffect(() => {
    // Bildirim iznini kontrol et
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
    
    // İlk veri çekme
    fetchEarthquakeData();
    
    // Her 5 dakikada bir yenile
    const interval = setInterval(() => {
      fetchEarthquakeData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchEarthquakeData]);

  // Bildirim izni iste
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Bu tarayıcı bildirimler için destek sunmuyor!");
      return;
    }
    
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        setNotificationsEnabled(true);
        // Hoşgeldin bildirimi gönder
        new Notification("Deprem Uyarı Sistemi", {
          body: "Deprem bildirimleri açıldı. Önemli depremler için bildirim alacaksınız.",
        });
      }
    } else if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
    
    setShowNotificationModal(false);
  };

  // Bildirim durumunu değiştir
  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
    } else {
      if (Notification.permission !== "granted") {
        setShowNotificationModal(true);
      } else {
        setNotificationsEnabled(true);
      }
    }
  };

  // Şehir seçildiğinde filtreleme yap
  useEffect(() => {
    if (earthquakes.length > 0) {
      if (selectedCity) {
        applyFilter(earthquakes, selectedCity);
      } else {
        setFilteredEarthquakes(earthquakes);
      }
    }
  }, [selectedCity, earthquakes]);

  // Şehir filtresini uygula
  const applyFilter = useCallback((data: Earthquake[], city: string | null) => {
    if (!city) {
      setFilteredEarthquakes(data);
      return;
    }

    // Türkçe karakterleri normalleştir
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c");
    };
    
    const normalizedCity = normalizeText(city);
    
    // İstanbul için özel kontrol (API'de bazen "istanbul", bazen "İstanbul" olarak geçebilir)
    const isIstanbul = normalizedCity === "istanbul";
    
    const filtered = data.filter(quake => {
      // Her deprem için il bilgisini çıkar
      const province = quake.province || extractProvince(quake.location);
      
      if (!province) return false;
      
      // İl bilgisini normalleştir
      const normalizedProvince = normalizeText(province);
      
      // İstanbul için özel kontrol
      if (isIstanbul && (normalizedProvince.includes("istanbul") || quake.location.toLowerCase().includes("istanbul"))) {
        return true;
      }
      
      // Genel kontrol - il adı eşleşiyor mu?
      return normalizedProvince.includes(normalizedCity) || normalizedCity.includes(normalizedProvince);
    });
    
    console.log(`Filtreleme sonucu: ${filtered.length} deprem bulundu`);
    setFilteredEarthquakes(filtered);
  }, []);

  const handleCityChange = useCallback((city: string | null) => {
    console.log('Seçilen şehir:', city);
    setSelectedCity(city);
    applyFilter(earthquakes, city);
  }, [earthquakes, applyFilter]);

  const handleRefresh = () => {
    setIsRetryingApi(true);
    setApiAttempts(0); // Yenileme butonuna basıldığında sayacı sıfırla
    fetchEarthquakeData();
  };

  // Son 24 saat içindeki depremleri filtrele
  const recentEarthquakes = filteredEarthquakes.filter(eq => {
    if (!eq.date || !eq.time) return false;
    
    try {
      const [day, month, year] = eq.date.split('.').map(Number);
      const [hour, minute, second] = eq.time.split(':').map(Number);
      
      if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
      
      const earthquakeDate = new Date(2000 + year, month - 1, day, hour, minute, second);
      const now = new Date();
      const hoursDiff = (now.getTime() - earthquakeDate.getTime()) / (1000 * 60 * 60);
      
      return hoursDiff <= 24;
    } catch (e) {
      console.error('Tarih ayrıştırma hatası:', eq.date, eq.time, e);
      return false;
    }
  });

  // Büyüklüğe göre filtrelenmiş depremler
  const magnitudeFilteredEarthquakes = filteredEarthquakes.filter(eq => eq.magnitude >= magnitude);

  // Yüksek büyüklükteki deprem sayısı
  const highMagnitudeCount = filteredEarthquakes.filter(eq => eq.magnitude >= 4.0).length;

  return (
    <main className={`min-h-screen flex flex-col items-center p-4 md:p-6 ${bgColors[bgColorIndex]} transition-colors duration-1000`}>
      {/* Başlık Bölümü - Daha Görsel */}
      <div className="w-full flex flex-col items-center mb-8 relative">
        {/* Görsel Efektler */}
        <div className="absolute top-0 left-5 w-20 h-20 bg-yellow-500 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-5 w-24 h-24 bg-red-500 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="flex items-center space-x-3 mb-2 relative">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg tracking-wide">
            <span className="inline-block transform hover:scale-105 transition-all duration-300">
              🔥 TÜRKİYE DEPREM HARİTASI 🔥
            </span>
          </h1>
          
          <button 
            onClick={toggleNotifications}
            className="ml-3 p-2 md:p-3 rounded-full bg-white text-red-500 hover:bg-red-100 transition transform hover:scale-110 shadow-lg"
            title={notificationsEnabled ? "Bildirimleri Kapat" : "Bildirimleri Aç"}
          >
            {notificationsEnabled ? <FiBell size={22} /> : <FiBellOff size={22} />}
          </button>
        </div>
        
        <p className="text-lg md:text-xl text-white opacity-90 drop-shadow">
          AFAD verilerine göre son 7 günün deprem bilgileri
        </p>
      </div>
      
      {/* Yükleniyor Animasyonu - Daha Modern */}
      {loading && (
        <div className="w-full p-8 flex justify-center items-center">
          <div className="relative">
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-24 h-3 bg-black opacity-20 rounded-full blur-md"></div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full border-b-4 border-t-4 border-red-500 animate-spin"></div>
              <div className="absolute w-20 h-20 rounded-full border-r-4 border-l-4 border-yellow-400 animate-spin" style={{animationDuration: '1.5s'}}></div>
              <p className="mt-6 text-white font-bold animate-pulse">YÜKLENİYOR...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Hata Mesajı - Daha Göze Çarpan */}
      {error && (
        <div className="w-full max-w-4xl p-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl mb-6 shadow-xl">
          <div className="flex flex-col items-center">
            <FiAlertTriangle size={40} className="mb-3 animate-pulse" />
            <h3 className="text-xl md:text-2xl font-bold mb-2">Veri Yüklenemiyor</h3>
            <p className="text-center mb-4">{error}</p>
            <button 
              onClick={handleRefresh} 
              disabled={isRetryingApi}
              className={`px-5 py-2 bg-white text-red-600 font-bold rounded-lg hover:bg-red-100 transition transform hover:scale-105 ${isRetryingApi ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span className="flex items-center">
                <FiRefreshCw className={`mr-2 ${isRetryingApi ? 'animate-spin' : ''}`} />
                {isRetryingApi ? 'Yenileniyor...' : 'Tekrar Dene'}
              </span>
            </button>
          </div>
        </div>
      )}
      
      {/* Ana İçerik */}
      <div className="w-full flex flex-col lg:flex-row gap-6">
        {/* Sol Kolon - Depremler */}
        <div className="lg:w-1/2 transform hover:-translate-y-1 transition-all duration-300">
          <div className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm rounded-xl shadow-xl p-5 mb-6 border border-blue-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-blue-800 flex items-center">
                📊 Son Depremler
              </h2>
              <div className="flex items-center gap-2">
                <label htmlFor="magnitude" className="text-sm text-blue-900 font-medium whitespace-nowrap">
                  Min: <span className="text-red-600 font-bold">{magnitude}</span>
                </label>
                <input
                  id="magnitude"
                  type="range"
                  min="0"
                  max="7"
                  step="0.1"
                  value={magnitude}
                  onChange={(e) => setMagnitude(parseFloat(e.target.value))}
                  className="w-24 md:w-32 accent-red-500"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4 bg-blue-50 p-3 rounded-lg text-sm">
              <div className="font-medium text-blue-800">
                {earthquakes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    <span>Toplam: <b className="text-red-600">{earthquakes.length}</b></span>
                    {selectedCity && <span> | <b className="text-indigo-600">{selectedCity}</b>: <b className="text-red-600">{filteredEarthquakes.length}</b></span>}
                    {magnitude > 0 && <span> | <b className="text-orange-500">{magnitude}+</b>: <b className="text-red-600">{magnitudeFilteredEarthquakes.length}</b></span>}
                  </div>
                ) : (
                  <>Deprem verisi bulunamadı</>
                )}
              </div>
              
              <button 
                onClick={handleRefresh} 
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center shadow transform hover:scale-105 transition"
                disabled={isRetryingApi}
              >
                <FiRefreshCw className={`mr-1 ${isRetryingApi ? 'animate-spin' : ''}`} />
                {isRetryingApi ? 'Yenileniyor...' : 'Yenile'}
              </button>
            </div>

            {/* Yüksek Büyüklükteki Deprem Uyarısı */}
            {highMagnitudeCount > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 rounded-md text-sm animate-pulse">
                <span className="font-bold flex items-center">
                  <FiAlertTriangle className="mr-2" /> DİKKAT!
                </span>
                <p className="mt-1">Son günlerde <span className="font-bold text-red-600">{highMagnitudeCount}</span> adet 4.0+ büyüklüğünde deprem kaydedildi.</p>
              </div>
            )}
            
            {/* Deprem Listesi */}
            <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1">
              {magnitudeFilteredEarthquakes.length > 0 ? (
                magnitudeFilteredEarthquakes.map((earthquake) => (
                  <div 
                    key={earthquake.id} 
                    onClick={() => setSelectedEarthquake(earthquake)}
                    className={`cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md ${
                      selectedEarthquake?.id === earthquake.id ? 'ring-2 ring-red-500 shadow-lg' : ''
                    }`}
                  >
                    <EarthquakeCard earthquake={earthquake} />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 py-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-lg mb-2 font-medium">Deprem bulunamadı</div>
                  <p className="text-sm text-center text-gray-400">Filtre ayarlarını değiştirerek daha fazla sonuç görebilirsiniz.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sağ Kolon - Harita */}
        <div className="lg:w-1/2 transform hover:-translate-y-1 transition-all duration-300">
          <div className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm rounded-xl shadow-xl p-5 h-full border border-blue-100">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-blue-800">
              🗺️ Deprem Haritası
            </h2>
            <div className="relative h-[500px] md:h-[530px] rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <EarthquakeMap 
                earthquakes={magnitudeFilteredEarthquakes} 
                selectedEarthquake={selectedEarthquake}
              />
              
              {/* İstatistik Bilgisi */}
              <div className="absolute top-3 left-3 bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm rounded-lg p-2 z-10 text-sm font-medium shadow border border-blue-100">
                <div className="flex items-center mb-1">
                  <GoLocation className="text-red-500 mr-1.5" />
                  <span className="text-blue-800 font-bold">İstatistikler</span>
                </div>
                <p className="text-blue-800 mb-1 flex items-center">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                  Son 24s: <span className="font-bold text-red-600 ml-1">{recentEarthquakes.length}</span>
                </p>
                {selectedCity && (
                  <p className="text-blue-800 flex items-center">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                    {selectedCity}: <span className="font-bold text-red-600 ml-1">
                      {filteredEarthquakes.filter(eq => {
                        const province = eq.province || extractProvince(eq.location);
                        return province?.toLowerCase().includes(selectedCity.toLowerCase()) || false;
                      }).length}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-8 text-center text-white">
        <div className="bg-black bg-opacity-30 backdrop-filter backdrop-blur-sm p-4 rounded-xl">
          <p className="font-bold text-xl mb-1">AFAD Resmi Verileri</p>
          <p className="mb-2">Son güncelleme: {lastUpdated || "Henüz güncelleme yok"}</p>
          <p className="text-sm opacity-70">
            Veri kaynağı: <a href="https://deprem.afad.gov.tr" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">AFAD - Afet ve Acil Durum Yönetimi Başkanlığı</a>
          </p>
        </div>
      </footer>
      
      {/* Bildirim İzni Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md mx-auto">
            <h3 className="text-xl font-bold mb-3 text-blue-800">Deprem Bildirimleri</h3>
            <p className="mb-4 text-gray-700">
              Yeni depremler gerçekleştiğinde haberdar olmak ister misiniz? Önemli depremler için bildirimleri açabilirsiniz.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowNotificationModal(false)} 
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800"
              >
                Daha Sonra
              </button>
              <button 
                onClick={requestNotificationPermission} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white shadow"
              >
                Bildirimleri Aç
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Özel Stil */}
      <style jsx global>{`
        /* Kaydırma çubuğu stili */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #93c5fd;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }
      `}</style>
    </main>
  );
} 