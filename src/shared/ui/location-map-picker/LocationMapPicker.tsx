'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Default Leaflet marker icons reference image paths that don't survive a
// webpack/Next.js bundle — without this override the marker renders as a
// broken image icon.
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753] // Riyadh

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function RecenterOnChange({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 17))
  }, [position, map])
  return null
}

interface Props {
  lat: number | null
  lng: number | null
  radiusM: number | null
  onPick: (lat: number, lng: number) => void
}

export function LocationMapPicker({ lat, lng, radiusM, onPick }: Props) {
  const position: [number, number] | null = lat !== null && lng !== null ? [lat, lng] : null

  return (
    <MapContainer
      center={position ?? DEFAULT_CENTER}
      zoom={position ? 17 : 11}
      style={{ height: 240, width: '100%', borderRadius: 12 }}
    >
      {/* Wikimedia's OSM mirror: the full standard OpenStreetMap street style
          (street names, POI labels — denser than CARTO's simplified Voyager
          style) served from a CDN fast enough for production use, unlike the
          plain openstreetmap.org tile server. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png"
        maxZoom={19}
        detectRetina
      />
      <ClickHandler onPick={onPick} />
      <RecenterOnChange position={position} />
      {position && <Marker position={position} />}
      {position && radiusM && radiusM > 0 && (
        <Circle center={position} radius={radiusM} pathOptions={{ color: '#0C447C', fillOpacity: 0.15 }} />
      )}
    </MapContainer>
  )
}
