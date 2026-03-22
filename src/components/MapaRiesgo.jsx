import React, { useState, useEffect } from 'react';
import { contarSismosCinturonFuego, contarEnjambresZona } from '../api/sismos';
import {
  SEGMENTOS_CHILE,
  bptProbabilidadCondicional,
  calcularRatioDeficitMomento
} from '../api/modeloSismologico';

// ─────────────────────────────────────────────────────────────────────────────
// Mapeo de regiones administrativas de Chile → segmento sísmico (por segmentoId)
// ─────────────────────────────────────────────────────────────────────────────
const REGIONES_CHILE = [
  { id: 'CL-AP', name: 'Arica y Parinacota',    segmentoId: 'norte_grande' },
  { id: 'CL-TA', name: 'Tarapacá',              segmentoId: 'norte_grande' },
  { id: 'CL-AN', name: 'Antofagasta',           segmentoId: 'atacama'      },
  { id: 'CL-AT', name: 'Atacama',               segmentoId: 'atacama'      },
  { id: 'CL-CO', name: 'Coquimbo',              segmentoId: 'coquimbo'     },
  { id: 'CL-VS', name: 'Valparaíso',            segmentoId: 'coquimbo'     },
  { id: 'CL-RM', name: 'Región Metropolitana',  segmentoId: 'maule'        },
  { id: 'CL-LI', name: "O'Higgins",             segmentoId: 'maule'        },
  { id: 'CL-ML', name: 'Maule',                 segmentoId: 'maule'        },
  { id: 'CL-BI', name: 'Biobío',                segmentoId: 'maule'        },
  { id: 'CL-AR', name: 'La Araucanía',          segmentoId: 'valdivia'     },
  { id: 'CL-LR', name: 'Los Ríos',              segmentoId: 'valdivia'     },
  { id: 'CL-LL', name: 'Los Lagos',             segmentoId: 'valdivia'     },
  { id: 'CL-AI', name: 'Aysén',                 segmentoId: 'valdivia'     },
  { id: 'CL-MA', name: 'Magallanes',            segmentoId: 'valdivia'     },
];

const AÑO_ACTUAL = 2026;
const VENTANA    = 10; // años

const getColorByRisk = (riesgo) => {
  if (riesgo > 75) return '#f44336';
  if (riesgo > 50) return '#ff9800';
  if (riesgo > 25) return '#ffeb3b';
  return '#4caf50';
};

const getClasificacion = (riesgo) => {
  if (riesgo > 75) return 'ALTO';
  if (riesgo > 50) return 'MODERADO';
  if (riesgo > 25) return 'BAJO-MODERADO';
  return 'BAJO';
};

// ─────────────────────────────────────────────────────────────────────────────
const MapaRiesgo = ({ datosHistoricos = [] }) => {
  const [zonaRiesgo, setZonaRiesgo]             = useState([]);
  const [cargando, setCargando]                 = useState(true);
  const [regionSeleccionada, setRegionSel]      = useState(null);
  const [sismosCinturon, setSismosCinturon]     = useState(null);
  const [errorFactores, setErrorFactores]       = useState(null);

  useEffect(() => {
    const calcular = async () => {
      setCargando(true);
      setErrorFactores(null);
      try {
        const [sismosFuego, ...enjambresArr] = await Promise.all([
          contarSismosCinturonFuego(),
          ...SEGMENTOS_CHILE.map(s =>
            contarEnjambresZona(s.minLat, s.maxLat, s.minLon, s.maxLon)
          )
        ]);
        setSismosCinturon(sismosFuego);

        // ── Probabilidad BPT por segmento (mismo motor que PrediccionSismica) ──
        const probPorSegmento = {};
        SEGMENTOS_CHILE.forEach((seg, idx) => {
          const t = AÑO_ACTUAL - seg.ultimoGranSismoAño;
          const probBPT      = bptProbabilidadCondicional(t, seg.recurrenciaMu, seg.aperiodicidad, VENTANA);
          const ratioDeficit = Math.min(1, calcularRatioDeficitMomento(t, seg.magnitudCaracteristica, seg.coupling, seg.areaFalla));
          const enjambres    = enjambresArr[idx] || 0;
          const factorEnj    = Math.min(1, enjambres * 0.08);

          // Misma fórmula ponderada que PrediccionSismica para coherencia total
          const prob = Math.round(
            Math.min(0.99, 0.70 * probBPT + 0.20 * ratioDeficit + 0.10 * factorEnj) * 100
          );
          probPorSegmento[seg.id] = {
            prob,
            seg,
            t,
            enjambres
          };
        });

        // ── Asignar probabilidad del segmento a cada región administrativa ──
        const zonas = REGIONES_CHILE.map(region => {
          const datos = probPorSegmento[region.segmentoId];
          if (!datos) return { ...region, riesgo: 0, seg: null, t: 0 };
          return {
            ...region,
            riesgo:             datos.prob,
            seg:                datos.seg,
            t:                  datos.t,
            enjambres:          datos.enjambres,
            ultimoSismo:        datos.seg.ultimoGranSismoAño,
            magnitudUltimo:     datos.seg.magnitudUltimo,
            magnitudEsperada:   datos.seg.magnitudCaracteristica,
            nivelAlerta:        datos.seg.nivelAlerta,
            esGap:              datos.seg.esGap,
            notas:              datos.seg.notas,
          };
        });

        setZonaRiesgo(zonas);
      } catch (e) {
        console.error(e);
        setErrorFactores('Error al calcular el mapa de riesgo.');
      } finally {
        setCargando(false);
      }
    };
    calcular();
  }, [datosHistoricos]); // eslint-disable-line

  if (cargando) {
    return <div style={{ textAlign: 'center', padding: 50 }}>Calculando mapa de riesgo sísmico…</div>;
  }

  if (!cargando && datosHistoricos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <h2>No hay datos sísmicos disponibles.</h2>
        <p>Intenta actualizar o revisa la conexión con las fuentes de datos.</p>
      </div>
    );
  }

  return (
    <div className="mapa-riesgo-container">
      <h2>Mapa de Riesgo Sísmico de Chile — {AÑO_ACTUAL}–{AÑO_ACTUAL + VENTANA}</h2>
      <p style={{ textAlign: 'center', color: '#555', marginTop: -8, marginBottom: 16 }}>
        Probabilidades calculadas con modelo BPT + Déficit de Momento Sísmico (ventana {VENTANA} años).
        Consistente con la pestaña Predicción Sísmica.
      </p>

      {sismosCinturon !== null && (
        <div style={{ marginBottom: 12, fontSize: 14, color: '#333' }}>
          <strong>Cinturón de Fuego (7 días):</strong> {sismosCinturon} sismos M≥6.5
        </div>
      )}
      {errorFactores && (
        <div style={{ padding: 12, background: '#ffebee', borderRadius: 6, marginBottom: 16, color: '#c62828' }}>
          ⚠️ {errorFactores}
        </div>
      )}

      {/* Banner gaps críticos */}
      {zonaRiesgo.some(z => z.esGap) && (
        <div style={{ background: '#fff3e0', border: '1px solid #e65100', borderRadius: 8, padding: '10px 16px', marginBottom: 20 }}>
          <strong style={{ color: '#bf360c' }}>⚡ GAPS SÍSMICOS ACTIVOS</strong>
          {[...new Set(zonaRiesgo.filter(z => z.esGap).map(z => z.seg?.nombre))].map(nombre => {
            const z = zonaRiesgo.find(z => z.seg?.nombre === nombre && z.esGap);
            return (
              <div key={nombre} style={{ marginTop: 4, fontSize: 13, color: '#4e342e' }}>
                <strong>{nombre}</strong> — {z?.notas}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, marginBottom: 30, flexWrap: 'wrap' }}>
        {/* Lista de regiones */}
        <div style={{ flex: 1, minWidth: 280, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Riesgo por Región Administrativa</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
            {[...zonaRiesgo].sort((a, b) => b.riesgo - a.riesgo).map(region => (
              <div
                key={region.id}
                onClick={() => setRegionSel(region)}
                style={{
                  padding: '12px 14px',
                  background: getColorByRisk(region.riesgo),
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: region.riesgo > 50 ? '#fff' : '#212121',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transform: regionSeleccionada?.id === region.id ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: regionSeleccionada?.id === region.id ? '0 4px 10px rgba(0,0,0,0.2)' : 'none',
                  transition: 'transform 0.15s'
                }}
              >
                <span>
                  {region.esGap && <span title="Gap sísmico" style={{ marginRight: 6 }}>⚠️</span>}
                  <strong>{region.name}</strong>
                  <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.85 }}>({region.seg?.shortName})</span>
                </span>
                <span style={{ fontWeight: 'bold' }}>{region.riesgo}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de detalles */}
        <div style={{ flex: 1, minWidth: 280, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Detalle del Segmento</h3>
          {regionSeleccionada ? (
            <div>
              <h4 style={{ color: getColorByRisk(regionSeleccionada.riesgo), marginBottom: 12 }}>
                {regionSeleccionada.name}
                <span style={{ fontSize: 13, fontWeight: 'normal', marginLeft: 10, color: '#555' }}>
                  → Segmento: {regionSeleccionada.seg?.nombre}
                </span>
              </h4>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <tbody>
                  {[
                    ['Probabilidad BPT (10 años)', `${regionSeleccionada.riesgo}%`],
                    ['Nivel de riesgo', getClasificacion(regionSeleccionada.riesgo)],
                    ['Último gran sismo', `${regionSeleccionada.ultimoSismo} (Mw${regionSeleccionada.magnitudUltimo})`],
                    ['Años transcurridos', `${AÑO_ACTUAL - regionSeleccionada.ultimoSismo} años`],
                    ['Magnitud característica esperada', `Mw${regionSeleccionada.magnitudEsperada}`],
                    ['Recurrencia media (μ)', `${regionSeleccionada.seg?.recurrenciaMu} años`],
                    ['Acoplamiento sísmico', `${Math.round((regionSeleccionada.seg?.coupling || 0) * 100)}%`],
                    ['Enjambres sísmicos (30 días)', regionSeleccionada.enjambres],
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '6px 4px', color: '#666' }}>{k}</td>
                      <td style={{ padding: '6px 4px', fontWeight: 'bold' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{
                marginTop: 16, padding: 14,
                background: regionSeleccionada.riesgo > 50 ? '#fff3e0' : '#f1f8e9',
                borderRadius: 6,
                borderLeft: `4px solid ${getColorByRisk(regionSeleccionada.riesgo)}`
              }}>
                <strong style={{ fontSize: 13 }}>Contexto sísmico:</strong>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#444' }}>{regionSeleccionada.notas}</p>
              </div>

              <div style={{ marginTop: 14, padding: 14, background: '#e3f2fd', borderRadius: 6 }}>
                <strong style={{ fontSize: 13 }}>Recomendaciones:</strong>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#444' }}>
                  {regionSeleccionada.riesgo > 75
                    ? 'Riesgo elevado. Revisar y actualizar planes de emergencia y simulacros. Verificar construcciones en zona sísmica.'
                    : regionSeleccionada.riesgo > 50
                      ? 'Riesgo moderado. Mantener planes de emergencia actualizados y conocer rutas de evacuación.'
                      : 'Mantener precauciones estándar y conocer los protocolos ante sismos. El ciclo de recarga está en etapa temprana.'}
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: '#888' }}>Haz clic en una región para ver su detalle.</p>
          )}
        </div>
      </div>

      {/* Tabla resumen */}
      <div className="table-container">
        <h3>Tabla de Riesgo Sísmico por Región — {AÑO_ACTUAL}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="prediction-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#1a237e', color: '#fff' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Región</th>
                <th style={{ padding: '10px 8px' }}>Segmento Sísmico</th>
                <th style={{ padding: '10px 8px' }}>Riesgo BPT (%)</th>
                <th style={{ padding: '10px 8px' }}>Último Gran Sismo</th>
                <th style={{ padding: '10px 8px' }}>Años Transcurridos</th>
                <th style={{ padding: '10px 8px' }}>Mag. Esperada</th>
                <th style={{ padding: '10px 8px' }}>Clasificación</th>
              </tr>
            </thead>
            <tbody>
              {[...zonaRiesgo].sort((a, b) => b.riesgo - a.riesgo).map((zona, i) => (
                <tr
                  key={zona.id}
                  onClick={() => setRegionSel(zona)}
                  style={{ background: i % 2 === 0 ? '#fafafa' : '#fff', cursor: 'pointer', borderBottom: '1px solid #e0e0e0' }}
                >
                  <td style={{ padding: '8px' }}>
                    {zona.esGap && <span style={{ marginRight: 4 }}>⚠️</span>}
                    {zona.name}
                  </td>
                  <td style={{ padding: '8px', fontSize: 13, color: '#555' }}>{zona.seg?.shortName}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{
                      background: getColorByRisk(zona.riesgo), color: zona.riesgo > 50 ? '#fff' : '#212121',
                      padding: '2px 10px', borderRadius: 12, fontWeight: 'bold'
                    }}>
                      {zona.riesgo}%
                    </span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{zona.ultimoSismo} (Mw{zona.magnitudUltimo})</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{AÑO_ACTUAL - zona.ultimoSismo}a</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>Mw{zona.magnitudEsperada}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{ background: getColorByRisk(zona.riesgo), color: zona.riesgo > 50 ? '#fff' : '#212121', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                      {getClasificacion(zona.riesgo)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, margin: '20px 0', flexWrap: 'wrap' }}>
        {[['#4caf50', 'Bajo (0–25%)'], ['#ffeb3b', 'Bajo-Moderado (26–50%)'], ['#ff9800', 'Moderado (51–75%)'], ['#f44336', 'Alto (76–100%)']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 18, height: 18, background: c, borderRadius: 3 }} />
            <span style={{ fontSize: 13 }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Metodología */}
      <div style={{ marginTop: 20, padding: 20, background: '#f5f5f5', borderRadius: 8, border: '1px solid #e0e0e0' }}>
        <h3 style={{ borderBottom: '2px solid #1a237e', paddingBottom: 10 }}>Metodología</h3>
        <p style={{ fontSize: 14, color: '#555' }}>
          Las probabilidades de riesgo son calculadas con el <strong>modelo BPT (Brownian Passage Time)</strong> ponderado con
          el <strong>déficit de momento sísmico</strong> y la <strong>actividad precursora</strong>, usando los mismos
          parámetros que la pestaña Predicción Sísmica. Las regiones administrativas se asocian a los 5 segmentos de ruptura
          definidos por la literatura científica (Métois et al. 2016; Moreno et al. 2018).
        </p>
        <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
          Nota: La correlación entre actividad solar y sismicidad no está científicamente establecida y no se incorpora en este modelo.
        </p>
      </div>
    </div>
  );
};

export default MapaRiesgo;
