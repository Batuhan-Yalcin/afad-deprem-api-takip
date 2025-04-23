declare module 'react-leaflet' {
  import { FC } from 'react';
  import L from 'leaflet';
  
  export const MapContainer: FC<any>;
  export const TileLayer: FC<any>;
  export const Marker: FC<any>;
  export const Popup: FC<any>;
  export function useMap(): L.Map;
}

declare module 'leaflet' {
  export interface Icon {
    options: any;
  }
  
  export interface IconOptions {
    iconUrl: string;
    iconRetinaUrl: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
    shadowUrl?: string;
  }
  
  export class Icon {
    constructor(options: IconOptions);
    static Default: {
      prototype: any;
      mergeOptions(options: IconOptions): void;
    };
  }
  
  export function divIcon(options: any): Icon;
  
  export interface Map {
    setView(center: [number, number], zoom: number): this;
  }
  
  export default L;
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    params?: any;
    headers?: any;
  }
  
  export interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: AxiosRequestConfig;
  }
  
  export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function deleteRequest<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  
  const axios = {
    get,
    post,
    put,
    delete: deleteRequest
  };
  
  export default axios;
}

declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    [key: string]: any;
  }
}

declare module 'next/font/google' {
  export interface FontOptions {
    weight?: string | string[];
    style?: string | string[];
    subsets?: string[];
  }

  export function Inter(options: FontOptions): {
    className: string;
    style: {
      fontFamily: string;
    };
  };
} 