'use client';

import React from 'react';
import { Earthquake } from '../types';

interface EarthquakeCardProps {
  earthquake: Earthquake;
}

const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude < 3) return 'bg-green-100 text-green-800';
  if (magnitude < 4) return 'bg-yellow-100 text-yellow-800';
  if (magnitude < 5) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

export default function EarthquakeCard({ earthquake }: EarthquakeCardProps) {
  const { date, time, magnitude, depth, location, province } = earthquake;
  const magnitudeColor = getMagnitudeColor(magnitude);

  return (
    <div className="border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-500">
          {date} - {time}
        </div>
        <div className={`rounded-full px-3 py-1 text-sm font-medium ${magnitudeColor}`}>
          {magnitude.toFixed(1)}
        </div>
      </div>
      
      <h3 className="font-semibold mb-2">{location}</h3>
      {province && <p className="text-sm text-gray-600 mb-2">{province}</p>}
      
      <div className="flex items-center text-sm text-gray-500">
        <span>Derinlik: {depth.toFixed(1)} km</span>
      </div>
    </div>
  );
} 