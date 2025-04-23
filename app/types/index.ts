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
}

export interface EarthquakeResponse {
  status: boolean;
  message: string;
  count: number;
  result: Earthquake[];
} 