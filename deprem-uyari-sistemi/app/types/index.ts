export interface Earthquake {
  id: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  location: string;
  province?: string;
  type?: string;
}

export interface EarthquakeResponse {
  status: boolean;
  message: string;
  count: number;
  result: Earthquake[];
}

export interface City {
  id: number;
  name: string;
}

export interface District {
  id: number;
  cityId: number;
  name: string;
} 