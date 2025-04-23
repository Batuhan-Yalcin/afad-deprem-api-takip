'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Earthquake } from '../types';

interface EarthquakeMapClientProps {
  earthquakes: Earthquake[];
  selectedEarthquake?: Earthquake | null;
}

function MapCenter({ earthquake }: { earthquake?: Earthquake | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (earthquake) {
      map.setView([earthquake.latitude, earthquake.longitude], 9);
    }
  }, [earthquake, map]);

  return null;
}

export default function EarthquakeMapClient({ earthquakes, selectedEarthquake }: EarthquakeMapClientProps) {
  // Türkiye'nin yaklaşık merkezi
  const defaultCenter: [number, number] = [39.0, 35.0];
  const defaultZoom = 6;
  
  const L = useRef<typeof import('leaflet')>();

  // Leaflet'i client-side olarak yükleme
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      L.current = leaflet;
      
      // Leaflet ikon sorunu için geçici çözüm
      delete (L.current.Icon.Default.prototype as any)._getIconUrl;
      L.current.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    });
  }, []);

  // Magnitudeye göre marker boyutu ve rengi
  const getMarkerOptions = (magnitude: number) => {
    const size = Math.max(20, Math.min(40, magnitude * 6));
    let color = '#3388ff';
    
    if (magnitude >= 5) color = '#ff0000';
    else if (magnitude >= 4) color = '#ff8800';
    else if (magnitude >= 3) color = '#ffcc00';
    
    return {
      radius: size / 2,
      fillColor: color,
      color: 'white',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {earthquakes.map((eq) => (
        <Marker 
          key={eq.id}
          position={[eq.latitude, eq.longitude]}
          icon={L.current?.divIcon({
            className: 'custom-marker',
            html: `
              <div style="
                width: ${getMarkerOptions(eq.magnitude).radius * 2}px; 
                height: ${getMarkerOptions(eq.magnitude).radius * 2}px; 
                background: ${getMarkerOptions(eq.magnitude).fillColor};
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-weight: bold;
                font-size: 10px;
                border: 1px solid white;
              ">
                ${eq.magnitude.toFixed(1)}
              </div>
            `,
            iconSize: [getMarkerOptions(eq.magnitude).radius * 2, getMarkerOptions(eq.magnitude).radius * 2],
            iconAnchor: [getMarkerOptions(eq.magnitude).radius, getMarkerOptions(eq.magnitude).radius]
          })}
        >
          <Popup>
            <div>
              <h3 className="font-bold">{eq.location}</h3>
              <p>Büyüklük: {eq.magnitude}</p>
              <p>Derinlik: {eq.depth} km</p>
              <p>Tarih: {eq.date} - {eq.time}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      
      <MapCenter earthquake={selectedEarthquake} />
    </MapContainer>
  );
} 