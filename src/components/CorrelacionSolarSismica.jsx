import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';

// ─── BANNERS REUTILIZABLES ────────────────────────────────────────────────────
const BannerSimulado = () => (
  <div role="alert" aria-live="assertive" style={{
    background: '#fff3e0', border: '2px solid #e65100', borderRadius: 8,
    padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start'
  }}>
    <span style={{ fontSize: 22, lineHeight: 1 }}>⚠️</span>
    <div>
      <strong style={{ color: '#bf360c', fontSize: 15 }}>DATOS SIMULADOS — Solo fines educativos</strong>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4e342e' }}>
        Los datos de esta sección son <strong>ficticios y construidos manualmente</strong>. No provienen
        de bases de datos reales (USGS, NASA, NOAA). No representan observaciones verificadas
        y <strong>no deben usarse para tomar decisiones</strong>.
      </p>
    </div>
  </div>
);

const BannerHipotesis = () => (
  <div role="note" style={{
    background: '#e8eaf6', border: '1px solid #3949ab', borderRadius: 8,
    padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start'
  }}>
    <span style={{ fontSize: 22, lineHeight: 1 }}>🔬</span>
    <div>
      <strong style={{ color: '#1a237e', fontSize: 15 }}>HIPÓTESIS CIENTÍFICA NO VALIDADA</strong>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#283593' }}>
        La correlación entre actividad solar y sismicidad terrestre <strong>no está establecida
        ni aceptada por la comunidad científica</strong>. Los mecanismos propuestos son especulativos.
        Esta pestaña tiene propósito exclusivamente <strong>exploratorio y educativo</strong>.
        El modelo predictivo del sistema <u>no incorpora este factor</u>.
      </p>
    </div>
  </div>
);

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const CorrelacionSolarSismica = () => {
  const [correlacionData, setCorrelacionData] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    correlacionTotal: 0, eventosCoincidentes: 0, totalEventos: 0
  });

  useEffect(() => {
    // NOTA: Estos datos son SIMULADOS y construidos manualmente para ilustración.
    // No representan un análisis estadístico riguroso ni datos reales de catálogos.
    const datos = [
      { año: 2003, mes: 'Oct', magnitudSolar: 'X17.2', claseFlare: 'X', intensidadSolar: 17.2, diasDespues: 3, magnitudSismo: 8.3, ubicacionSismo: 'Hokkaido, Japón',      correlacion: 0.85 },
      { año: 2005, mes: 'Sep', magnitudSolar: 'X17.0', claseFlare: 'X', intensidadSolar: 17.0, diasDespues: 5, magnitudSismo: 7.8, ubicacionSismo: 'Tarapacá, Chile',       correlacion: 0.78 },
      { año: 2006, mes: 'Dic', magnitudSolar: 'X9.0',  claseFlare: 'X', intensidadSolar:  9.0, diasDespues: 4, magnitudSismo: 8.1, ubicacionSismo: 'Islas Kuriles',         correlacion: 0.72 },
      { año: 2010, mes: 'Feb', magnitudSolar: 'M8.3',  claseFlare: 'M', intensidadSolar:  8.3, diasDespues: 7, magnitudSismo: 8.8, ubicacionSismo: 'Maule, Chile',          correlacion: 0.81 },
      { año: 2011, mes: 'Mar', magnitudSolar: 'X1.5',  claseFlare: 'X', intensidadSolar:  1.5, diasDespues: 2, magnitudSismo: 9.0, ubicacionSismo: 'Tohoku, Japón',         correlacion: 0.92 },
      { año: 2012, mes: 'Jul', magnitudSolar: 'X6.9',  claseFlare: 'X', intensidadSolar:  6.9, diasDespues: 6, magnitudSismo: 7.7, ubicacionSismo: 'Costa de Chile',        correlacion: 0.68 },
      { año: 2014, mes: 'Abr', magnitudSolar: 'X1.3',  claseFlare: 'X', intensidadSolar:  1.3, diasDespues: 4, magnitudSismo: 8.2, ubicacionSismo: 'Iquique, Chile',        correlacion: 0.75 },
      { año: 2015, mes: 'Sep', magnitudSolar: 'M7.6',  claseFlare: 'M', intensidadSolar:  7.6, diasDespues: 5, magnitudSismo: 8.3, ubicacionSismo: 'Illapel, Chile',        correlacion: 0.79 },
      { año: 2017, mes: 'Sep', magnitudSolar: 'X9.3',  claseFlare: 'X', intensidadSolar:  9.3, diasDespues: 8, magnitudSismo: 8.1, ubicacionSismo: 'Chiapas, México',       correlacion: 0.83 },
      { año: 2019, mes: 'Jul', magnitudSolar: 'M5.2',  claseFlare: 'M', intensidadSolar:  5.2, diasDespues: 3, magnitudSismo: 7.1, ubicacionSismo: 'Ridgecrest, California', correlacion: 0.65 },
      { año: 2020, mes: 'May', magnitudSolar: 'M7.4',  claseFlare: 'M', intensidadSolar:  7.4, diasDespues: 4, magnitudSismo: 7.4, ubicacionSismo: 'Oaxaca, México',        correlacion: 0.71 },
      { año: 2021, mes: 'Oct', magnitudSolar: 'X1.0',  claseFlare: 'X', intensidadSolar:  1.0, diasDespues: 6, magnitudSismo: 7.5, ubicacionSismo: 'Alaska',                correlacion: 0.67 },
      { año: 2022, mes: 'Feb', magnitudSolar: 'X1.3',  claseFlare: 'X', intensidadSolar:  1.3, diasDespues: 5, magnitudSismo: 7.3, ubicacionSismo: 'Atacama, Chile',        correlacion: 0.73 },
      { año: 2022, mes: 'Nov', magnitudSolar: 'X3.3',  claseFlare: 'X', intensidadSolar:  3.3, diasDespues: 4, magnitudSismo: 7.0, ubicacionSismo: 'Perú–Ecuador',          correlacion: 0.69 },
      { año: 2023, mes: 'Mar', magnitudSolar: 'X2.2',  claseFlare: 'X', intensidadSolar:  2.2, diasDespues: 3, magnitudSismo: 7.2, ubicacionSismo: 'Nueva Zelanda',         correlacion: 0.74 },
    ];

    const eventosCoincidentes = datos.filter(d => d.correlacion > 0.7).length;
    const correlacionPromedio  = datos.reduce((sum, d) => sum + d.correlacion, 0) / datos.length;
    setCorrelacionData(datos);
    setEstadisticas({
      correlacionTotal:      correlacionPromedio.toFixed(2),
      eventosCoincidentes,
      totalEventos:          datos.length,
      porcentajeCoincidencia: ((eventosCoincidentes / datos.length) * 100).toFixed(1)
    });
    setCargando(false);
  }, []);

  if (cargando) return <div style={{ padding: 50, textAlign: 'center' }}>Cargando datos de ejemplo…</div>;

  const scatterData = correlacionData.map(item => ({
    x: item.intensidadSolar, y: item.magnitudSismo,
    z: item.correlacion * 10,
    name: `${item.año} – ${item.ubicacionSismo}`,
    año: item.año, flare: item.magnitudSolar,
    sismo: item.magnitudSismo, ubicacion: item.ubicacionSismo,
    diasDespues: item.diasDespues
  }));

  const timelineData = [...correlacionData].sort((a, b) => a.año - b.año);

  return (
    <div className="correlation-container">

      {/* ── Encabezado con contexto claro ── */}
      <h2>Análisis Exploratorio: Hipótesis de Correlación Solar–Sísmica</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: -6, marginBottom: 20 }}>
        Visualización educativa e hipotética. No forma parte del modelo predictivo del sistema.
      </p>

      {/* ── Banners de advertencia — P0 críticos ── */}
      <BannerSimulado />
      <BannerHipotesis />

      {/* ── Gráficos ── */}
      <div className="correlation-grid">
        <div className="chart-container">
          <h3>Relación Hipotética: Intensidad Solar vs. Magnitud Sísmica <span style={{ fontWeight: 'normal', fontSize: 13, color: 'var(--text-muted)' }}>(datos simulados)</span></h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name="Intensidad Solar"
                label={{ value: 'Intensidad Solar (Clase M/X)', position: 'bottom', offset: 0 }} />
              <YAxis type="number" dataKey="y" name="Magnitud Sísmica"
                label={{ value: 'Magnitud Sísmica', angle: -90, position: 'insideLeft' }} />
              <ZAxis type="number" dataKey="z" range={[60, 200]} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: '#fff', border: '1px solid #ccc', padding: 12, borderRadius: 6, fontSize: 13 }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{d.año} — {d.ubicacion}</p>
                    <p style={{ margin: '4px 0 0' }}>Explosión solar: {d.flare}</p>
                    <p style={{ margin: '2px 0' }}>Magnitud sísmica: {d.sismo}</p>
                    <p style={{ margin: '2px 0' }}>Días después: {d.diasDespues}</p>
                    <p style={{ margin: '4px 0 0', color: '#b71c1c', fontSize: 12 }}>⚠ Dato simulado</p>
                  </div>
                );
              }} />
              <Legend />
              <Scatter name="Eventos (simulados)" data={scatterData} fill="#7986cb" shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Evolución Temporal de Correlaciones (2003–2023) <span style={{ fontWeight: 'normal', fontSize: 13, color: 'var(--text-muted)' }}>(datos simulados)</span></h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="año" />
              <YAxis yAxisId="left"  domain={[0, 1]} label={{ value: 'Correlación (hipotética)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" domain={[6, 10]} label={{ value: 'Magnitud Sísmica', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left"  type="monotone" dataKey="correlacion"    stroke="#7986cb" name="Correlación hipotética" strokeWidth={2} dot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="magnitudSismo"  stroke="#ef9a9a" name="Magnitud Sísmica"       strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="table-container">
        <h3>
          Tabla de Eventos Seleccionados
          <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 'normal', color: 'var(--text-muted)' }}>
            ⚠ Datos simulados — no son registros reales
          </span>
        </h3>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="prediction-table" style={{ minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#3949ab', color: '#fff' }}>
                <th style={{ padding: '10px 8px' }}>Fecha</th>
                <th style={{ padding: '10px 8px' }}>Explosión Solar</th>
                <th style={{ padding: '10px 8px' }}>Intensidad</th>
                <th style={{ padding: '10px 8px' }}>Días después</th>
                <th style={{ padding: '10px 8px' }}>Magnitud Sísmica</th>
                <th style={{ padding: '10px 8px' }}>Ubicación</th>
                <th style={{ padding: '10px 8px' }}>Corr. hipotética</th>
              </tr>
            </thead>
            <tbody>
              {correlacionData.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                  <td style={{ padding: '8px' }}>{item.mes} {item.año}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: item.claseFlare === 'X' ? '#b71c1c' : '#e65100' }}>
                    {item.magnitudSolar}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.intensidadSolar.toFixed(1)}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.diasDespues}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.magnitudSismo.toFixed(1)}</td>
                  <td style={{ padding: '8px' }}>{item.ubicacionSismo}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.correlacion.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Análisis con lenguaje apropiadamente hedgeado ── */}
      <div className="correlation-info" style={{ marginTop: 24 }}>
        <h3>Contexto del Análisis Hipotético</h3>

        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
          <p style={{ margin: 0 }}>
            En este ejercicio exploratorio con datos simulados, se observa una correlación
            promedio de <strong>{estadisticas.correlacionTotal}</strong> entre
            explosiones solares de clase M/X y sismos seleccionados ({estadisticas.totalEventos} pares de eventos).
            De ellos, {estadisticas.eventosCoincidentes} ({estadisticas.porcentajeCoincidencia}%) superan
            una correlación hipotética de 0.7.
          </p>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            <strong>Advertencia estadística:</strong> Seleccionar manualmente pares de eventos produce
            sesgo de confirmación. Un análisis real requeriría todos los eventos en ambos catálogos,
            sin selección, y controles estadísticos rigurosos.
          </p>
        </div>

        <div style={{ background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 14 }}>
          <p style={{ margin: 0 }}>
            <strong>Mecanismo propuesto (hipotético):</strong> Se ha especulado que las tormentas
            geomagnéticas inducidas por explosiones solares podrían generar corrientes telúricas
            capaces de actuar como desencadenantes en zonas de alta tensión tectónica.
            <strong style={{ color: '#bf360c' }}> Este mecanismo no ha sido demostrado experimentalmente
            ni validado por la comunidad científica.</strong>
          </p>
        </div>

        <div style={{ background: '#e8f5e9', border: '1px solid #81c784', borderRadius: 8, padding: 16, fontSize: 14 }}>
          <p style={{ margin: 0 }}>
            <strong>Posición del modelo predictivo del sistema:</strong> El modelo BPT + Déficit de
            Momento Sísmico utilizado en las pestañas <em>Predicción Sísmica</em> y <em>Mapa de Riesgo</em>
            <strong> no incorpora correlación solar</strong>, siguiendo el consenso científico actual.
            Los factores utilizados son: intervalos de recurrencia históricos, acoplamiento sísmico
            geodésico y actividad de enjambres precursores.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CorrelacionSolarSismica;
