'use client';

import React from 'react';
import { Earthquake } from '../types';
import { motion } from 'framer-motion';

interface EarthquakeCardProps {
  earthquake: Earthquake;
}

const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude >= 5.0) return 'bg-red-500 text-white';
  if (magnitude >= 4.0) return 'bg-orange-500 text-white';
  if (magnitude >= 3.0) return 'bg-yellow-500 text-black';
  return 'bg-green-500 text-white';
};

// Popüler şehirleri vurgulama fonksiyonu
const highlightCity = (location: string): React.ReactNode => {
  const popularCities = ['İstanbul', 'İzmir', 'Ankara', 'Muğla', 'Balıkesir', 'Manisa'];
  
  for (const city of popularCities) {
    // Türkçe karakterleri normalize ederek kontrol et
    if (location.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) {
      const parts = location.split(new RegExp(`(${city})`, 'i'));
      return (
        <>
          {parts.map((part, i) => 
            part.toLowerCase() === city.toLowerCase() ? 
              <span key={i} className="font-bold text-blue-600">{part}</span> : 
              part
          )}
        </>
      );
    }
  }
  
  return location;
};

// Son kaç dakika önce olduğunu hesaplayan yardımcı fonksiyon
const getTimeAgo = (date: string, time: string): string => {
  if (!date || !time) return '';
  
  const [day, month, year] = date.split('.').map(Number);
  const [hour, minute, second] = time.split(':').map(Number);
  
  const earthquakeDate = new Date(2000 + year, month - 1, day, hour, minute, second);
  const now = new Date();
  const diffMs = now.getTime() - earthquakeDate.getTime();
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffMins < 60) {
    return `${diffMins} dakika önce`;
  } else if (diffHours < 24) {
    return `${diffHours} saat önce`;
  } else {
    return `${Math.floor(diffHours / 24)} gün önce`;
  }
};

// Yeni deprem mi kontrol et (son 3 saat içinde)
const isRecent = (earthquake: Earthquake) => {
  if (!earthquake.date || !earthquake.time) return false;
  
  const [day, month, year] = earthquake.date.split('.').map(Number);
  const [hour, minute, second] = earthquake.time.split(':').map(Number);
  
  const earthquakeDate = new Date(2000 + year, month - 1, day, hour, minute, second);
  const now = new Date();
  const hoursDiff = (now.getTime() - earthquakeDate.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff <= 3;
};

// Büyüklük ve konum bilgilerini analiz ederek tehlike seviyesini ölçme
const getDangerLevel = (earthquake: Earthquake) => {
  const population = getPopulationRisk(earthquake.province || '');
  
  if (earthquake.magnitude >= 5.5) return 'Çok Yüksek Risk';
  if (earthquake.magnitude >= 4.5 && population === 'high') return 'Yüksek Risk';
  if (earthquake.magnitude >= 4.0) return 'Orta Risk';
  if (earthquake.magnitude >= 3.0 && population === 'high') return 'Dikkat';
  return null;
};

// Nüfus yoğunluğuna göre risk seviyesi
const getPopulationRisk = (province: string) => {
  const highPopulationCities = ['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana', 'konya'];
  return highPopulationCities.includes(province.toLowerCase()) ? 'high' : 'normal';
};

// İl ismini vurgulayarak göster
const highlightProvince = (location: string): React.ReactNode => {
  const popularCities = ['İstanbul', 'İzmir', 'Muğla', 'Manisa', 'Balıkesir', 'Ankara'];
  
  // Lokasyondan il adını çıkar
  const province = extractProvince(location);
  
  if (!province) return location;
  
  // Popüler şehirleri vurgula
  if (popularCities.some(city => 
    province.toLowerCase().includes(city.toLowerCase()) ||
    city.toLowerCase().includes(province.toLowerCase())
  )) {
    return (
      <span>
        {location.replace(province, '')}
        <strong className="text-red-600">{province}</strong>
      </span>
    );
  }
  
  return location;
};

// Lokasyondan il adını çıkar
const extractProvince = (location: string): string | null => {
  if (!location) return null;
  
  const parts = location.split('-').map(part => part.trim());
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  
  return null;
};

const EarthquakeCard = ({ earthquake }: EarthquakeCardProps) => {
  const { date, time, latitude, longitude, depth, magnitude, location, type } = earthquake;
  
  // Son 24 saat içinde olan depremi belirle
  const isRecent = () => {
    const now = new Date();
    const earthquakeDate = new Date(earthquake.date);
    const hoursDifference = (now.getTime() - earthquakeDate.getTime()) / (1000 * 60 * 60);
    return hoursDifference <= 24;
  };

  // Depremin büyüklüğüne göre renk belirleme
  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude >= 5.0) return 'text-red-600';
    if (magnitude >= 4.0) return 'text-orange-500';
    if (magnitude >= 3.0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const timeAgo = getTimeAgo(date, time);

  const dangerLevel = getDangerLevel(earthquake);
  const recent = isRecent();

  return (
    <motion.div 
      className={`earthquake-card-3d bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 ${
        magnitude >= 5.0 ? 'border-red-500' : 
        magnitude >= 4.0 ? 'border-orange-500' : 
        magnitude >= 3.0 ? 'border-yellow-400' : 'border-green-400'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Yeni Deprem İşareti - Animasyonlu */}
      {recent && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-pulse z-10 font-bold">
          YENİ!
        </div>
      )}
      
      {/* Çok Yeni Deprem İşareti - Daha Belirgin */}
      {isRecent() && (
        <div className="absolute -top-2 -left-2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full shadow-lg z-10 font-bold flex items-center">
          <span className="inline-block h-2 w-2 bg-white rounded-full mr-1 animate-ping"></span>
          CANLI
        </div>
      )}
      
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">
            {highlightCity(location)}
            {recent && (
              <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full animate-pulse">
                Yeni
              </span>
            )}
          </h3>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <span className="mr-2">{date}</span>
            <span className="font-medium">|</span>
            <span className="ml-2">{time}</span>
            <span className="ml-3 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{timeAgo}</span>
          </div>
          {type && <p className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded mt-1 inline-block font-medium">{type}</p>}
        </div>
        
        {/* Büyüklük Göstergesi - 3D Görünüm */}
        <div className={`text-xl font-bold rounded-full w-16 h-16 flex items-center justify-center transform transition-all duration-300 hover:scale-110 shadow-md ${
          magnitude >= 5.0 ? 'bg-gradient-to-br from-red-100 to-red-200 text-red-700 border border-red-300' : 
          magnitude >= 4.0 ? 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 border border-orange-300' : 
          magnitude >= 3.0 ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 border border-yellow-300' : 
          'bg-gradient-to-br from-green-100 to-green-200 text-green-700 border border-green-300'
        }`}>
          {magnitude.toFixed(1)}
        </div>
      </div>
      
      {/* Risk Seviyesi */}
      {dangerLevel && (
        <div className={`mt-2 text-xs font-medium inline-block px-2 py-1 rounded-full ${
          dangerLevel.includes('Yüksek') ? 'bg-red-100 text-red-700' : 
          dangerLevel.includes('Orta') ? 'bg-orange-100 text-orange-700' : 
          'bg-yellow-100 text-yellow-700'
        }`}>
          {dangerLevel}
        </div>
      )}
      
      {/* Detay Bilgileri - Modern Grid */}
      <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Derinlik</p>
            <p className="font-medium">{depth.toFixed(1)} km</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Enlem</p>
            <p className="font-medium">{latitude.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Boylam</p>
            <p className="font-medium">{longitude.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EarthquakeCard; 