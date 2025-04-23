'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Earthquake } from '../types';

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  selectedEarthquake?: Earthquake | null;
}

// Leaflet client-side only olduğu için dinamik olarak import ediyoruz
const EarthquakeMapClient = dynamic(
  () => import('./EarthquakeMapClient'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-gray-100 animate-pulse flex items-center justify-center">
        Harita yükleniyor...
      </div>
    )
  }
);

export default function EarthquakeMap({ earthquakes, selectedEarthquake }: EarthquakeMapProps) {
  return <EarthquakeMapClient earthquakes={earthquakes} selectedEarthquake={selectedEarthquake} />;
} 