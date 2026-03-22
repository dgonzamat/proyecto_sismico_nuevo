import React, { useState, useEffect, useCallback } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  LineChart, Line
} from 'recharts';

// ─── LLAMARADAS SOLARES CLASE X — Catálogo NOAA/GOES (2001–2024) ─────────────
// Fuente: NOAA National Centers for Environmental Information (NCEI)
//   https://www.ngdc.noaa.gov/stp/space-weather/solar-data/solar-features/solar-flares/
// Solo se incluyen eventos X-class (irradiancia de pico ≥ 1×10⁻⁴ W/m²).
// Estos son registros observacionales verificados, no datos simulados.
const FLARES_X_CLASS = [
  { fecha: '2001-04-02', clase: 'X20.0', intensidad: 20.0, nota: 'Pico del ciclo solar 23' },
  { fecha: '2001-04-15', clase: 'X14.4', intensidad: 14.4 },
  { fecha: '2003-10-28', clase: 'X17.2', intensidad: 17.2, nota: 'Halloween Storm I' },
  { fecha: '2003-10-29', clase: 'X10.0', intensidad: 10.0, nota: 'Halloween Storm II' },
  { fecha: '2003-11-04', clase: 'X28.0', intensidad: 28.0, nota: 'Mayor registrado del ciclo 23' },
  { fecha: '2005-09-07', clase: 'X17.0', intensidad: 17.0 },
  { fecha: '2005-09-08', clase: 'X5.4',  intensidad: 5.4  },
  { fecha: '2006-12-05', clase: 'X9.0',  intensidad: 9.0  },
  { fecha: '2006-12-06', clase: 'X6.5',  intensidad: 6.5  },
  { fecha: '2011-02-15', clase: 'X2.2',  intensidad: 2.2  },
  { fecha: '2011-03-09', clase: 'X1.5',  intensidad: 1.5  },
  { fecha: '2012-03-05', clase: 'X1.1',  intensidad: 1.1  },
  { fecha: '2012-07-12', clase: 'X1.4',  intensidad: 1.4  },
  { fecha: '2013-05-13', clase: 'X1.7',  intensidad: 1.7  },
  { fecha: '2013-05-14', clase: 'X3.2',  intensidad: 3.2  },
  { fecha: '2013-10-25', clase: 'X2.1',  intensidad: 2.1  },
  { fecha: '2013-11-05', clase: 'X3.3',  intensidad: 3.3  },
  { fecha: '2014-02-25', clase: 'X4.9',  intensidad: 4.9  },
  { fecha: '2014-03-29', clase: 'X1.0',  intensidad: 1.0  },
  { fecha: '2014-09-10', clase: 'X1.6',  intensidad: 1.6  },
  { fecha: '2017-09-06', clase: 'X9.3',  intensidad: 9.3, nota: 'Mayor del ciclo 24' },
  { fecha: '2017-09-10', clase: 'X8.2',  intensidad: 8.2  },
  { fecha: '2021-07-03', clase: 'X1.5',  intensidad: 1.5  },
  { fecha: '2022-03-28', clase: 'X1.3',  intensidad: 1.3  },
  { fecha: '2022-10-02', clase: 'X1.0',  intensidad: 1.0  },
  { fecha: '2023-03-03', clase: 'X2.1',  intensidad: 2.1  },
  { fecha: '2023-07-02', clase: 'X1.0',  intensidad: 1.0  },
  { fecha: '2024-05-08', clase: 'X5.8',  intensidad: 5.8, nota: 'Tormenta geomagnética G4' },
  { fecha: '2024-05-09', clase: 'X1.7',  intensidad: 1.7  },
  { fecha: '2024-10-03', clase: 'X9.0',  intensidad: 9.0  },
];

const VENTANA_DIAS    = 7;    // días post-flare para buscar sismos
const MIN_MAGNITUD    = 6.5;  // M6.5+ globales
const FECHA_INICIO    = '2001-01-01';

// ─── BANNER FUENTES ───────────────────────────────────────────────────────────
const BannerFuentes = () => (
  <div role="note" style={{
    background: '#e3f2fd', border: '1px solid #1565c0', borderRadius: 8,
    padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start'
  }}>
    <span style={{ fontSize: 20, lineHeight: 1 }}>📡</span>
    <div style={{ fontSize: 13, color: '#0d47a1' }}>
      <strong style={{ fontSize: 14 }}>Fuentes de datos reales</strong>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
        <li><strong>Llamaradas solares:</strong> Catálogo NOAA/GOES — clase X (irradiancia ≥ 1×10⁻⁴ W/m²), ciclos 23–25</li>
        <li><strong>Terremotos:</strong> USGS Earthquake Hazards Program — M{MIN_MAGNITUD}+ globales desde {FECHA_INICIO}</li>
      </ul>
    </div>
  </div>
);

// ─── BANNER HIPÓTESIS ─────────────────────────────────────────────────────────
const BannerHipotesis = () => (
  <div role="note" style={{
    background: '#fff8e1', border: '1px solid #f9a825', borderRadius: 8,
    padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start'
  }}>
    <span style={{ fontSize: 20, lineHeight: 1 }}>🔬</span>
    <div style={{ fontSize: 13, color: '#5d4037' }}>
      <strong style={{ fontSize: 14, color: '#e65100' }}>HIPÓTESIS NO VALIDADA — Análisis exploratorio</strong>
      <p style={{ margin: '4px 0 0' }}>
        La correlación entre actividad solar y sismicidad terrestre{' '}
        <strong>no está establecida ni aceptada por la comunidad científica</strong>.
        Este análisis compara datos reales para explorar la hipótesis, pero una coincidencia
        temporal no implica causalidad. El modelo predictivo del sistema{' '}
        <u>no incorpora factores solares</u>.
      </p>
    </div>
  </div>
);

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const CorrelacionSolarSismica = () => {
  const [pares,       setPares]       = useState([]);
  const [estadisticas,setEstadisticas]= useState(null);
  const [cargando,    setCargando]    = useState(true);
  const [error,       setError]       = useState(null);
  const [totalSismos, setTotalSismos] = useState(0);

  const fetchYProcesar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      // USGS: todos los sismos M6.5+ desde 2001 (un único request)
      const hoy  = new Date().toISOString().split('T')[0];
      const url  = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson`
                 + `&minmagnitude=${MIN_MAGNITUD}&starttime=${FECHA_INICIO}&endtime=${hoy}`
                 + `&orderby=time-asc&limit=3000`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`USGS ${resp.status}: ${resp.statusText}`);
      const data = await resp.json();
      const terremotosList = data.features;
      setTotalSismos(terremotosList.length);

      // Baseline: tasa media de sismos M6.5+ por día en el período
      const diasTotales  = (new Date(hoy) - new Date(FECHA_INICIO)) / 864e5;
      const tasaDiaria   = terremotosList.length / diasTotales;
      const baselineVentana = tasaDiaria * VENTANA_DIAS;

      // Para cada flare X, buscar sismos en la ventana post-flare
      const paresCalc = FLARES_X_CLASS
        .filter(f => new Date(f.fecha) >= new Date(FECHA_INICIO))
        .map(flare => {
          const t0 = new Date(flare.fecha).getTime();
          const t1 = t0 + VENTANA_DIAS * 864e5;

          const sismosVentana = terremotosList.filter(s => {
            const t = s.properties.time;
            return t >= t0 && t <= t1;
          });

          const maxMag = sismosVentana.length > 0
            ? Math.max(...sismosVentana.map(s => s.properties.mag))
            : 0;

          return {
            ...flare,
            año: parseInt(flare.fecha.split('-')[0]),
            mesStr: new Date(flare.fecha).toLocaleString('es-CL', { month: 'short', year: '2-digit' }),
            sismosVentana: sismosVentana.length,
            maxMag,
            detalle: sismosVentana.slice(0, 4).map(s => ({
              mag:   s.properties.mag,
              lugar: s.properties.place,
              dias:  Math.round((s.properties.time - t0) / 864e5),
            })),
          };
        });

      setPares(paresCalc);

      // Estadísticas reales
      const obsTotal   = paresCalc.reduce((a, p) => a + p.sismosVentana, 0);
      const espTotal   = FLARES_X_CLASS.length * baselineVentana;
      const ratio      = espTotal > 0 ? obsTotal / espTotal : 1;
      const conSismo   = paresCalc.filter(p => p.sismosVentana > 0).length;

      let interpretacion;
      if (ratio > 1.3)     interpretacion = 'mayor que lo esperado al azar — sugestivo, pero requiere análisis estadístico formal';
      else if (ratio < 0.7) interpretacion = 'menor que lo esperado al azar — sin evidencia de correlación positiva';
      else                  interpretacion = 'estadísticamente similar al azar — sin evidencia de correlación';

      setEstadisticas({
        baselineVentana:  baselineVentana.toFixed(2),
        obsTotal,
        espTotal:         espTotal.toFixed(1),
        ratio:            ratio.toFixed(2),
        conSismo,
        totalFlares:      paresCalc.length,
        interpretacion,
      });
    } catch (e) {
      setError(e.message || 'No se pudo conectar con USGS.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { fetchYProcesar(); }, [fetchYProcesar]);

  // ── Scatter data ──
  const scatterData = pares.map(p => ({
    x:         p.intensidad,
    y:         p.sismosVentana,
    z:         Math.max(p.intensidad * 8, 40),
    label:     `${p.clase} (${p.mesStr})`,
    nota:      p.nota,
    maxMag:    p.maxMag,
    detalle:   p.detalle,
  }));

  // ── Timeline anual agrupado ──
  const timelineAnual = (() => {
    const map = {};
    pares.forEach(p => {
      if (!map[p.año]) map[p.año] = { año: p.año, flaresX: 0, sismosEnVentana: 0 };
      map[p.año].flaresX++;
      map[p.año].sismosEnVentana += p.sismosVentana;
    });
    return Object.values(map).sort((a, b) => a.año - b.año);
  })();

  return (
    <div className="correlation-container">
      <h2>Análisis Exploratorio: Hipótesis de Correlación Solar–Sísmica</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: -6, marginBottom: 20 }}>
        Datos reales de NOAA/GOES y USGS. No forma parte del modelo predictivo del sistema.
      </p>

      <BannerFuentes />
      <BannerHipotesis />

      {/* ── Estado de carga ── */}
      {cargando && (
        <div role="status" aria-live="polite"
             style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px' }} aria-hidden="true" />
          Descargando {FLARES_X_CLASS.length} llamaradas solares y sismos M{MIN_MAGNITUD}+ desde USGS…
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div role="alert" style={{
          padding: 16, background: '#ffebee', borderRadius: 8, marginBottom: 16,
          border: '1px solid #ef9a9a', display: 'flex', justifyContent: 'space-between', gap: 16
        }}>
          <div>
            <strong style={{ color: '#c62828' }}>⚠️ Error al cargar datos USGS</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#b71c1c' }}>{error}</p>
          </div>
          <button onClick={fetchYProcesar}
            style={{ padding: '8px 16px', background: '#c62828', color: '#fff',
                     border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && estadisticas && (
        <>
          {/* ── Resumen estadístico ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12, marginBottom: 24
          }}>
            {[
              { label: 'Llamaradas X analizadas', valor: estadisticas.totalFlares, sub: 'Catálogo NOAA 2001–2024' },
              { label: `Sismos M${MIN_MAGNITUD}+ globales`, valor: totalSismos, sub: 'USGS, mismo período' },
              { label: 'Baseline esperado', valor: `~${estadisticas.baselineVentana}`, sub: `sismos M${MIN_MAGNITUD}+ por ventana de ${VENTANA_DIAS} días` },
              { label: 'Ratio observado/esperado', valor: estadisticas.ratio, sub: estadisticas.ratio > 1.1 ? '↑ ligeramente mayor' : estadisticas.ratio < 0.9 ? '↓ ligeramente menor' : '≈ sin diferencia', valColor: Math.abs(estadisticas.ratio - 1) > 0.2 ? '#e65100' : '#2e7d32' },
            ].map(({ label, valor, sub, valColor }) => (
              <div key={label} style={{
                background: '#f5f5f5', borderRadius: 8, padding: '14px 16px',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 'bold', color: valColor || 'var(--text-primary)' }}>{valor}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* ── Interpretación ── */}
          <div style={{
            background: '#e8f5e9', border: '1px solid #81c784', borderRadius: 8,
            padding: '12px 16px', marginBottom: 24, fontSize: 14
          }}>
            <strong>Resultado:</strong> En las {VENTANA_DIAS} días tras cada llamarada X-class,
            se observaron <strong>{estadisticas.obsTotal}</strong> sismos M{MIN_MAGNITUD}+,
            versus <strong>{estadisticas.espTotal}</strong> esperados por azar (ratio = {estadisticas.ratio}).
            Esto es <em>{estadisticas.interpretacion}</em>.
          </div>

          {/* ── Gráficos ── */}
          <div className="correlation-grid">
            <div className="chart-container">
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>
                Intensidad del flare vs. sismos M{MIN_MAGNITUD}+ en ventana de {VENTANA_DIAS} días
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 0, marginBottom: 8 }}>
                Datos reales NOAA + USGS. La línea punteada indica el baseline estadístico.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name="Intensidad (X)"
                    label={{ value: 'Intensidad flare (clase X)', position: 'bottom', offset: 10, fontSize: 12 }}
                    domain={[0, 'dataMax + 2']} />
                  <YAxis type="number" dataKey="y" name="Sismos"
                    label={{ value: `Sismos M${MIN_MAGNITUD}+ (7d)`, angle: -90, position: 'insideLeft', fontSize: 12 }}
                    allowDecimals={false} />
                  <ZAxis type="number" dataKey="z" range={[40, 200]} />
                  <ReferenceLine y={parseFloat(estadisticas.baselineVentana)} stroke="#2e7d32"
                    strokeDasharray="6 3"
                    label={{ value: `Baseline: ${estadisticas.baselineVentana}`, position: 'right', fontSize: 11, fill: '#2e7d32' }} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    if (!d) return null;
                    return (
                      <div style={{ background: '#fff', border: '1px solid #ddd', padding: 12, borderRadius: 6, fontSize: 13, maxWidth: 260 }}>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{d.label}</p>
                        {d.nota && <p style={{ margin: '2px 0', fontSize: 12, color: '#e65100' }}>{d.nota}</p>}
                        <p style={{ margin: '4px 0 0' }}>Sismos M{MIN_MAGNITUD}+ en {VENTANA_DIAS}d: <strong>{d.y}</strong></p>
                        {d.y > 0 && d.maxMag > 0 && <p style={{ margin: '2px 0' }}>Mayor: M{d.maxMag.toFixed(1)}</p>}
                        {d.detalle?.map((s, i) => (
                          <p key={i} style={{ margin: '2px 0', fontSize: 11, color: '#555' }}>
                            +{s.dias}d · M{s.mag} · {s.lugar?.slice(0, 35)}
                          </p>
                        ))}
                      </div>
                    );
                  }} />
                  <Scatter name="Llamaradas X-class (NOAA)" data={scatterData} fill="#7986cb" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>
                Actividad anual: llamaradas X vs. sismos en ventana
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 0, marginBottom: 8 }}>
                Agrupado por año. Si hubiera correlación clara, ambas líneas deberían co-variar.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineAnual} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="año" />
                  <YAxis yAxisId="left"  label={{ value: 'Flares X/año',    angle: -90, position: 'insideLeft',  fontSize: 11, dx: -2 }} />
                  <YAxis yAxisId="right" orientation="right"
                         label={{ value: `Sismos M${MIN_MAGNITUD}+ en ventana`, angle: 90, position: 'insideRight', fontSize: 11, dx: 8 }} />
                  <Tooltip formatter={(val, name) => [val, name]} />
                  <Legend />
                  <Line yAxisId="left"  type="monotone" dataKey="flaresX"        stroke="#7986cb" name="Llamaradas X (NOAA)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="sismosEnVentana" stroke="#ef9a9a" name={`Sismos M${MIN_MAGNITUD}+ post-flare (USGS)`} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Tabla detallada ── */}
          <h3 style={{ marginTop: 24 }}>
            Tabla: llamaradas X-class y sismos M{MIN_MAGNITUD}+ en los {VENTANA_DIAS} días siguientes
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 'normal', color: 'var(--text-muted)' }}>
              (datos reales NOAA + USGS)
            </span>
          </h3>
          <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680, fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#3949ab', color: '#fff' }}>
                  <th scope="col" style={{ padding: '10px 8px', textAlign: 'left' }}>Fecha flare</th>
                  <th scope="col" style={{ padding: '10px 8px', textAlign: 'center' }}>Clase (NOAA)</th>
                  <th scope="col" style={{ padding: '10px 8px', textAlign: 'center' }}>Intensidad</th>
                  <th scope="col" style={{ padding: '10px 8px', textAlign: 'center' }}>Sismos M{MIN_MAGNITUD}+ en {VENTANA_DIAS}d</th>
                  <th scope="col" style={{ padding: '10px 8px', textAlign: 'center' }}>Mayor magnitud</th>
                  <th scope="col" style={{ padding: '10px 8px', textAlign: 'left' }}>Evento destacado (USGS)</th>
                </tr>
              </thead>
              <tbody>
                {pares.map((p, i) => (
                  <tr key={p.fecha}
                    style={{ background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px' }}>{p.fecha}{p.nota && <span style={{ display: 'block', fontSize: 11, color: '#e65100' }}>{p.nota}</span>}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#b71c1c' }}>{p.clase}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{p.intensidad.toFixed(1)}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{
                        background: p.sismosVentana > 0 ? '#ffcdd2' : '#e8f5e9',
                        color:      p.sismosVentana > 0 ? '#b71c1c' : '#2e7d32',
                        padding: '2px 10px', borderRadius: 12, fontWeight: 'bold'
                      }}>
                        {p.sismosVentana}
                      </span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {p.maxMag > 0 ? `M ${p.maxMag.toFixed(1)}` : '—'}
                    </td>
                    <td style={{ padding: '8px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {p.detalle.length > 0
                        ? `+${p.detalle[0].dias}d · ${p.detalle[0].lugar?.slice(0, 45) ?? '—'}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Contexto científico ── */}
          <div style={{ marginTop: 28 }}>
            <h3>Contexto científico</h3>
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0 }}>
                <strong>Advertencia estadística:</strong> Incluso con datos reales, un ratio ≈ 1.0 es el resultado
                esperado si no existe correlación. Para establecer causalidad se requeriría un análisis formal
                (test chi-cuadrado, corrección por múltiples comparaciones, control de sesgo de selección) con
                todos los eventos en ambos catálogos —no solo los grandes— y ventanas de tiempo no elegidas a posteriori.
              </p>
            </div>
            <div style={{ background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 14 }}>
              <p style={{ margin: 0 }}>
                <strong>Mecanismo propuesto (hipotético):</strong> Algunos investigadores han especulado que
                las tormentas geomagnéticas inducidas por llamaradas solares podrían generar corrientes telúricas
                capaces de actuar como desencadenantes en zonas de alta tensión tectónica.{' '}
                <strong style={{ color: '#bf360c' }}>
                  Este mecanismo no ha sido demostrado experimentalmente ni validado por la comunidad científica.
                </strong>
              </p>
            </div>
            <div style={{ background: '#e8f5e9', border: '1px solid #81c784', borderRadius: 8, padding: 16, fontSize: 14 }}>
              <p style={{ margin: 0 }}>
                <strong>Posición del modelo predictivo del sistema:</strong> El modelo BPT + Déficit de
                Momento Sísmico utilizado en <em>Predicción Sísmica</em> y <em>Mapa de Riesgo</em>{' '}
                <strong>no incorpora correlación solar</strong>, siguiendo el consenso científico actual.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CorrelacionSolarSismica;
