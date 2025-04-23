"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getLatestEarthquakes, extractProvince } from './services/earthquakeService';
import { Earthquake } from './types';
import EarthquakeCard from './components/EarthquakeCard';
import EarthquakeMap from './components/EarthquakeMap';
import LocationFilter from './components/LocationFilter';
import { FiBell, FiBellOff, FiRefreshCw, FiAlertTriangle } from "react-icons/fi";
import { GoLocation } from "react-icons/go";
import { BsArrowClockwise } from "react-icons/bs";

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
    <main className={`min-h-screen flex flex-col items-center p-4 md:p-8 ${bgColors[bgColorIndex]} transition-colors duration-1000`}>
      {/* 3D Efektli Başlık */}
      <div className="w-full flex flex-col items-center mb-8">
        <div className="flex items-center space-x-2 mb-2 relative">
          <h1 className="text-5xl font-bold text-white drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)] transition-all transform hover:scale-105 duration-300">
            🔥 Son 1 Günki Depremler 🔥
          </h1>
          
          <button 
            onClick={toggleNotifications}
            className="ml-4 p-3 rounded-full bg-white text-red-500 hover:bg-red-100 transition-all transform hover:scale-110 duration-200 shadow-lg hover:shadow-xl"
            title={notificationsEnabled ? "Bildirimleri Kapat" : "Bildirimleri Aç"}
          >
            {notificationsEnabled ? <FiBell size={24} /> : <FiBellOff size={24} />}
          </button>
        </div>
        
        <p className="text-white text-xl mb-4 drop-shadow-md">
          Türkiye'deki son 7 günün deprem verileri (AFAD)
        </p>
      </div>
      
      {/* Yükleniyor Animasyonu - 3D Dönen Deprem İkonu */}
      {loading && (
        <div className="w-full p-8 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-8 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-8 border-red-600 border-b-transparent border-l-transparent rounded-full animate-spin" style={{animationDuration: '1.2s'}}></div>
          </div>
        </div>
      )}
      
      {/* Hata Kartı - Daha Modern Tasarım */}
      {error && (
        <div className="w-full max-w-4xl p-6 bg-red-600 bg-opacity-90 text-white rounded-xl mb-6 shadow-xl transform transition-all hover:scale-102 duration-300 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <FiAlertTriangle size={40} className="mb-2 animate-pulse" />
            <div className="text-2xl font-bold mb-2">Veri Yüklenemiyor</div>
            <p className="text-center mb-4 text-lg">{error}</p>
            <button 
              onClick={handleRefresh} 
              disabled={isRetryingApi}
              className={`px-6 py-3 rounded-lg bg-white text-red-600 font-bold hover:bg-red-100 transition-all transform hover:scale-105 shadow-lg ${isRetryingApi ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="flex items-center">
                <FiRefreshCw className={`mr-2 ${isRetryingApi ? 'animate-spin' : ''}`} />
                {isRetryingApi ? 'Yenileniyor...' : 'Tekrar Dene'}
              </span>
            </button>
          </div>
        </div>
      )}
      
      {/* Ana İçerik - Kartlar ve Harita */}
      <div className="w-full flex flex-col lg:flex-row gap-6">
        {/* Sol Kolon - Deprem Listesi */}
        <div className="lg:w-1/2 transform transition-all duration-300 hover:translate-y-[-5px]">
          <LocationFilter 
            selectedCity={selectedCity}
            onCityChange={handleCityChange}
          />
          
          <div className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-md rounded-xl shadow-2xl p-6 mb-6 border border-blue-200 transform transition-all hover:shadow-blue-300/30 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold flex items-center space-x-2 text-blue-800">
                📊 Son Depremler
              </h2>
              <div className="flex items-center gap-3">
                <label htmlFor="magnitude" className="text-sm text-blue-900 font-medium">
                  Min. Büyüklük: <span className="text-red-600 font-bold">{magnitude}</span>
                </label>
                <input
                  id="magnitude"
                  type="range"
                  min="0"
                  max="7"
                  step="0.1"
                  value={magnitude}
                  onChange={(e) => setMagnitude(parseFloat(e.target.value))}
                  className="w-36 accent-red-500"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-blue-800 font-medium">
                {earthquakes.length > 0 ? (
                  <>
                    <span>Toplam <b className="text-red-600">{earthquakes.length}</b> deprem</span>
                    {selectedCity && <span>, <b className="text-indigo-600">{selectedCity}</b> ilinde <b className="text-red-600">{filteredEarthquakes.length}</b> deprem</span>}
                    {magnitude > 0 && <span>, <b className="text-orange-500">{magnitude}+</b> büyüklükte <b className="text-red-600">{magnitudeFilteredEarthquakes.length}</b> deprem</span>}
                  </>
                ) : (
                  <>Deprem verisi bulunamadı</>
                )}
              </div>
              
              <button 
                onClick={handleRefresh} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm shadow-md transform transition-all hover:scale-105 hover:shadow-lg"
                disabled={isRetryingApi}
              >
                <span className="flex items-center">
                  <FiRefreshCw className={`mr-1 ${isRetryingApi ? 'animate-spin' : ''}`} />
                  {isRetryingApi ? 'Yenileniyor...' : 'Yenile'}
                </span>
              </button>
            </div>

            {/* Yüksek Büyüklükteki Deprem Uyarısı */}
            {highMagnitudeCount > 0 && (
              <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-md text-sm animate-pulse">
                <span className="font-bold flex items-center">
                  <FiAlertTriangle className="mr-2" /> Dikkat!
                </span>
                <p>Son günlerde <span className="font-bold text-red-600 text-base">{highMagnitudeCount}</span> adet 4.0+ büyüklüğünde deprem meydana geldi.</p>
              </div>
            )}
            
            {/* Deprem Listesi - Animasyonlu Kartlar */}
            <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2 earthquake-list">
              {magnitudeFilteredEarthquakes.length > 0 ? (
                magnitudeFilteredEarthquakes.map((earthquake, index) => (
                  <div 
                    key={earthquake.id} 
                    onClick={() => setSelectedEarthquake(earthquake)}
                    className={`cursor-pointer transition-all transform duration-300 hover:-translate-y-1 hover:scale-102 ${
                      selectedEarthquake?.id === earthquake.id 
                        ? 'ring-2 ring-red-500 shadow-xl' 
                        : 'hover:shadow-lg'
                    }`}
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      animationName: 'fadeIn',
                      animationDuration: '0.5s',
                      animationFillMode: 'both'
                    }}
                  >
                    <EarthquakeCard earthquake={earthquake} />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-blue-800 py-10 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {earthquakes.length > 0 
                    ? 'Bu kriterlere uygun deprem bulunamadı' 
                    : 'Deprem verisi yüklenemiyor veya hiç deprem kaydı yok'
                  }
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sağ Kolon - Deprem Haritası */}
        <div className="lg:w-1/2 transform transition-all duration-300 hover:translate-y-[-5px]">
          <div className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-md rounded-xl shadow-2xl p-6 h-full border border-blue-200 transform transition-all hover:shadow-blue-300/30 duration-300">
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">🗺️ Deprem Haritası</h2>
            <div className="relative h-[600px] rounded-xl overflow-hidden shadow-xl">
              <EarthquakeMap 
                earthquakes={magnitudeFilteredEarthquakes} 
                selectedEarthquake={selectedEarthquake}
              />
              
              {/* İstatistik Kutusu */}
              <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-filter backdrop-blur-md rounded-lg p-3 z-10 text-sm font-medium shadow-lg border border-blue-300">
                <p className="text-blue-800 mb-1">Son 24 saat: <span className="font-bold text-red-600">{recentEarthquakes.length}</span> deprem</p>
                {selectedCity ? (
                  <p className="text-blue-800">
                    {selectedCity}: <span className="font-bold text-red-600">
                      {filteredEarthquakes.filter(eq => {
                        const province = eq.province || extractProvince(eq.location);
                        return province.toLowerCase().includes(selectedCity.toLowerCase()) || 
                              selectedCity.toLowerCase().includes(province.toLowerCase());
                      }).length}
                    </span> deprem
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer - 3D Shadow */}
      <footer className="mt-8 text-center text-white">
        <p className="text-2xl font-bold mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">Son Deprem Verileri (AFAD)</p>
        <p className="drop-shadow-md text-lg">Son güncelleme: {lastUpdated}</p>
        <p className="mt-4 text-sm opacity-90">Veri kaynağı: <a href="https://deprem.afad.gov.tr" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300 transition-colors">AFAD - Afet ve Acil Durum Yönetimi Başkanlığı</a></p>
      </footer>
      
      {/* Bildirim İzni Modal - Cam Efekti */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-md p-8 rounded-xl shadow-2xl max-w-md mx-4 border border-blue-300 transform transition-all hover:shadow-blue-500/30 duration-300">
            <h3 className="text-2xl font-bold mb-4 text-blue-800">Deprem Bildirimleri</h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Yeni depremler gerçekleştiğinde haberdar olmak ister misiniz? Önemli depremler için anlık bildirim alabilirsiniz.
            </p>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setShowNotificationModal(false)} 
                className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-gray-800 transition-all transform hover:scale-105"
              >
                Daha Sonra
              </button>
              <button 
                onClick={requestNotificationPermission} 
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white shadow-md transition-all transform hover:scale-105 hover:shadow-lg"
              >
                Bildirimleri Aç
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Styles - Gelişmiş Animasyonlar */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .earthquake-list::-webkit-scrollbar {
          width: 8px;
        }
        .earthquake-list::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .earthquake-list::-webkit-scrollbar-thumb {
          background: #93c5fd;
          border-radius: 10px;
          border: 2px solid #e5e7eb;
        }
        .earthquake-list::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }
        
        /* 3D Kartlar İçin Hover Efekti */
        .earthquake-card-3d {
          transition: transform 0.5s ease, box-shadow 0.5s ease;
          transform-style: preserve-3d;
        }
        
        .earthquake-card-3d:hover {
          transform: perspective(1000px) rotateX(2deg) rotateY(2deg);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
      `}</style>
    </main>
  );
}
