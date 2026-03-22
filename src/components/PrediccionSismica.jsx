import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LabelList, LineChart, Line, ReferenceLine,
  ErrorBar
} from 'recharts';
import { contarSismosCinturonFuego, contarEnjambresZona } from '../api/sismos';
import {
  bptProbabilidadCondicional,
  bptHazardRate,
  calcularBValue,
  calcularRatioDeficitMomento,
  monteCarloBPT,
  SEGMENTOS_CHILE,
  DESCRIPCION_MODELO,
  clasificarProfundidad,
  bptCDF
} from '../api/modeloSismologico';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS UI — usa variables CSS definidas en base.css
// ─────────────────────────────────────────────────────────────────────────────

// Colores por nivel — mapean a las variables CSS de base.css
const nivelColor = (nivel) => {
  switch (nivel) {
    case 'CRÍTICO':   return 'var(--risk-critical)';
    case 'MUY ALTO':  return 'var(--risk-very-high)';
    case 'ALTO':      return 'var(--risk-high)';
    case 'MODERADO':  return 'var(--risk-moderate)';
    case 'BAJO':      return 'var(--risk-low)';
    case 'MUY BAJO':  return 'var(--risk-very-low)';
    default:          return '#757575';
  }
};

// Icono de forma geométrica para accesibilidad de daltónicos
// No depende solo del color: WCAG 1.4.1 — uso de color
const nivelIcono = (nivel) => {
  switch (nivel) {
    case 'CRÍTICO':   return '▲▲';  // triángulo doble — máximo peligro
    case 'MUY ALTO':  return '▲';   // triángulo — muy alto
    case 'ALTO':      return '◆';   // diamante — alto
    case 'MODERADO':  return '■';   // cuadrado — moderado
    case 'BAJO':      return '●';   // círculo — bajo
    case 'MUY BAJO':  return '▼';   // triángulo invertido — muy bajo
    default:          return '–';
  }
};

const tendenciaLabel = (t) => {
  switch (t) {
    case 'aumento_rapido': return '↑↑ Aumento rápido';
    case 'aumento':        return '↑ En aumento';
    case 'estable':        return '→ Estable';
    case 'disminucion':    return '↓ Disminuyendo';
    default:               return '→ Estable';
  }
};

// Glosario de términos técnicos — P0: info comprensible para el público general
const GLOSARIO = {
  BPT:      'Brownian Passage Time: modelo estadístico que calcula la probabilidad de que ocurra el siguiente gran sismo, basado en el tiempo transcurrido y el intervalo de recurrencia histórico del segmento.',
  IC90:     'Intervalo de Confianza al 90%: rango en el que se encuentra la probabilidad real con 90% de certeza, calculado mediante 800 simulaciones Monte Carlo.',
  DEFICIT:  'Déficit de Momento Sísmico: cuánta energía tectónica ha acumulado la falla desde su última ruptura mayor, comparado con lo esperado para el próximo gran terremoto.',
  COUPLING: 'Acoplamiento sísmico: qué fracción del movimiento relativo entre placas se acumula como energía elástica (0 = libre, 1 = totalmente bloqueado).',
  MU:       'Intervalo de recurrencia medio (μ): promedio de tiempo entre grandes terremotos históricos en este segmento.',
  ALPHA:    'Aperiodicidad (α): variabilidad del ciclo sísmico. Valores bajos (0.3) = ciclo muy regular; valores altos (0.7) = ciclo muy irregular.',
  BVALUE:   'Valor-b de Gutenberg-Richter: parámetro que describe la proporción entre sismos pequeños y grandes. b ≈ 1.0 es lo normal; b < 0.8 indica más sismos grandes.',
};

// Componente tooltip de glosario inline
const InfoTip = ({ termino }) => (
  <span
    title={GLOSARIO[termino]}
    aria-label={`Definición de ${termino}: ${GLOSARIO[termino]}`}
    style={{ cursor: 'help', borderBottom: '1px dotted #666', fontSize: 12, marginLeft: 4, color: 'var(--text-muted)' }}
  >
    [?]
  </span>
);

// Disclaimer científico reutilizable
const DisclaimerCientifico = () => (
  <div role="note" style={{
    background: '#fff8e1', border: '1px solid #ffd54f', borderRadius: 8,
    padding: '12px 16px', marginBottom: 20, fontSize: 13,
    color: 'var(--text-secondary)', display: 'flex', gap: 10, alignItems: 'flex-start'
  }}>
    <span style={{ fontSize: 18 }}>ℹ️</span>
    <div>
      <strong>Advertencia:</strong> Este sistema ofrece <strong>estimaciones probabilísticas</strong>,
      no predicciones exactas. Los terremotos son fenómenos complejos e impredecibles con exactitud.
      Las probabilidades tienen alta incertidumbre (ver Intervalo de Confianza).
      <strong> No uses este sistema como única base para decisiones de seguridad.</strong>
    </div>
  </div>
);

const AÑO_ACTUAL = 2026;
const VENTANA = 10; // años de predicción (2026-2036)

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const PrediccionSismica = ({ datosHistoricos, fuenteDeDatos, cargando, onActualizar }) => {
  const [predicciones, setPredicciones]           = useState([]);
  const [ultimaActualizacion, setUltimaAct]       = useState(null);
  const [actualizando, setActualizando]           = useState(false);
  const [modoAvanzado, setModoAvanzado]           = useState(false);
  const [sortConfig, setSortConfig]               = useState({ key: 'probabilidad', direction: 'descending' });
  const [sismosCinturon, setSismosCinturon]       = useState(null);
  const [cargandoFactores, setCargandoFactores]   = useState(false);
  const [errorFactores, setErrorFactores]         = useState(null);
  const [hazardCurvas, setHazardCurvas]           = useState([]);

  // ─── Sismos históricos filtrados por lat/lon para cada segmento ─────────────
  // Usa datosHistoricos (prop de App.js) que ya incluye lat/lon y segmentoId.
  // Filtro doble: latitud Y longitud, para excluir eventos del interior andino
  // o del océano abierto que no corresponden a la interfaz de subducción.
  const getSismosSegmento = (seg, magMin = 7.0) =>
    datosHistoricos
      .filter(s =>
        s.lat != null && s.lon != null &&
        s.lat >= seg.minLat && s.lat <= seg.maxLat &&
        s.lon >= seg.minLon && s.lon <= seg.maxLon &&
        s.magnitud >= magMin
      )
      .sort((a, b) => a.año - b.año);

  // ─── Motor de predicción ──────────────────────────────────────────────────
  const generarPredicciones = async () => {
    setCargandoFactores(true);
    setErrorFactores(null);
    try {
      // Datos externos en paralelo
      const [sismosFuego, ...enjambresArr] = await Promise.all([
        contarSismosCinturonFuego(),
        ...SEGMENTOS_CHILE.map(s =>
          contarEnjambresZona(s.minLat, s.maxLat, s.minLon, s.maxLon)
        )
      ]);
      setSismosCinturon(sismosFuego);

      // ── Cálculo por segmento ──────────────────────────────────────────────
      const nuevasPredicciones = SEGMENTOS_CHILE.map((seg, idx) => {
        const t = AÑO_ACTUAL - seg.ultimoGranSismoAño;

        // 1. MODELO BPT (70% del peso)
        const probBPT = bptProbabilidadCondicional(t, seg.recurrenciaMu, seg.aperiodicidad, VENTANA);

        // 2. DÉFICIT DE MOMENTO SÍSMICO (20% del peso)
        const ratioDeficit = calcularRatioDeficitMomento(
          t, seg.magnitudCaracteristica, seg.coupling, seg.areaFalla
        );
        const factorDeficit = Math.min(1, ratioDeficit);

        // 3. ENJAMBRES SÍSMICOS — señal precursora (10% del peso)
        const enjambres = enjambresArr[idx] || 0;
        const factorEnjambres = Math.min(1, enjambres * 0.08);

        // Probabilidad compuesta
        const probFinal = Math.min(0.99, Math.max(0.01,
          0.70 * probBPT + 0.20 * factorDeficit + 0.10 * factorEnjambres
        ));

        // 4. INTERVALOS DE CONFIANZA — Monte Carlo 800 simulaciones
        const ic = monteCarloBPT(t, seg.recurrenciaMu, seg.aperiodicidad, VENTANA, 800);

        // 5. VALOR-b  (Gutenberg-Richter)
        const sismos = getSismosSegmento(seg, 7.0);
        const mags = sismos.map(s => s.magnitud).filter(Boolean);
        const { b, sigma: bSigma, n: nSismos } = calcularBValue(mags, 7.0);

        // 6. PROFUNDIDAD CARACTERÍSTICA
        const profundidades = sismos.map(s => s.profundidad).filter(Boolean).sort((a, b) => a - b);
        const profMediana = profundidades[Math.floor(profundidades.length / 2)] || null;
        const { tipo: tipoFalla } = clasificarProfundidad(profMediana);

        // 7. TENDENCIA (comparar hazard rate ahora vs. hace 5 años)
        const hAhora  = bptHazardRate(t, seg.recurrenciaMu, seg.aperiodicidad);
        const hAntes  = bptHazardRate(Math.max(1, t - 5), seg.recurrenciaMu, seg.aperiodicidad);
        const deltaH  = hAhora - hAntes;
        let tendencia = 'estable';
        if (deltaH > 0.003) tendencia = 'aumento_rapido';
        else if (deltaH > 0.0005) tendencia = 'aumento';
        else if (deltaH < -0.0005) tendencia = 'disminucion';

        // 8. AÑO ESTIMADO (mediana de la distribución BPT desde el último sismo)
        // Búsqueda binaria: F(t_med) = 0.5
        let lo = t, hi = t + seg.recurrenciaMu * 3;
        for (let iter = 0; iter < 40; iter++) {
          const mid = (lo + hi) / 2;
          bptCDF(mid, seg.recurrenciaMu, seg.aperiodicidad) < 0.5 ? lo = mid : hi = mid;
        }
        const añoMediana = Math.max(AÑO_ACTUAL, Math.round(seg.ultimoGranSismoAño + (lo + hi) / 2));

        return {
          id: seg.id,
          zona: seg.nombre,
          shortName: seg.shortName,
          color: seg.color,
          ultimoSismo: seg.ultimoGranSismoAño,
          magnitudUltimo: seg.magnitudUltimo,
          añosTranscurridos: t,
          magnitudEsperada: seg.magnitudCaracteristica,
          // Probabilidades
          probabilidad: Math.round(probFinal * 100),
          probBPT: Math.round(probBPT * 100),
          ratioDeficit: parseFloat(ratioDeficit.toFixed(2)),
          // Incertidumbre
          ic95: [ic.p5, ic.p95],
          ic50: [ic.p25, ic.p75],
          ic_p50: ic.p50,
          icLabel: `${ic.p5}%–${ic.p95}%`,
          // Metadatos sísmicos
          recurrenciaMu: seg.recurrenciaMu,
          aperiodicidad: seg.aperiodicidad,
          coupling: seg.coupling,
          bValue: b,
          bSigma,
          nSismos,
          tipoFalla,
          profMediana,
          añoEstimado: añoMediana,
          // Clasificación
          tendencia,
          esGap: seg.esGap,
          nivelAlerta: seg.nivelAlerta,
          enjambres,
          notas: seg.notas,
          // Para radar
          factores: {
            'Modelo BPT':        Math.round(probBPT * 100),
            'Déficit Momento':   Math.round(factorDeficit * 100),
            'Acoplamiento':      Math.round(seg.coupling * 100),
            'Madurez del Ciclo': Math.min(100, Math.round((t / seg.recurrenciaMu) * 100)),
            'Precursores':       Math.min(100, enjambres * 10),
          }
        };
      });

      setPredicciones(nuevasPredicciones);

      // ── Curvas de hazard para gráfico de evolución temporal ──────────────
      const curvas = [];
      for (let año = 1990; año <= AÑO_ACTUAL + 30; año++) {
        const punto = { año };
        SEGMENTOS_CHILE.forEach(seg => {
          const tAño = año - seg.ultimoGranSismoAño;
          if (tAño > 0) {
            punto[seg.shortName] = parseFloat(
              (bptProbabilidadCondicional(tAño, seg.recurrenciaMu, seg.aperiodicidad, VENTANA) * 100).toFixed(1)
            );
          }
        });
        curvas.push(punto);
      }
      setHazardCurvas(curvas);
      setUltimaAct(new Date());

    } catch (e) {
      console.error('Error en predicción sísmica:', e);
      setErrorFactores('Error al calcular predicciones. Revisa la consola para más detalles.');
    } finally {
      setCargandoFactores(false);
    }
  };

  useEffect(() => { generarPredicciones(); }, [datosHistoricos]); // eslint-disable-line

  const actualizarDatos = async () => {
    setActualizando(true);
    await onActualizar();
    setActualizando(false);
  };

  // ─── Sorting ─────────────────────────────────────────────────────────────
  const sorted = React.useMemo(() => {
    return [...predicciones].sort((a, b) => {
      const aVal = a[sortConfig.key], bVal = b[sortConfig.key];
      return sortConfig.direction === 'ascending' ? aVal - bVal : bVal - aVal;
    });
  }, [predicciones, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };
  const sortIcon = (k) => sortConfig.key === k ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : '';

  // ─── Datos para gráfico de barras principal ───────────────────────────────
  const datosBarras = sorted.map(p => ({
    zona: p.shortName,
    probabilidad: p.probabilidad,
    ic_inf: p.probabilidad - p.ic95[0],
    ic_sup: p.ic95[1] - p.probabilidad,
    fill: nivelColor(p.nivelAlerta)
  }));

  if (!cargando && datosHistoricos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <h2>No hay datos sísmicos disponibles.</h2>
        <p>Intenta actualizar o revisa la conexión con las fuentes de datos oficiales.</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="prediccion-sismica-container">

      {/* ── Encabezado ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Modelo Predictivo de Sismicidad — Chile {AÑO_ACTUAL}–{AÑO_ACTUAL + VENTANA}</h2>
          <p style={{ margin: '6px 0 0', color: '#555', fontSize: 14 }}>
            Modelo BPT + Déficit de Momento Sísmico + Actividad Precursora
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ background: '#1565c0', color: '#fff', padding: '3px 10px', borderRadius: 4, fontSize: 13 }}>
              Fuente: {fuenteDeDatos}
            </span>
            {sismosCinturon !== null && (
              <span style={{ background: '#37474f', color: '#fff', padding: '3px 10px', borderRadius: 4, fontSize: 13 }}>
                Cinturón de Fuego (7d): {sismosCinturon} sismos M≥6.5
              </span>
            )}
            <button
              onClick={() => setModoAvanzado(m => !m)}
              style={{ padding: '3px 10px', background: modoAvanzado ? '#4527a0' : '#9e9e9e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
            >
              {modoAvanzado ? '🔬 Modo Científico: ON' : '🔬 Modo Científico'}
            </button>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={actualizarDatos}
            disabled={actualizando}
            style={{ padding: '8px 18px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 4, cursor: actualizando ? 'not-allowed' : 'pointer', opacity: actualizando ? 0.55 : 1, transition: 'opacity 0.2s' }}
          >
            {actualizando ? 'Actualizando…' : 'Actualizar datos'}
          </button>
          {ultimaActualizacion && (
            <div style={{ fontSize: 12, marginTop: 5, color: '#666' }}>
              Actualizado: {ultimaActualizacion.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* ── Disclaimer científico — visible sin hacer scroll ── */}
      <DisclaimerCientifico />

      {/* ── Alertas de estado ── */}
      {cargandoFactores && (
        <div role="status" aria-live="polite" style={{ padding: 12, background: '#fff9c4', borderRadius: 6, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="loading-spinner" style={{ width: 18, height: 18, border: '3px solid #f3f3f3', borderTop: '3px solid #f57f17', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          Calculando modelo BPT y recuperando enjambres sísmicos…
        </div>
      )}
      {errorFactores && (
        <div role="alert" style={{ padding: 12, background: '#ffebee', borderRadius: 6, marginBottom: 16, color: '#c62828', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>⚠️ {errorFactores}</span>
          <button
            onClick={generarPredicciones}
            style={{ padding: '4px 12px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Banner de gaps críticos ── */}
      {predicciones.filter(p => p.esGap).length > 0 && (
        <div style={{ background: '#fff3e0', border: '1px solid #e65100', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
          <strong style={{ color: '#bf360c' }}>⚡ GAPS SÍSMICOS IDENTIFICADOS</strong>
          {predicciones.filter(p => p.esGap).map(p => (
            <div key={p.id} style={{ marginTop: 6, fontSize: 14, color: '#4e342e' }}>
              <span style={{ background: nivelColor(p.nivelAlerta), color: '#fff', padding: '1px 6px', borderRadius: 3, marginRight: 8, fontSize: 12 }}>
                {p.nivelAlerta}
              </span>
              <strong>{p.zona}</strong> — {p.notas}
            </div>
          ))}
        </div>
      )}

      {/* ── GRÁFICO 1: Probabilidades con IC ── */}
      <div className="chart-container">
        <h3>Probabilidad de Gran Sismo M≥8 por Segmento — Ventana {AÑO_ACTUAL}–{AÑO_ACTUAL + VENTANA}</h3>
        <p style={{ fontSize: 13, color: '#666', marginTop: -6 }}>
          Modelo BPT (Brownian Passage Time). Las barras de error indican IC 90% (Monte Carlo, 800 simulaciones).
        </p>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={datosBarras} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="zona" />
            <YAxis domain={[0, 100]} label={{ value: 'Probabilidad (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const pred = predicciones.find(p => p.shortName === payload[0].payload.zona);
                if (!pred) return null;
                return (
                  <div style={{ background: '#fff', border: '1px solid #ddd', padding: 12, borderRadius: 6, maxWidth: 300, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: nivelColor(pred.nivelAlerta) }}>
                      {nivelIcono(pred.nivelAlerta)} {pred.zona}
                    </p>
                    <hr style={{ margin: '6px 0' }} />
                    {/* Lenguaje accesible para público general */}
                    <p style={{ margin: '3px 0' }}>
                      📊 <strong>Probabilidad en 10 años:</strong> {pred.probabilidad}%
                      <br /><span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 20 }}>Podría estar entre {pred.icLabel} (90% de certeza)</span>
                    </p>
                    <p style={{ margin: '3px 0' }}>
                      💥 <strong>Terremoto esperado:</strong> magnitud M{pred.magnitudEsperada}
                    </p>
                    <p style={{ margin: '3px 0' }}>
                      📅 <strong>Año más probable:</strong> {pred.añoEstimado}
                    </p>
                    <p style={{ margin: '3px 0' }}>
                      ⚡ <strong>Energía acumulada:</strong> {Math.round(pred.ratioDeficit * 100)}% del ciclo completo
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid #eee', paddingTop: 6 }}>
                      Modelo BPT + Déficit de Momento Sísmico
                    </p>
                  </div>
                );
              }}
            />
            <Legend />
            <Bar dataKey="probabilidad" name="Probabilidad (%)" fill="#e53935">
              <ErrorBar dataKey="ic_sup" width={4} strokeWidth={2} stroke="#b71c1c" direction="y" />
              <LabelList dataKey="probabilidad" position="top" formatter={v => `${v}%`} style={{ fontSize: 12, fontWeight: 'bold' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── GRÁFICO 2: Evolución temporal del hazard BPT ── */}
      {modoAvanzado && hazardCurvas.length > 0 && (
        <div className="chart-container">
          <h3>Evolución Temporal de la Probabilidad BPT por Segmento (1990–{AÑO_ACTUAL + 30})</h3>
          <p style={{ fontSize: 13, color: '#666', marginTop: -6 }}>
            Curva de probabilidad condicional en ventana de {VENTANA} años. La línea vertical marca el año actual.
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={hazardCurvas} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="año" tickCount={9} />
              <YAxis domain={[0, 100]} label={{ value: 'Prob. 10a (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <ReferenceLine x={AÑO_ACTUAL} stroke="#333" strokeDasharray="4 2" label={{ value: 'Hoy', position: 'top', fill: '#333' }} />
              {SEGMENTOS_CHILE.map(seg => (
                <Line key={seg.id} type="monotone" dataKey={seg.shortName} stroke={seg.color} dot={false} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── TABLA PRINCIPAL ── */}
      <div className="table-container">
        <h3>Tabla de Predicciones Sísmicas — {AÑO_ACTUAL}–{AÑO_ACTUAL + VENTANA}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="prediction-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#1a237e', color: '#fff' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Segmento</th>
                <th style={{ padding: '10px 8px', cursor: 'pointer' }} onClick={() => requestSort('ultimoSismo')}>Último Gran Sismo{sortIcon('ultimoSismo')}</th>
                <th style={{ padding: '10px 8px', cursor: 'pointer' }} onClick={() => requestSort('añosTranscurridos')}>Años Transcurridos{sortIcon('añosTranscurridos')}</th>
                <th style={{ padding: '10px 8px' }}>Mag. Esperada</th>
                <th style={{ padding: '10px 8px', cursor: 'pointer' }} onClick={() => requestSort('probabilidad')}>
                  Probabilidad 10 años{sortIcon('probabilidad')}<InfoTip termino="BPT" />
                </th>
                <th style={{ padding: '10px 8px' }}>Rango probable<InfoTip termino="IC90" /></th>
                <th style={{ padding: '10px 8px', cursor: 'pointer' }} onClick={() => requestSort('ratioDeficit')}>
                  Energía acumulada{sortIcon('ratioDeficit')}<InfoTip termino="DEFICIT" />
                </th>
                {modoAvanzado && <th style={{ padding: '10px 8px', cursor: 'pointer' }} onClick={() => requestSort('bValue')}>Valor-b G-R{sortIcon('bValue')}<InfoTip termino="BVALUE" /></th>}
                {modoAvanzado && <th style={{ padding: '10px 8px' }}>Acoplamiento<InfoTip termino="COUPLING" /></th>}
                {modoAvanzado && <th style={{ padding: '10px 8px' }}>Tipo Falla</th>}
                {modoAvanzado && <th style={{ padding: '10px 8px' }}>Tendencia</th>}
                <th style={{ padding: '10px 8px', cursor: 'pointer' }} onClick={() => requestSort('añoEstimado')}>Año Probable{sortIcon('añoEstimado')}</th>
                <th style={{ padding: '10px 8px' }}>Nivel de Riesgo</th>
                <th style={{ padding: '10px 8px' }}>Enjambres (30d)</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((pred, i) => (
                <tr key={pred.id} style={{ background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '8px', fontWeight: pred.esGap ? 'bold' : 'normal' }}>
                    {pred.esGap && <span title="Gap sísmico" style={{ marginRight: 4 }}>⚠️</span>}
                    {pred.zona}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{pred.ultimoSismo} (M{pred.magnitudUltimo})</td>
                  <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: pred.añosTranscurridos > pred.recurrenciaMu ? '#c62828' : '#333' }}>
                    {pred.añosTranscurridos}a
                    {pred.añosTranscurridos > pred.recurrenciaMu && <span title="Supera recurrencia media" style={{ marginLeft: 4, color: '#c62828' }}>(!)</span>}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>M{pred.magnitudEsperada}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{
                      background: nivelColor(pred.nivelAlerta),
                      color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 'bold', fontSize: 13
                    }}>
                      {pred.probabilidad}%
                    </span>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>BPT: {pred.probBPT}%</div>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', fontSize: 13 }}>{pred.icLabel}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ background: '#e3f2fd', borderRadius: 4, overflow: 'hidden', height: 16, width: 80, display: 'inline-block', verticalAlign: 'middle' }}>
                      <div style={{ background: pred.ratioDeficit >= 1 ? '#c62828' : '#1976d2', width: `${Math.min(100, pred.ratioDeficit * 100)}%`, height: '100%' }} />
                    </div>
                    <span style={{ marginLeft: 6, fontSize: 12 }}>{Math.round(pred.ratioDeficit * 100)}%</span>
                  </td>
                  {modoAvanzado && <td style={{ padding: '8px', textAlign: 'center' }}>{pred.bValue} {pred.bSigma ? `±${pred.bSigma}` : ''}<div style={{ fontSize: 11, color: '#888' }}>n={pred.nSismos}</div></td>}
                  {modoAvanzado && <td style={{ padding: '8px', textAlign: 'center' }}>{Math.round(pred.coupling * 100)}%</td>}
                  {modoAvanzado && <td style={{ padding: '8px', fontSize: 12 }}>{pred.tipoFalla}</td>}
                  {modoAvanzado && <td style={{ padding: '8px', fontSize: 13 }}>{tendenciaLabel(pred.tendencia)}</td>}
                  <td style={{ padding: '8px', textAlign: 'center' }}>{pred.añoEstimado}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {/* Icono de forma + color: accesible para daltónicos (WCAG 1.4.1) */}
                    <span
                      aria-label={`Nivel ${pred.nivelAlerta}`}
                      style={{ background: nivelColor(pred.nivelAlerta), color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}
                    >
                      {nivelIcono(pred.nivelAlerta)} {pred.nivelAlerta}
                    </span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{pred.enjambres}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── GRÁFICO 3: Radar de factores (modo avanzado) ── */}
      {modoAvanzado && (
        <div className="chart-container">
          <h3>Análisis Multifactorial por Segmento de Alto Riesgo</h3>
          <p style={{ fontSize: 13, color: '#666', marginTop: -6 }}>
            Factores ponderados del modelo. BPT y Déficit de Momento son los indicadores científicamente más robustos.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'flex-start' }}>
            {predicciones
              .filter(p => p.probabilidad >= 30 || p.esGap)
              .map(pred => (
                <div key={pred.id} style={{ width: 340, background: '#f5f5f5', borderRadius: 8, padding: 16, border: `2px solid ${nivelColor(pred.nivelAlerta)}` }}>
                  <h4 style={{ margin: 0, color: nivelColor(pred.nivelAlerta) }}>{pred.zona}</h4>
                  <p style={{ margin: '4px 0', fontSize: 12, color: '#555' }}>{pred.notas}</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={Object.entries(pred.factores).map(([factor, value]) => ({ factor, value }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name="Factor" dataKey="value" stroke={nivelColor(pred.nivelAlerta)} fill={nivelColor(pred.nivelAlerta)} fillOpacity={0.45} />
                      <Tooltip formatter={(v) => `${v}%`} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    <div>📐 Recurrencia μ: <strong>{pred.recurrenciaMu} años</strong> | α: <strong>{pred.aperiodicidad}</strong></div>
                    <div>🔗 Acoplamiento: <strong>{Math.round(pred.coupling * 100)}%</strong> | Valor-b: <strong>{pred.bValue}</strong></div>
                    <div>⏱ Tendencia: <strong>{tendenciaLabel(pred.tendencia)}</strong></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Ficha del modelo ── */}
      <div style={{ marginTop: 40, padding: 20, background: '#f5f5f5', borderRadius: 8, border: '1px solid #e0e0e0' }}>
        <h3 style={{ borderBottom: '2px solid #1a237e', paddingBottom: 10 }}>Metodología del Modelo — v{DESCRIPCION_MODELO.version}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h4>Componentes del Modelo</h4>
            {DESCRIPCION_MODELO.componentes.map((c, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <strong>{c.nombre} ({c.peso}%)</strong>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#555' }}>{c.descripcion}</p>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h4>Limitaciones y Advertencias</h4>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {DESCRIPCION_MODELO.limitaciones.map((l, i) => (
                <li key={i} style={{ marginBottom: 8, fontSize: 13, color: '#555' }}>{l}</li>
              ))}
            </ul>
            <p style={{ marginTop: 16, fontStyle: 'italic', fontSize: 13 }}>
              Desarrollado por Daniel González Amat · Algoritmos: Modelo BPT (Matthews et al. 2002) + Déficit de Momento Sísmico
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrediccionSismica;
