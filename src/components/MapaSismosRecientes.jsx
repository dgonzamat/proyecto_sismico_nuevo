import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ── Color por magnitud (consistente con variables CSS de riesgo) ──────────────
const colorPorMagnitud = (mag) => {
  if (mag >= 6.0) return '#b71c1c'; // var(--risk-critical)
  if (mag >= 5.0) return '#e65100'; // var(--risk-very-high)
  if (mag >= 4.0) return '#f57f17'; // var(--risk-moderate)
  return '#1565c0';                 // var(--risk-very-low)
};

const radiusPorMagnitud = (mag) => Math.max(5, (mag - 2) * 3.5);

const MapaSismosRecientes = () => {
  const [sismos, setSismos]     = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);

  const fetchSismos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${desde}&minmagnitude=3.1&maxlatitude=-17&minlatitude=-56&maxlongitude=-66&minlongitude=-76&orderby=time`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Error USGS: ${resp.status} ${resp.statusText}`);
      const data = await resp.json();
      setSismos(data.features);
    } catch (e) {
      setError(e.message || 'No se pudo conectar con USGS. Verifica tu conexión a internet.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { fetchSismos(); }, [fetchSismos]);

  return (
    <div>
      <h2>Sismos Recientes en Chile — Últimos 7 días, M &gt; 3.0</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: -6, marginBottom: 16 }}>
        Fuente: USGS Earthquake Hazards Program (datos en tiempo real).
      </p>

      {/* ── Estado de carga ── */}
      {cargando && (
        <div role="status" aria-live="polite" style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px' }} aria-hidden="true" />
          Cargando sismos desde USGS…
        </div>
      )}

      {/* ── Error con acción de reintento ── */}
      {error && (
        <div role="alert" style={{ padding: 16, background: '#ffebee', borderRadius: 8, marginBottom: 16, border: '1px solid #ef9a9a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <strong style={{ color: '#c62828' }}>⚠️ Error al cargar datos</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#b71c1c' }}>{error}</p>
          </div>
          <button
            onClick={fetchSismos}
            style={{ padding: '8px 16px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && (
        <>
          {/* ── Leyenda ── */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, fontSize: 13 }}>
            {[
              { color: '#1565c0', label: 'M 3.0–3.9',  icono: '●' },
              { color: '#f57f17', label: 'M 4.0–4.9',  icono: '◆' },
              { color: '#e65100', label: 'M 5.0–5.9',  icono: '▲' },
              { color: '#b71c1c', label: 'M 6.0+',     icono: '▲▲' },
            ].map(({ color, label, icono }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color, fontWeight: 'bold' }}>{icono}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* ── Mapa con CircleMarkers accesibles ── */}
          <MapContainer
            center={[-33.5, -71]}
            zoom={4.2}
            style={{ height: 420, width: '100%', marginBottom: 24, borderRadius: 8, border: '1px solid var(--border-light)' }}
            aria-label={`Mapa de ${sismos.length} sismos recientes en Chile`}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            {sismos.map((s) => {
              const mag   = s.properties.mag;
              const lugar = s.properties.place;
              const fecha = new Date(s.properties.time).toLocaleString('es-CL');
              const prof  = s.geometry.coordinates[2];
              return (
                <CircleMarker
                  key={s.id}
                  center={[s.geometry.coordinates[1], s.geometry.coordinates[0]]}
                  radius={radiusPorMagnitud(mag)}
                  pathOptions={{ color: colorPorMagnitud(mag), fillColor: colorPorMagnitud(mag), fillOpacity: 0.75 }}
                  // ARIA: CircleMarker no soporta aria-label nativo, el Popup provee contexto
                >
                  <Popup>
                    {/* Popup accesible con todos los datos relevantes */}
                    <div style={{ fontSize: 13, minWidth: 180 }}>
                      <strong style={{ fontSize: 14, color: colorPorMagnitud(mag) }}>
                        Magnitud {mag}
                      </strong>
                      <table style={{ margin: '6px 0 0', width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {[
                            ['Lugar',        lugar],
                            ['Fecha',        fecha],
                            ['Profundidad',  `${prof} km`],
                          ].map(([k, v]) => (
                            <tr key={k}>
                              <td style={{ color: '#666', paddingRight: 8, paddingBottom: 3 }}>{k}</td>
                              <td style={{ fontWeight: 500, paddingBottom: 3 }}>{v}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* ── Tabla accesible ── */}
          <h3>
            Listado de Sismos Recientes
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 'normal', color: 'var(--text-muted)' }}>
              ({sismos.length} eventos)
            </span>
          </h3>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table
              aria-label="Sismos recientes en Chile"
              style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500, fontSize: 14 }}
            >
              <thead>
                <tr style={{ background: 'var(--brand)', color: '#fff' }}>
                  <th scope="col" style={{ padding: '10px 12px', textAlign: 'left' }}>Fecha y hora</th>
                  <th scope="col" style={{ padding: '10px 12px', textAlign: 'center' }}>Magnitud</th>
                  <th scope="col" style={{ padding: '10px 12px', textAlign: 'left' }}>Lugar</th>
                  <th scope="col" style={{ padding: '10px 12px', textAlign: 'center' }}>Profundidad</th>
                </tr>
              </thead>
              <tbody>
                {sismos.map((s, i) => {
                  const mag = s.properties.mag;
                  return (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        {new Date(s.properties.time).toLocaleString('es-CL')}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span
                          aria-label={`Magnitud ${mag}`}
                          style={{
                            background: colorPorMagnitud(mag), color: '#fff',
                            padding: '2px 10px', borderRadius: 12, fontWeight: 'bold', fontSize: 13
                          }}
                        >
                          M {mag}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>{s.properties.place}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{s.geometry.coordinates[2]} km</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sismos.length === 0 && (
            <p style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
              No se registraron sismos M &gt; 3.0 en Chile en los últimos 7 días.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default MapaSismosRecientes;
