import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para los íconos de Leaflet en React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapaSismosRecientes = () => {
  const [sismos, setSismos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSismos = async () => {
      setCargando(true);
      setError(null);
      try {
        // Bounding box de Chile continental, últimos 7 días, M>3.0
        const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]}&minmagnitude=3.1&maxlatitude=-17&minlatitude=-56&maxlongitude=-66&minlongitude=-76&orderby=time`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('No se pudo obtener sismos recientes');
        const data = await resp.json();
        setSismos(data.features);
      } catch (e) {
        setError('Error al cargar sismos recientes');
      } finally {
        setCargando(false);
      }
    };
    fetchSismos();
  }, []);

  return (
    <div>
      <h2>Sismos Recientes en Chile (últimos 7 días, M&gt;3.0, USGS)</h2>
      <p>Visualización de los últimos sismos de magnitud mayor a 3.0 en todo Chile, según USGS.</p>
      {cargando && <p>Cargando sismos...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {!cargando && !error && (
        <>
          <MapContainer center={[-33.5, -71]} zoom={4.2} style={{ height: '400px', width: '100%', marginBottom: '20px' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {sismos.map((s, i) => (
              <Marker key={s.id} position={[s.geometry.coordinates[1], s.geometry.coordinates[0]]}>
                <Popup>
                  <strong>Magnitud:</strong> {s.properties.mag}<br/>
                  <strong>Lugar:</strong> {s.properties.place}<br/>
                  <strong>Fecha:</strong> {new Date(s.properties.time).toLocaleString()}<br/>
                  <strong>Profundidad:</strong> {s.geometry.coordinates[2]} km
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <h3>Tabla de Sismos Recientes</h3>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Magnitud</th>
                <th>Lugar</th>
                <th>Profundidad (km)</th>
              </tr>
            </thead>
            <tbody>
              {sismos.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.properties.time).toLocaleString()}</td>
                  <td>{s.properties.mag}</td>
                  <td>{s.properties.place}</td>
                  <td>{s.geometry.coordinates[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default MapaSismosRecientes; 