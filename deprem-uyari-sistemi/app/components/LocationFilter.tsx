'use client';

import React, { useState, useEffect } from 'react';
import { City } from '../types';
import { cities } from '../data/cities';

interface LocationFilterProps {
  onCityChange: (province: string | null) => void;
  selectedCity: string | null;
}

// En çok deprem olan 5 büyük şehir
const popularCities = ['İstanbul', 'İzmir', 'Muğla', 'Manisa', 'Balıkesir'];

export default function LocationFilter({ onCityChange, selectedCity }: LocationFilterProps) {
  useEffect(() => {
    // Eğer dışarıdan prop olarak selectedCity değişirse, bileşenin kendi state'ini güncelle
    // Bu kodu eklememiz, bileşenin kontrolünü parent bileşene vermiş olur (controlled component)
  }, [selectedCity]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Konum Filtresi</h2>
      
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {popularCities.map(city => (
            <button
              key={city}
              onClick={() => onCityChange(city)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${selectedCity === city 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            İl Seçin
          </label>
          <select
            id="city"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCity || ''}
            onChange={(e) => onCityChange(e.target.value || null)}
          >
            <option value="">Tüm İller</option>
            {cities.map((city) => (
              <option key={city.id} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCity && (
        <button 
          onClick={() => onCityChange(null)}
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          Filtreyi Temizle
        </button>
      )}
    </div>
  );
} 