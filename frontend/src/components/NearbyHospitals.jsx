/**
 * NearbyHospitals.jsx
 * Premium Nearby Hospitals module for MediGrid AI Healthcare Platform.
 *
 * APIs used (all free, no API key required):
 *   - Nominatim (OpenStreetMap) — geocoding & reverse-geocoding
 *   - Overpass API              — real hospital data from OSM
 *   - Leaflet.js + react-leaflet — interactive map
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Search, Navigation, Phone, Star, Clock, Building2,
  X, Filter, ChevronDown, AlertCircle, Loader2, RefreshCw,
  Share2, Copy, ExternalLink, Heart, Zap, ShieldCheck,
  SlidersHorizontal, Map, List, LocateFixed, ArrowUpDown,
  CheckCircle2, XCircle, Info, ChevronRight, Activity
} from 'lucide-react';

// ─── Fix Leaflet default icon paths broken by Vite/Webpack ──────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Custom map markers ───────────────────────────────────────────────────────
const userLocationIcon = L.divIcon({
  html: `<div class="mg-user-marker">
    <div class="mg-user-pulse"></div>
    <div class="mg-user-dot">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  </div>`,
  className: '',
  iconSize:   [40, 40],
  iconAnchor: [20, 40],
  popupAnchor:[0, -44],
});

const hospitalIcon = (isSelected = false) => L.divIcon({
  html: `<div class="${isSelected ? 'mg-hospital-marker selected' : 'mg-hospital-marker'}">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c.55 0 1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1h-3v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H8c-.55 0-1-.45-1-1s.45-1 1-1h3V7c0-.55.45-1 1-1z"/>
    </svg>
  </div>`,
  className: '',
  iconSize:   [34, 34],
  iconAnchor: [17, 34],
  popupAnchor:[0, -38],
});

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Map controller — re-center when mapCenter changes ───────────────────────
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 13, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// ─── Fetch hospitals via Overpass API ─────────────────────────────────────────
async function fetchHospitalsFromOverpass(lat, lng, radiusMeters) {
  const query = `
    [out:json][timeout:30];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      node["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      relation["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
    );
    out body center;
  `;

  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!resp.ok) throw new Error(`Overpass API error: ${resp.status}`);
  const data = await resp.json();

  return data.elements
    .filter(el => el.tags?.name)
    .map((el, idx) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) return null;

      const tags = el.tags || {};
      const isClinic = tags.amenity === 'clinic';
      const emergency = tags.emergency === 'yes' || tags['emergency:phone'] || tags.emergency === 'designated';

      // Derive hospital type from OSM tags
      let hospitalType = 'General';
      if (tags['hospital:type'] === 'specialized') hospitalType = 'Multi-speciality';
      if (tags.healthcare === 'hospital') hospitalType = 'General';
      if (tags.specialty) {
        const spec = tags.specialty.toLowerCase();
        if (spec.includes('cardio')) hospitalType = 'Cardiology';
        else if (spec.includes('ortho')) hospitalType = 'Orthopedic';
        else if (spec.includes('cancer') || spec.includes('oncol')) hospitalType = 'Cancer';
        else if (spec.includes('neuro')) hospitalType = 'Neurology';
        else if (spec.includes('child') || spec.includes('paed')) hospitalType = "Children's";
        else if (spec.includes('eye') || spec.includes('ophthal')) hospitalType = 'Eye';
        else if (spec.includes('dent')) hospitalType = 'Dental';
        else if (spec.includes('ent')) hospitalType = 'ENT';
      }
      if (isClinic) hospitalType = 'Clinic';

      // Ownership: OSM uses operator:type or name heuristics
      let ownership = 'Private';
      const opType = (tags['operator:type'] || '').toLowerCase();
      const operator = (tags.operator || '').toLowerCase();
      if (
        opType.includes('government') ||
        opType.includes('public') ||
        operator.includes('government') ||
        operator.includes('govt') ||
        operator.includes('public') ||
        tags.name?.toLowerCase().includes('government') ||
        tags.name?.toLowerCase().includes('govt') ||
        tags.name?.toLowerCase().includes('civil') ||
        tags.name?.toLowerCase().includes('district hospital') ||
        tags.name?.toLowerCase().includes('municipal') ||
        tags.name?.toLowerCase().includes('esic') ||
        tags.name?.toLowerCase().includes('aiims') ||
        tags.name?.toLowerCase().includes('safdarjung')
      ) {
        ownership = 'Government';
      }

      // Opening hours
      const hours = tags.opening_hours || '';
      const isOpen24x7 = hours === '24/7' || hours === 'Mo-Su 00:00-24:00';
      const openNow = isOpen24x7 ? true : null; // null = unknown

      const distKm = haversineDistance(lat, lng, elLat, elLon);

      return {
        id: `${el.type}-${el.id}`,
        name: tags.name || tags['name:en'] || 'Hospital',
        lat: elLat,
        lng: elLon,
        address: [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:suburb'],
          tags['addr:city'],
          tags['addr:state'],
          tags['addr:postcode'],
        ].filter(Boolean).join(', ') || tags.description || '',
        phone: tags.phone || tags['contact:phone'] || tags['phone:IN'] || '',
        website: tags.website || tags['contact:website'] || '',
        email: tags.email || tags['contact:email'] || '',
        hours: isOpen24x7 ? '24/7' : hours || '',
        type: hospitalType,
        ownership,
        emergency,
        isOpen24x7,
        openNow,
        beds: tags.beds ? parseInt(tags.beds) : null,
        operators: tags.operator || '',
        distKm: parseFloat(distKm.toFixed(2)),
        distLabel:
          distKm < 1
            ? `${Math.round(distKm * 1000)} m`
            : `${distKm.toFixed(1)} km`,
        // Synthetic rating based on OSM data quality (not real rating)
        rating: null,
        reviews: null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distKm - b.distKm);
}

// ─── Nominatim geocode ────────────────────────────────────────────────────────
async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
  const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!resp.ok) throw new Error('Geocoding failed');
  const data = await resp.json();
  if (!data.length) throw new Error('Location not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), address: data[0].display_name };
}

// ─── Nominatim reverse geocode ────────────────────────────────────────────────
async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!resp.ok) throw new Error('Reverse geocode failed');
  const data = await resp.json();
  return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// ─── Toast component ──────────────────────────────────────────────────────────
function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    error:   'bg-rose-500/10 border-rose-500/30 text-rose-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    info:    'bg-sky-500/10 border-sky-500/30 text-sky-400',
  };

  return (
    <div className={`fixed top-16 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-xl text-xs font-bold max-w-sm transition-all ${colors[type]}`}>
      {type === 'error'   && <XCircle     size={15} className="shrink-0" />}
      {type === 'success' && <CheckCircle2 size={15} className="shrink-0" />}
      {type === 'info'    && <Info         size={15} className="shrink-0" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer"><X size={13} /></button>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonCard({ isDark }) {
  const bg = isDark ? 'bg-slate-800/50' : 'bg-slate-200/70';
  const pulse = 'animate-pulse';
  return (
    <div className={`${isDark ? 'bg-[#080b11] border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-4 space-y-3`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${bg} ${pulse} shrink-0`} />
        <div className="flex-1 space-y-2">
          <div className={`h-3 rounded-full ${bg} ${pulse} w-3/4`} />
          <div className={`h-2 rounded-full ${bg} ${pulse} w-1/2`} />
        </div>
        <div className={`h-5 w-14 rounded-full ${bg} ${pulse}`} />
      </div>
      <div className={`h-2 rounded-full ${bg} ${pulse} w-full`} />
      <div className={`h-2 rounded-full ${bg} ${pulse} w-5/6`} />
      <div className="flex gap-2">
        <div className={`h-8 rounded-xl ${bg} ${pulse} flex-1`} />
        <div className={`h-8 rounded-xl ${bg} ${pulse} flex-1`} />
      </div>
    </div>
  );
}

// ─── Hospital Detail Modal ────────────────────────────────────────────────────
function HospitalModal({ hospital, userLocation, isDark, onClose, onViewOnMap }) {
  const [copied, setCopied] = useState(false);

  if (!hospital) return null;

  const copyAddress = () => {
    const addr = hospital.address || hospital.name;
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const shareHospital = () => {
    if (navigator.share) {
      navigator.share({ title: hospital.name, text: `${hospital.name} — ${hospital.address}`, url: `https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lng}` });
    }
  };

  const card     = isDark ? 'bg-[#080b11] border-slate-800' : 'bg-white border-slate-200';
  const subText  = isDark ? 'text-slate-400' : 'text-slate-500';
  const mainText = isDark ? 'text-white'     : 'text-slate-800';

  return (
    <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-3xl border shadow-2xl ${card}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-5 border-b border-slate-800/30 flex items-start justify-between bg-inherit rounded-t-3xl md:rounded-t-3xl">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/20">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className={`text-sm font-black ${mainText} leading-tight max-w-sm`}>{hospital.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-sky-50 text-sky-600 border border-sky-200'}`}>
                  {hospital.type}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hospital.ownership === 'Government' ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') : (isDark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-700 border border-purple-200')}`}>
                  {hospital.ownership}
                </span>
                {hospital.emergency && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    🚨 Emergency
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800/40 cursor-pointer text-slate-400 hover:text-white shrink-0"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-2xl p-3 text-center border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-lg font-black text-sky-500">{hospital.distLabel}</p>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${subText} mt-0.5`}>Distance</p>
            </div>
            <div className={`rounded-2xl p-3 text-center border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-lg font-black ${hospital.isOpen24x7 ? 'text-emerald-500' : hospital.openNow === null ? 'text-slate-400' : 'text-amber-500'}`}>
                {hospital.isOpen24x7 ? '24/7' : hospital.openNow === null ? 'N/A' : 'Open'}
              </p>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${subText} mt-0.5`}>Status</p>
            </div>
            <div className={`rounded-2xl p-3 text-center border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-lg font-black ${hospital.emergency ? 'text-red-400' : 'text-slate-500'}`}>
                {hospital.emergency ? 'Yes' : 'No'}
              </p>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${subText} mt-0.5`}>Emergency</p>
            </div>
          </div>

          {/* Address */}
          {hospital.address && (
            <div className={`rounded-2xl p-4 border ${isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-sky-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className={`text-[11px] font-bold ${subText} uppercase tracking-wider mb-1`}>Address</p>
                  <p className={`text-xs font-semibold ${mainText} leading-relaxed`}>{hospital.address}</p>
                </div>
                <button onClick={copyAddress} className="p-1.5 rounded-lg hover:bg-slate-700/30 cursor-pointer text-slate-400 hover:text-sky-400 transition-all shrink-0">
                  {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Details Row */}
          <div className="space-y-2.5">
            {hospital.phone && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-emerald-500" />
                </div>
                <a href={`tel:${hospital.phone}`} className={`text-xs font-bold ${isDark ? 'text-slate-200 hover:text-sky-400' : 'text-slate-700 hover:text-sky-600'} transition-colors`}>{hospital.phone}</a>
              </div>
            )}
            {hospital.hours && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock size={13} className="text-amber-500" />
                </div>
                <p className={`text-xs font-bold ${mainText}`}>{hospital.hours === '24/7' ? 'Open 24 hours, 7 days a week' : hospital.hours}</p>
              </div>
            )}
            {hospital.beds && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Activity size={13} className="text-indigo-400" />
                </div>
                <p className={`text-xs font-bold ${mainText}`}>{hospital.beds} beds available</p>
              </div>
            )}
            {hospital.operators && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                  <ShieldCheck size={13} className="text-sky-500" />
                </div>
                <p className={`text-xs font-bold ${mainText}`}>Operated by: {hospital.operators}</p>
              </div>
            )}
            {hospital.website && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <ExternalLink size={13} className="text-cyan-500" />
                </div>
                <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-cyan-500 hover:underline truncate max-w-xs">{hospital.website}</a>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button onClick={getDirections}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-black shadow-lg shadow-sky-500/20 hover:opacity-90 transition-all cursor-pointer">
              <Navigation size={14} /> Get Directions
            </button>
            {hospital.phone ? (
              <a href={`tel:${hospital.phone}`}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-black hover:bg-emerald-500/20 transition-all cursor-pointer">
                <Phone size={14} /> Call Hospital
              </a>
            ) : (
              <button onClick={() => onViewOnMap(hospital)}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-black hover:bg-indigo-500/20 transition-all cursor-pointer">
                <Map size={14} /> View on Map
              </button>
            )}
            <button onClick={copyAddress}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black border transition-all cursor-pointer ${isDark ? 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-600' : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}>
              <Copy size={13} /> Copy Address
            </button>
            <button onClick={shareHospital}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black border transition-all cursor-pointer ${isDark ? 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-600' : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}>
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hospital Card ────────────────────────────────────────────────────────────
function HospitalCard({ hospital, isDark, onSelect, onViewOnMap }) {
  const card     = isDark ? 'bg-[#080b11] border-slate-800/70 hover:border-sky-500/30' : 'bg-white border-slate-200 hover:border-sky-400/40';
  const mainText = isDark ? 'text-white'     : 'text-slate-800';
  const subText  = isDark ? 'text-slate-400' : 'text-slate-500';

  const typeColors = {
    'General':        'bg-sky-500/10 text-sky-400 border-sky-500/20',
    'Multi-speciality': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    "Children's":     'bg-pink-500/10 text-pink-400 border-pink-500/20',
    'Cardiology':     'bg-red-500/10 text-red-400 border-red-500/20',
    'Orthopedic':     'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Eye':            'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'ENT':            'bg-teal-500/10 text-teal-400 border-teal-500/20',
    'Dental':         'bg-lime-500/10 text-lime-500 border-lime-500/20',
    'Cancer':         'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Neurology':      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'Clinic':         'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  const typeColor = typeColors[hospital.type] || typeColors['General'];

  const getDirections = (e) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}&travelmode=driving`, '_blank');
  };

  return (
    <div
      className={`border rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm group ${card}`}
      onClick={() => onSelect(hospital)}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center text-white shrink-0 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Building2 size={16} />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-black ${mainText} leading-tight truncate max-w-[200px]`}>{hospital.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${typeColor}`}>{hospital.type}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${hospital.ownership === 'Government' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                {hospital.ownership}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[11px] font-black text-sky-500">{hospital.distLabel}</span>
          {hospital.emergency && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">🚨 ER</span>
          )}
        </div>
      </div>

      {/* Address */}
      {hospital.address && (
        <div className="flex items-start gap-1.5 mb-2.5">
          <MapPin size={11} className="text-slate-400 shrink-0 mt-0.5" />
          <p className={`text-[10px] font-medium ${subText} leading-snug line-clamp-2`}>{hospital.address}</p>
        </div>
      )}

      {/* Tags Row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {hospital.isOpen24x7 && (
          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Open 24/7
          </span>
        )}
        {hospital.phone && (
          <span className={`text-[9px] font-medium ${subText} flex items-center gap-1`}>
            <Phone size={9} /> {hospital.phone}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/20">
        <button
          onClick={e => { e.stopPropagation(); onViewOnMap(hospital); }}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-xl text-[9px] font-black border transition-all cursor-pointer ${isDark ? 'border-slate-700 text-slate-400 hover:text-sky-400 hover:border-sky-500/30' : 'border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-300'}`}>
          <Map size={10} /> Map
        </button>
        <button
          onClick={getDirections}
          className="flex items-center justify-center gap-1 py-1.5 rounded-xl text-[9px] font-black bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all cursor-pointer">
          <Navigation size={10} /> Directions
        </button>
        {hospital.phone ? (
          <a href={`tel:${hospital.phone}`} onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1 py-1.5 rounded-xl text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer">
            <Phone size={10} /> Call
          </a>
        ) : (
          <button onClick={e => { e.stopPropagation(); onSelect(hospital); }}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-xl text-[9px] font-black border transition-all cursor-pointer ${isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`}>
            <Info size={10} /> Details
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const RADIUS_OPTIONS = [
  { label: '1 km',  value: 1000  },
  { label: '5 km',  value: 5000  },
  { label: '10 km', value: 10000 },
  { label: '25 km', value: 25000 },
];

const TYPE_OPTIONS = [
  'All', 'General', 'Multi-speciality', "Children's", 'Cardiology',
  'Orthopedic', 'Eye', 'ENT', 'Dental', 'Cancer', 'Neurology', 'Clinic',
];

const SORT_OPTIONS = [
  { label: 'Nearest First',  value: 'nearest'   },
  { label: 'Emergency First',value: 'emergency'  },
  { label: '24/7 First',     value: 'open'       },
];

export default function NearbyHospitals({ isDark }) {
  // ── Search & location state ────────────────────────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState('');
  const [userLocation,   setUserLocation]   = useState(null); // { lat, lng, address }
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [activeLocation, setActiveLocation] = useState(null); // the current "center" coords

  // ── Hospital data state ────────────────────────────────────────────────────
  const [hospitals,  setHospitals]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [locationDenied, setLocationDenied] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Filters & sort ─────────────────────────────────────────────────────────
  const [radiusM,    setRadiusM]    = useState(10000);
  const [filterType, setFilterType] = useState('All');
  const [filterOwnership, setFilterOwnership] = useState('All'); // All | Government | Private
  const [filterEmergency, setFilterEmergency] = useState(false);
  const [filterOpen24,    setFilterOpen24]    = useState(false);
  const [sortBy,     setSortBy]     = useState('nearest');

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeView,       setActiveView]       = useState('split'); // split | map | list
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hoveredId,        setHoveredId]        = useState(null);
  const [mapCenter,        setMapCenter]        = useState([20.5937, 78.9629]); // India center
  const [mapZoom,          setMapZoom]          = useState(5);
  const [showFilters,      setShowFilters]      = useState(false);
  const [toast,            setToast]            = useState(null);

  // ── Debounce ref ───────────────────────────────────────────────────────────
  const debounceRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  // ── Filter + sort derived list ─────────────────────────────────────────────
  const filteredHospitals = useMemo(() => {
    let list = [...hospitals];

    if (filterType !== 'All') {
      list = list.filter(h => h.type === filterType);
    }
    if (filterOwnership !== 'All') {
      list = list.filter(h => h.ownership === filterOwnership);
    }
    if (filterEmergency) {
      list = list.filter(h => h.emergency);
    }
    if (filterOpen24) {
      list = list.filter(h => h.isOpen24x7);
    }

    switch (sortBy) {
      case 'nearest':
        list.sort((a, b) => a.distKm - b.distKm);
        break;
      case 'emergency':
        list.sort((a, b) => (b.emergency ? 1 : 0) - (a.emergency ? 1 : 0) || a.distKm - b.distKm);
        break;
      case 'open':
        list.sort((a, b) => (b.isOpen24x7 ? 1 : 0) - (a.isOpen24x7 ? 1 : 0) || a.distKm - b.distKm);
        break;
      default:
        break;
    }

    return list;
  }, [hospitals, filterType, filterOwnership, filterEmergency, filterOpen24, sortBy]);

  // ── Core: fetch hospitals around a lat/lng ─────────────────────────────────
  const doFetch = useCallback(async (lat, lng, radius, address) => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const results = await fetchHospitalsFromOverpass(lat, lng, radius);
      setHospitals(results);
      setMapCenter([lat, lng]);
      setMapZoom(radius <= 2000 ? 15 : radius <= 7000 ? 13 : radius <= 15000 ? 12 : 11);
      setActiveLocation({ lat, lng, address });
      if (results.length === 0) {
        showToast('No hospitals found in this area. Try increasing the radius.', 'info');
      } else {
        showToast(`Found ${results.length} hospitals nearby`, 'success');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch hospitals. Check your connection and try again.');
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ── Re-fetch when radius changes ───────────────────────────────────────────
  useEffect(() => {
    if (activeLocation && hasSearched) {
      doFetch(activeLocation.lat, activeLocation.lng, radiusM, activeLocation.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusM]);

  // ── Use current GPS location ───────────────────────────────────────────────
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setLoading(true);
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const address = await reverseGeocode(lat, lng);
          setUserLocation({ lat, lng, address });
          setSearchQuery(address.split(',').slice(0, 3).join(', '));
          await doFetch(lat, lng, radiusM, address);
        } catch (err) {
          setLoading(false);
          showToast('Could not detect your location. Try manual search.', 'error');
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationDenied(true);
        } else {
          showToast('Location error: ' + err.message, 'error');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [doFetch, radiusM, showToast]);

  // ── Manual search with debounce ────────────────────────────────────────────
  const triggerSearchForQuery = useCallback(async (q) => {
    if (!q) return;
    setSearchQuery(q);
    setLoading(true);
    setError('');
    setLocationDenied(false);
    try {
      const loc = await geocodeAddress(q);
      setSearchedLocation(loc);
      await doFetch(loc.lat, loc.lng, radiusM, loc.address);
    } catch (err) {
      setLoading(false);
      showToast('Location not found. Try a different search term.', 'error');
      setError('Location not found. Please try a city name, landmark, or pincode.');
    }
  }, [radiusM, doFetch, showToast]);

  const handleSearchSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    triggerSearchForQuery(searchQuery.trim());
  }, [searchQuery, triggerSearchForQuery]);

  // ── View on map: fly to hospital ──────────────────────────────────────────
  const handleViewOnMap = useCallback((hospital) => {
    setSelectedHospital(null);
    setMapCenter([hospital.lat, hospital.lng]);
    setMapZoom(16);
    setHoveredId(hospital.id);
    setActiveView('split');
    setTimeout(() => setHoveredId(null), 3000);
  }, []);

  // ── Style helpers ──────────────────────────────────────────────────────────
  const bg        = isDark ? 'bg-[#030407]'         : 'bg-[#f0f4f8]';
  const card      = isDark ? 'bg-[#080b11] border-slate-800/70' : 'bg-white border-slate-200';
  const inputCls  = isDark
    ? 'bg-[#080b11] border-slate-800 text-white placeholder-slate-500 focus:border-sky-500'
    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500';
  const mainText  = isDark ? 'text-white'     : 'text-slate-800';
  const subText   = isDark ? 'text-slate-400' : 'text-slate-500';
  const tileUrl   = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const activeFilterCount = [
    filterType !== 'All',
    filterOwnership !== 'All',
    filterEmergency,
    filterOpen24,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full gap-0">

      {/* Toast */}
      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Hospital Detail Modal */}
      {selectedHospital && (
        <HospitalModal
          hospital={selectedHospital}
          userLocation={activeLocation}
          isDark={isDark}
          onClose={() => setSelectedHospital(null)}
          onViewOnMap={handleViewOnMap}
        />
      )}

      {/* ── Search Bar + Location Button ──────────────────────────────────── */}
      <div className={`rounded-2xl border p-4 mb-4 shadow-sm ${card}`}>
        {/* Location Denied Warning */}
        {locationDenied && (
          <div className="mb-3 flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black">Location access was denied</p>
              <p className="text-[10px] mt-0.5 opacity-80">Please enable location permission in your browser settings, or search manually below.</p>
            </div>
            <button onClick={() => setLocationDenied(false)} className="ml-auto cursor-pointer shrink-0"><X size={14} /></button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* GPS Button */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-black shadow-md shadow-sky-500/20 hover:opacity-90 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
          >
            {loading && !hasSearched ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LocateFixed size={14} />
            )}
            Use My Location
          </button>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`} />
              <input
                type="text"
                placeholder="Search city, area, landmark, pincode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-colors ${inputCls}`}
                aria-label="Search location"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-sky-500 text-white text-xs font-black hover:bg-sky-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Active Location Label */}
        {activeLocation && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <MapPin size={11} className="text-sky-500 shrink-0" />
            <p className={`text-[10px] font-medium ${subText} truncate`}>
              Showing results near: <span className="font-bold text-sky-500">{activeLocation.address?.split(',').slice(0, 4).join(', ')}</span>
            </p>
          </div>
        )}
      </div>

      {/* ── Filters Row ───────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-3 mb-4 shadow-sm ${card}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Radius Pills */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-black uppercase tracking-wider ${subText} mr-1`}>Radius:</span>
            {RADIUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRadiusM(opt.value)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer border ${
                  radiusM === opt.value
                    ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/10'
                    : isDark ? 'border-slate-700 text-slate-400 hover:border-sky-500/40 hover:text-sky-400' : 'border-slate-200 text-slate-500 hover:border-sky-400 hover:text-sky-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className={`appearance-none pl-2.5 pr-7 py-1.5 rounded-xl text-[10px] font-black border outline-none cursor-pointer transition-colors ${isDark ? 'bg-[#080b11] border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
                aria-label="Sort hospitals"
              >
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <ArrowUpDown size={10} className={`absolute right-2 top-1/2 -translate-y-1/2 ${subText} pointer-events-none`} />
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer relative ${
                showFilters || activeFilterCount > 0
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                  : isDark ? 'border-slate-700 text-slate-400 hover:border-sky-500/30' : 'border-slate-200 text-slate-500 hover:border-sky-400'
              }`}
            >
              <SlidersHorizontal size={11} />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sky-500 text-white text-[8px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View Toggle */}
            <div className={`flex rounded-xl overflow-hidden border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              {[
                { id: 'split', icon: <><Map size={10}/><List size={10}/></> },
                { id: 'map',   icon: <Map size={10} /> },
                { id: 'list',  icon: <List size={10} /> },
              ].map(v => (
                <button key={v.id} onClick={() => setActiveView(v.id)}
                  className={`flex items-center gap-0.5 px-2.5 py-1.5 text-[9px] font-black transition-all cursor-pointer ${
                    activeView === v.id
                      ? 'bg-sky-500 text-white'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {v.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {/* Hospital Type */}
              <div>
                <p className={`text-[9px] font-black uppercase tracking-wider ${subText} mb-1.5`}>Hospital Type</p>
                <div className="flex flex-wrap gap-1">
                  {TYPE_OPTIONS.map(t => (
                    <button key={t} onClick={() => setFilterType(t)}
                      className={`px-2 py-1 rounded-full text-[9px] font-bold transition-all cursor-pointer border ${
                        filterType === t
                          ? 'bg-sky-500 text-white border-sky-500'
                          : isDark ? 'border-slate-700 text-slate-400 hover:border-sky-500/40' : 'border-slate-200 text-slate-500 hover:border-sky-400'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Ownership */}
              <div>
                <p className={`text-[9px] font-black uppercase tracking-wider ${subText} mb-1.5`}>Ownership</p>
                <div className="flex gap-1">
                  {['All', 'Government', 'Private'].map(o => (
                    <button key={o} onClick={() => setFilterOwnership(o)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all cursor-pointer border ${
                        filterOwnership === o
                          ? 'bg-sky-500 text-white border-sky-500'
                          : isDark ? 'border-slate-700 text-slate-400 hover:border-sky-500/40' : 'border-slate-200 text-slate-500 hover:border-sky-400'
                      }`}
                    >{o}</button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div>
                <p className={`text-[9px] font-black uppercase tracking-wider ${subText} mb-1.5`}>Quick Filters</p>
                <div className="flex gap-2">
                  <button onClick={() => setFilterEmergency(v => !v)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold transition-all cursor-pointer border ${
                      filterEmergency ? 'bg-red-500/10 border-red-500/30 text-red-400' : isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'
                    }`}>
                    <Zap size={9} /> Emergency
                  </button>
                  <button onClick={() => setFilterOpen24(v => !v)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold transition-all cursor-pointer border ${
                      filterOpen24 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'
                    }`}>
                    <Clock size={9} /> Open 24/7
                  </button>
                </div>
              </div>

              {/* Reset */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setFilterType('All'); setFilterOwnership('All'); setFilterEmergency(false); setFilterOpen24(false); }}
                  className="self-end px-3 py-1 rounded-full text-[9px] font-black text-sky-400 border border-sky-500/20 hover:bg-sky-500/10 transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Results Count Bar ─────────────────────────────────────────────── */}
      {hasSearched && !loading && (
        <div className="flex items-center justify-between mb-2 px-1">
          <p className={`text-[10px] font-bold ${subText}`}>
            {filteredHospitals.length > 0
              ? `Showing ${filteredHospitals.length} of ${hospitals.length} hospitals`
              : 'No hospitals match your filters'}
          </p>
          {hospitals.length > 0 && activeLocation && (
            <button
              onClick={() => doFetch(activeLocation.lat, activeLocation.lng, radiusM, activeLocation.address)}
              disabled={loading}
              className={`flex items-center gap-1 text-[9px] font-bold ${subText} hover:text-sky-500 transition-colors cursor-pointer`}
            >
              <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          )}
        </div>
      )}

      {/* ── Map + List Layout ─────────────────────────────────────────────── */}
      <div className={`flex flex-col ${activeView === 'split' ? 'lg:flex-row' : ''} gap-4 flex-1 min-h-0`}>

        {/* ── MAP ────────────────────────────────────────────────────────── */}
        {(activeView === 'split' || activeView === 'map') && (
          <div className={`rounded-2xl overflow-hidden border shadow-sm relative ${card} ${activeView === 'split' ? 'lg:w-[55%] h-[380px] lg:h-auto' : 'h-[500px]'}`}>
            {/* Map shimmer while loading */}
            {loading && (
              <div className={`absolute inset-0 z-[400] flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-[#080b11]/90' : 'bg-white/90'} backdrop-blur-sm`}>
                <Loader2 size={28} className="animate-spin text-sky-500" />
                <p className={`text-xs font-bold ${subText}`}>Fetching hospitals...</p>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-sky-500/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Map not yet searched placeholder */}
            {!hasSearched && !loading && (
              <div className={`absolute inset-0 z-[400] flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-[#080b11]/70' : 'bg-white/70'} backdrop-blur-sm`}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                  <MapPin size={26} className="animate-bounce" />
                </div>
                <p className={`text-sm font-black ${mainText}`}>Search a location to view hospitals</p>
                <p className={`text-xs ${subText}`}>Use GPS or enter a city name above</p>
              </div>
            )}

            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              className="z-0"
              aria-label="Hospital map"
            >
              <TileLayer
                url={tileUrl}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxZoom={19}
              />
              <MapController center={mapCenter} zoom={mapZoom} />

              {/* User / Searched Location Marker */}
              {activeLocation && (
                <Marker position={[activeLocation.lat, activeLocation.lng]} icon={userLocationIcon}>
                  <Popup className="mg-popup">
                    <div className="text-xs font-bold text-slate-800 max-w-[200px]">
                      <p className="font-black text-sky-600 mb-1">📍 Your Location</p>
                      <p className="text-slate-500 text-[10px]">{activeLocation.address?.split(',').slice(0, 4).join(', ')}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Hospital Markers */}
              {filteredHospitals.map(h => (
                <Marker
                  key={h.id}
                  position={[h.lat, h.lng]}
                  icon={hospitalIcon(hoveredId === h.id)}
                  eventHandlers={{
                    click: () => setSelectedHospital(h),
                  }}
                >
                  <Popup className="mg-popup" maxWidth={260}>
                    <div className="p-1 min-w-[200px]">
                      <p className="font-black text-slate-800 text-xs mb-1 leading-tight">{h.name}</p>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">{h.type}</span>
                        <span className="text-[9px] font-bold text-slate-400">{h.distLabel}</span>
                        {h.emergency && <span className="text-[9px] font-bold text-red-600">🚨 ER</span>}
                      </div>
                      {h.address && <p className="text-[10px] text-slate-500 mb-2 leading-snug">{h.address}</p>}
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}&travelmode=driving`;
                          window.open(url, '_blank');
                        }}
                        className="w-full py-1.5 bg-sky-500 text-white text-[10px] font-black rounded-lg hover:bg-sky-600 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Navigation size={10} /> Get Directions
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map Legend */}
            {hasSearched && !loading && filteredHospitals.length > 0 && (
              <div className={`absolute bottom-3 left-3 z-[400] flex items-center gap-3 px-3 py-2 rounded-xl ${isDark ? 'bg-[#080b11]/90 border border-slate-700/50' : 'bg-white/90 border border-slate-200'} backdrop-blur-sm shadow-md`}>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                  <div className="w-3 h-3 rounded-full bg-sky-500" />
                  Your Location
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  Hospitals ({filteredHospitals.length})
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HOSPITAL CARDS LIST ─────────────────────────────────────────── */}
        {(activeView === 'split' || activeView === 'list') && (
          <div className={`flex flex-col min-h-0 ${activeView === 'split' ? 'lg:flex-1' : 'w-full'}`}>
            {/* Loading Skeletons */}
            {loading && (
              <div className="space-y-3 overflow-y-auto pr-1">
                {Array(5).fill(0).map((_, i) => <SkeletonCard key={i} isDark={isDark} />)}
              </div>
            )}

            {/* Initial state — no search yet */}
            {!loading && !hasSearched && (
              <div className={`rounded-2xl border flex-1 flex flex-col items-center justify-center text-center p-8 gap-4 ${card}`}>
                <div className="relative">
                  <div className="absolute inset-0 bg-sky-500/10 blur-2xl rounded-full scale-150" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                    <MapPin size={28} />
                  </div>
                </div>
                <div>
                  <h3 className={`text-sm font-black ${mainText} mb-1.5`}>Find Hospitals Nearby</h3>
                  <p className={`text-xs ${subText} max-w-[240px] leading-relaxed`}>
                    Use your GPS or search any city, area, or landmark to discover nearby hospitals.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs text-left">
                  {['Delhi', 'Gurgaon', 'Mumbai', 'Connaught Place', '110001'].map(ex => (
                    <button key={ex} onClick={() => { triggerSearchForQuery(ex); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isDark ? 'border-slate-800 text-slate-400 hover:border-sky-500/30 hover:text-sky-400' : 'border-slate-200 text-slate-500 hover:border-sky-400 hover:text-sky-600'}`}>
                      <Search size={12} /> {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className={`rounded-2xl border flex flex-col items-center justify-center text-center p-8 gap-3 ${card}`}>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <AlertCircle size={22} className="text-rose-500" />
                </div>
                <div>
                  <h3 className={`text-xs font-black ${mainText} mb-1`}>Something went wrong</h3>
                  <p className={`text-[10px] ${subText} max-w-[240px]`}>{error}</p>
                </div>
                <button onClick={() => handleSearchSubmit(null)}
                  className="px-4 py-2 bg-sky-500 text-white text-xs font-black rounded-xl cursor-pointer hover:bg-sky-600 transition-all shadow-md">
                  Retry
                </button>
              </div>
            )}

            {/* Empty state — search done but no results */}
            {!loading && hasSearched && !error && filteredHospitals.length === 0 && (
              <div className={`rounded-2xl border flex flex-col items-center justify-center text-center p-8 gap-3 ${card}`}>
                <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center">
                  <MapPin size={24} className="text-slate-400" />
                </div>
                <div>
                  <h3 className={`text-xs font-black ${mainText} mb-1`}>No hospitals found in this area</h3>
                  <p className={`text-[10px] ${subText} max-w-[240px]`}>
                    {activeFilterCount > 0
                      ? 'Your active filters may be too narrow. Try resetting filters or increasing the search radius.'
                      : 'Try increasing the search radius or searching a different location.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {activeFilterCount > 0 && (
                    <button onClick={() => { setFilterType('All'); setFilterOwnership('All'); setFilterEmergency(false); setFilterOpen24(false); }}
                      className="px-3 py-2 text-[10px] font-black text-sky-400 border border-sky-500/20 rounded-xl cursor-pointer hover:bg-sky-500/10 transition-all">
                      Reset Filters
                    </button>
                  )}
                  <button onClick={() => { setRadiusM(25000); }}
                    className="px-3 py-2 bg-sky-500 text-white text-[10px] font-black rounded-xl cursor-pointer hover:bg-sky-600 transition-all shadow-md">
                    Expand to 25 km
                  </button>
                </div>
              </div>
            )}

            {/* Results list */}
            {!loading && hasSearched && !error && filteredHospitals.length > 0 && (
              <div className="overflow-y-auto space-y-3 pr-1 flex-1" style={{ maxHeight: activeView === 'split' ? '480px' : 'none' }}>
                {filteredHospitals.map(h => (
                  <HospitalCard
                    key={h.id}
                    hospital={h}
                    isDark={isDark}
                    onSelect={setSelectedHospital}
                    onViewOnMap={handleViewOnMap}
                  />
                ))}
                {/* Bottom padding */}
                <div className="h-4" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
