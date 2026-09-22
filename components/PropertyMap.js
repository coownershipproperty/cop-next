import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

const styles = [
  { elementType: 'geometry', stylers: [{ color: '#f3f3f3' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#272727' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#333333' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d0d0d0' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#777777' }] },
  { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#999999' }] },
];

export default function PropertyMap({ lat, lng }) {
  const host = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // The existing Maps project now has billing enabled for dynamic maps.
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const fallback = `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=13&output=embed`;

  useEffect(() => {
    const previous = window.gm_authFailure;
    const onFailure = () => { setFailed(true); previous?.(); };
    window.gm_authFailure = onFailure;
    return () => { if (window.gm_authFailure === onFailure) window.gm_authFailure = previous; };
  }, []);

  useEffect(() => {
    if (!ready || failed || !host.current || !window.google?.maps) return;
    const maps = window.google.maps;
    const position = { lat: Number(lat), lng: Number(lng) };
    const map = new maps.Map(host.current, {
      center: position, zoom: 13, styles, backgroundColor: '#f3f3f3',
      mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
      zoomControl: true, gestureHandling: 'cooperative',
    });
    const marker = new maps.Marker({
      map, position, title: 'Property location',
      icon: {
        path: 'M0 0 C-3 -5 -11 -12 -11 -19 A11 11 0 1 1 11 -19 C11 -12 3 -5 0 0 Z',
        fillColor: '#111111', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2, scale: 1.2,
      },
    });
    return () => { marker.setMap(null); maps.event.clearInstanceListeners(map); };
  }, [ready, failed, lat, lng]);

  return (
    <>
      {key && <Script id="cop-property-map-api" src={`https://maps.googleapis.com/maps/api/js?key=${key}&v=quarterly`} onReady={() => setReady(true)} onError={() => setFailed(true)} />}
      {failed || !key ? (
        <iframe title="Property location" src={fallback} width="100%" height="280" style={{ border: 0, display: 'block' }} loading="lazy" allowFullScreen />
      ) : (
        <div ref={host} aria-label="Property location" style={{ width: '100%', height: 320, background: '#f3f3f3' }} />
      )}
    </>
  );
}
