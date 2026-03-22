/**
 * MODELOS SISMOLÓGICOS CIENTÍFICOS PARA CHILE
 * ============================================
 * Implementa los modelos del estado del arte para estimación de
 * probabilidad sísmica en zonas de subducción.
 *
 * Referencias:
 *  - Matthews et al. (2002) - Modelo BPT. BSSA 92(6).
 *  - Aki (1965) - Estimador MLE del valor-b. BSSA.
 *  - Hanks & Kanamori (1979) - Escala de momento sísmico.
 *  - Métois et al. (2016) - Acoplamiento sísmico en Chile. JGR.
 *  - Moreno et al. (2018) - Locking sísmico. Nature Geoscience.
 *  - Ruiz & Madariaga (2018) - Sismotectónica de Chile. Tectonophysics.
 *  - Nishenko (1991) - Probabilidades sísmicas circum-Pacífico. PAGEOPH.
 */

// ─────────────────────────────────────────────────────────────────────────────
// I. FUNCIONES ESTADÍSTICAS BASE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CDF de la distribución normal estándar.
 * Aproximación de Hart (1968) / Abramowitz & Stegun §26.2.17
 * Error máximo: 7.5e-8
 */
export const normalCDF = (x) => {
  const a = [0.31938153, -0.356563782, 1.781477937, -1.821255978, 1.330274429];
  const L = Math.abs(x);
  const K = 1.0 / (1.0 + 0.2316419 * L);
  let poly = 0;
  for (let i = 4; i >= 0; i--) poly = poly * K + a[i];
  poly *= K;
  const pdf = Math.exp(-0.5 * L * L) / Math.sqrt(2 * Math.PI);
  const p = 1 - pdf * poly;
  return x >= 0 ? p : 1 - p;
};

// ─────────────────────────────────────────────────────────────────────────────
// II. MODELO BPT (Brownian Passage Time / Gaussiana Inversa)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CDF del modelo BPT (= distribución Gaussiana Inversa).
 *
 * Es el modelo estándar UCERF / WGCEP para terremotos característicos.
 * Captura la física real de la acumulación de esfuerzos:
 *   - Cuando t << μ: hazard bajo (esfuerzo aún insuficiente)
 *   - Cuando t ≈ μ: hazard máximo (zona de peligro)
 *   - Cuando t >> μ: hazard decrece (sismos "tardíos" son raros)
 *
 * F(t; μ, α) = Φ[√(λ/t)·(t/μ−1)] + e^(2λ/μ)·Φ[−√(λ/t)·(t/μ+1)]
 * donde λ = μ/α² (parámetro de concentración)
 *
 * @param {number} t     - Tiempo desde el último gran sismo [años]
 * @param {number} mu    - Intervalo de recurrencia medio [años]
 * @param {number} alpha - Aperiodicidad / Coef. variación (0.3–0.7 para subducción)
 */
export const bptCDF = (t, mu, alpha) => {
  if (t <= 0 || mu <= 0 || alpha <= 0) return 0;
  const lambda = mu / (alpha * alpha);
  const sqrtLambdaT = Math.sqrt(lambda / t);
  const term1 = normalCDF(sqrtLambdaT * (t / mu - 1));
  // Limitar exponente para evitar Infinity en zonas de bajo riesgo
  const expArg = Math.min(700, 2 * lambda / mu);
  const term2 = Math.exp(expArg) * normalCDF(-sqrtLambdaT * (t / mu + 1));
  return Math.min(1, Math.max(0, term1 + term2));
};

/**
 * Probabilidad condicional BPT sobre ventana temporal Δt.
 *
 * P(T ≤ t+Δt | T > t) = [F(t+Δt) − F(t)] / [1 − F(t)]
 *
 * Es la respuesta correcta a: "¿Cuánta probabilidad hay de que ocurra
 * un gran sismo en los próximos Δt años, dado que no ha ocurrido desde t años?"
 *
 * @param {number} t      - Años desde último gran sismo
 * @param {number} mu     - Intervalo de recurrencia medio [años]
 * @param {number} alpha  - Aperiodicidad
 * @param {number} delta  - Ventana de predicción [años]
 */
export const bptProbabilidadCondicional = (t, mu, alpha, delta = 10) => {
  const F_t = bptCDF(t, mu, alpha);
  const F_t_delta = bptCDF(t + delta, mu, alpha);
  const supervivencia = 1 - F_t;
  if (supervivencia < 1e-6) return 0.99; // Ruptura prácticamente segura
  return Math.min(0.99, Math.max(0.01, (F_t_delta - F_t) / supervivencia));
};

/**
 * Tasa de hazard instantánea BPT: h(t) = f(t) / [1 − F(t)]
 * Permite ver si el riesgo está aumentando o disminuyendo.
 *
 * @returns {number} hazard rate [1/año]
 */
export const bptHazardRate = (t, mu, alpha) => {
  const dt = 0.5; // paso pequeño para derivada numérica
  return bptProbabilidadCondicional(t, mu, alpha, dt) / dt;
};

// ─────────────────────────────────────────────────────────────────────────────
// III. GUTENBERG-RICHTER Y MOMENTO SÍSMICO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estimador de Máxima Verosimilitud del valor-b de Gutenberg-Richter.
 * log₁₀(N≥M) = a − b·M
 *
 * b = log₁₀(e) / (M̄ − M_min)   [Aki 1965]
 * Corrección de Utsu (1966) para datos discretizados: +Δm/2
 *
 * Interpretación física:
 *   b ≈ 1.0: normal (subducción madura)
 *   b < 0.8: mayor proporción de sismos grandes → más peligroso
 *   b > 1.3: muchos sismos pequeños, menos energía concentrada
 *
 * @param {number[]} magnitudes - Lista de magnitudes del catálogo
 * @param {number}   mMin       - Magnitud de completitud del catálogo
 */
export const calcularBValue = (magnitudes, mMin = 7.0) => {
  const mags = magnitudes.filter(m => Number.isFinite(m) && m >= mMin);
  if (mags.length < 5) return { b: 1.0, sigma: null, n: mags.length };
  const mMean = mags.reduce((a, b) => a + b, 0) / mags.length;
  const b = Math.LOG10E / (mMean - mMin + 0.05); // +0.05 = corrección Utsu
  // Incertidumbre estándar del estimador MLE
  const sigma = b / Math.sqrt(mags.length);
  return { b: parseFloat(Math.max(0.5, Math.min(2.5, b)).toFixed(3)), sigma: parseFloat(sigma.toFixed(3)), n: mags.length };
};

/**
 * Momento sísmico escalar a partir de magnitud de momento Mw.
 * Mo = 10^(1.5·Mw + 9.1)  [Nm]   (Hanks & Kanamori 1979)
 */
export const calcularMomentoSismico = (Mw) => Math.pow(10, 1.5 * Mw + 9.1);

/**
 * Tasa de acumulación de momento sísmico (momento sísmico por año).
 *
 * Ṁ₀ = μ_r × A × V_conv × C
 * donde:
 *   μ_r   = Rigidez elástica de la corteza oceánica [Pa]
 *   A     = Área de la zona bloqueada [m²]
 *   V_conv = Velocidad de convergencia [m/año]
 *   C     = Coeficiente de acoplamiento sísmico (0–1)
 *
 * @param {number} areaFalla_km2 - Área de la zona bloqueada [km²]
 * @param {number} coupling      - Coeficiente de acoplamiento (0–1)
 */
export const calcularTasaMomento = (areaFalla_km2, coupling) => {
  const RIGIDEZ = 40e9;    // Pa (zona de subducción oceánica)
  const VCONV = 6.5e-2;    // m/año (convergencia Nazca–Sudamérica en Chile)
  const A = areaFalla_km2 * 1e6; // m²
  return RIGIDEZ * A * VCONV * coupling; // Nm/año
};

/**
 * Ratio de déficit de momento sísmico acumulado.
 *
 * Compara el momento sísmico acumulado desde el último gran sismo
 * con el momento sísmico del próximo evento característico.
 *
 * Ratio = 0.0 → recién rupturado (sin déficit)
 * Ratio = 1.0 → déficit completo → energía suficiente para el próximo gran sismo
 * Ratio > 1.0 → "sobrecargado" (posible mega-evento)
 *
 * @returns {number} ratio 0–1.5
 */
export const calcularRatioDeficitMomento = (añosDesdeUltimo, Mw_esperado, coupling, areaFalla_km2) => {
  const tasaMomento = calcularTasaMomento(areaFalla_km2, coupling);
  const deficitAcumulado = tasaMomento * añosDesdeUltimo;
  const momentoEsperado = calcularMomentoSismico(Mw_esperado);
  return Math.min(1.5, deficitAcumulado / momentoEsperado);
};

// ─────────────────────────────────────────────────────────────────────────────
// IV. INCERTIDUMBRE: MONTE CARLO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera intervalos de confianza propagando incertidumbre en μ y α
 * mediante simulación de Monte Carlo (muestreo log-normal).
 *
 * Fuentes de incertidumbre consideradas:
 *   - Incertidumbre en μ: ±25% (catálogo histórico incompleto antes de 1900)
 *   - Incertidumbre en α: ±35% (pocos ciclos observados por zona)
 *
 * @returns {{ p5, p25, p50, p75, p95 }} percentiles de la distribución
 */
export const monteCarloBPT = (t, mu, alpha, delta = 10, nSim = 800) => {
  const probs = new Float64Array(nSim);
  for (let i = 0; i < nSim; i++) {
    // Muestreo log-normal para parámetros (siempre positivos)
    const u1 = Math.random(), u2 = Math.random();
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); // Box-Muller
    const z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    const muSim = mu * Math.exp(z1 * 0.22);             // σ_ln ≈ 0.22 → ±25%
    const alphaSim = Math.max(0.1, alpha * Math.exp(z2 * 0.30)); // σ_ln ≈ 0.30 → ±35%
    probs[i] = bptProbabilidadCondicional(t, muSim, alphaSim, delta);
  }
  probs.sort();
  const pct = (q) => Math.round(probs[Math.floor(q * nSim)] * 100);
  return { p5: pct(0.05), p25: pct(0.25), p50: pct(0.50), p75: pct(0.75), p95: pct(0.95) };
};

// ─────────────────────────────────────────────────────────────────────────────
// V. SEGMENTOS SÍSMICOS DE CHILE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parámetros sismotectónicos por segmento de ruptura en la subducción de Chile.
 *
 * Fuentes principales de parámetros:
 *   μ (recurrencia): Nishenko (1991), Comte & Pardo (1991), análisis histórico propio
 *   α (aperiodicidad): Ellsworth et al. (1999), estimado de catálogos globales
 *   coupling: Métois et al. (2016), Moreno et al. (2018)
 *   areaFalla: Ruiz & Madariaga (2018), USGS SLAB2
 */
export const SEGMENTOS_CHILE = [
  {
    id: 'norte_grande',
    nombre: 'Norte Grande (Arica–Iquique)',
    shortName: 'Arica',
    minLat: -21.5, maxLat: -18.0,
    minLon: -72.5, maxLon: -68.0,
    // Último gran sismo de interfaz completa: 09/05/1877 Mw8.8 (Terremoto de Iquique).
    // Fuente pre-instrumental: Lomnitz (1970), Nishenko (1991), confirmado por registros
    // de tsunami transoceánico (NGDC/WDS). El M8.2 Iquique 2014 fue ruptura PARCIAL
    // del extremo sur; la parte norte (Arica) permanece bloqueada.
    ultimoGranSismoAño: 1877,
    magnitudUltimo: 8.8,     // Mw8.8 según Lomnitz (1970); algunas fuentes indican 8.7–9.0
    recurrenciaMu: 148,      // años (Nishenko 1991; Compte & Pardo 1994)
    aperiodicidad: 0.50,     // α moderado: subducción madura
    coupling: 0.87,          // Métois et al. 2016
    areaFalla: 22000,        // km²
    magnitudCaracteristica: 8.5,
    esGap: true,
    nivelAlerta: 'CRÍTICO',
    color: '#d32f2f',
    notas: 'Gap sísmico de Arica. Último gran sismo: Mw8.8 Iquique 1877 (fuente pre-instrumental: Lomnitz 1970). El M8.2 de 2014 fue ruptura parcial del extremo sur. Zona norte lleva ~149 años sin ruptura completa.'
  },
  {
    id: 'atacama',
    nombre: 'Gap de Atacama (Norte Chico)',
    shortName: 'Atacama',
    minLat: -30.0, maxLat: -21.5,
    // maxLon: -69.0 alineado con zona Coquimbo y Norte Grande para coherencia.
    // Eventos de la cuenca de antepaís (lon < -69°) son intraplaca, no interfaz.
    minLon: -72.5, maxLon: -69.0,
    // Último gran sismo de interfaz: 10 noviembre 1922 Mw8.5
    // ES EL GAP SÍSMICO MÁS PELIGROSO DE CHILE
    ultimoGranSismoAño: 1922,
    magnitudUltimo: 8.5,
    recurrenciaMu: 95,       // años (Nishenko 1991; análisis histórico)
    aperiodicidad: 0.40,     // α bajo: ciclo muy regular (escasa variabilidad histórica)
    coupling: 0.90,          // muy alto (Moreno et al. 2018)
    areaFalla: 35000,        // km²
    magnitudCaracteristica: 8.5,
    esGap: true,
    nivelAlerta: 'MUY ALTO',
    color: '#e64a19',
    notas: 'GAP SÍSMICO CRÍTICO: ~104 años sin ruptura mayor (2026−1922). Probabilidad de evento M8.0–8.5 en próximas décadas muy elevada. Mayor acumulación de déficit de momento sísmico de Chile.'
  },
  {
    id: 'coquimbo',
    nombre: 'Coquimbo–Illapel',
    shortName: 'Illapel',
    minLat: -33.0, maxLat: -30.0,
    minLon: -72.5, maxLon: -69.0,
    // Terremoto Illapel Mw8.4, 16 septiembre 2015
    ultimoGranSismoAño: 2015,
    magnitudUltimo: 8.4,
    recurrenciaMu: 120,      // años
    aperiodicidad: 0.55,
    coupling: 0.80,          // Métois et al. 2016
    areaFalla: 18000,        // km²
    magnitudCaracteristica: 8.0,
    esGap: false,
    nivelAlerta: 'BAJO',
    color: '#388e3c',
    notas: 'Rupturo con M8.4 Illapel (2015). Actualmente en periodo de recarga post-sísmica. Bajo riesgo en próximas dos décadas.'
  },
  {
    id: 'maule',
    nombre: 'Maule–Concepción',
    shortName: 'Maule',
    // maxLat: -38.001 (exclusivo) para que el paralelo -38.0°S quede
    // inequívocamente asignado al segmento Valdivia (minLat: -44, maxLat: -38.0).
    minLat: -38.001, maxLat: -33.0,
    minLon: -74.0,   maxLon: -70.0,
    // Gran terremoto del Maule Mw8.8, 27 febrero 2010
    ultimoGranSismoAño: 2010,
    magnitudUltimo: 8.8,
    recurrenciaMu: 95,       // años (Vigny et al. 2011; Moreno 2018)
    aperiodicidad: 0.45,
    coupling: 0.78,          // Moreno et al. 2018 (post-ruptura)
    areaFalla: 40000,        // km² (mayor: ruptura de Mw8.8)
    magnitudCaracteristica: 8.5,
    esGap: false,
    nivelAlerta: 'MUY BAJO',
    color: '#1976d2',
    notas: 'Gran ruptura Maule Mw8.8 (2010). Profundo periodo de recarga post-sísmica. Riesgo mínimo para las próximas 3–5 décadas.'
  },
  {
    id: 'valdivia',
    nombre: 'Araucanía–Valdivia–Chiloé',
    shortName: 'Valdivia',
    minLat: -44.0, maxLat: -38.0,
    minLon: -76.0, maxLon: -71.0,
    // Terremoto de Valdivia Mw9.5, 22 mayo 1960 — el mayor de la historia
    ultimoGranSismoAño: 1960,
    magnitudUltimo: 9.5,
    recurrenciaMu: 280,      // años (Cisternas et al. 2005 — análisis de turbidititas)
    aperiodicidad: 0.65,     // α más alto: ciclos muy largos, mayor dispersión
    coupling: 0.65,          // reducido por relajación post-1960 (Moreno 2011)
    areaFalla: 55000,        // km² (ruptura histórica más grande)
    magnitudCaracteristica: 9.0,
    esGap: false,
    nivelAlerta: 'BAJO',
    color: '#7b1fa2',
    notas: 'Ruptura M9.5 Valdivia 1960 (la mayor de la historia instrumental). Período de recurrencia de ~200–400 años. Aún en fase de relajación post-sísmica.'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// VI. CLASIFICACIÓN DE PROFUNDIDAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clasifica un sismo según su mecanismo de generación por profundidad.
 * Relevante para Chile: subducción de la placa de Nazca bajo Sudamérica.
 */
export const clasificarProfundidad = (profundidad_km) => {
  if (!profundidad_km) return { tipo: 'Interfaz subducción', riesgo: 'Alto' };
  if (profundidad_km < 60) return { tipo: 'Interfaz subducción (superficial)', riesgo: 'Muy Alto' };
  if (profundidad_km < 150) return { tipo: 'Intraplaca / Losa oceánica (intermedio)', riesgo: 'Alto' };
  if (profundidad_km < 300) return { tipo: 'Losa oceánica (profundo)', riesgo: 'Moderado' };
  return { tipo: 'Manto superior (muy profundo)', riesgo: 'Bajo' };
};

// ─────────────────────────────────────────────────────────────────────────────
// VII. DESCRIPCIÓN PÚBLICA DEL MODELO
// ─────────────────────────────────────────────────────────────────────────────

export const DESCRIPCION_MODELO = {
  nombre: 'Modelo BPT + Déficit de Momento Sísmico',
  version: '2.0.0',
  componentes: [
    { nombre: 'BPT (Brownian Passage Time)', peso: 70, descripcion: 'Probabilidad condicional sobre ventana de 10 años usando la distribución Gaussiana Inversa. Captura la física de la acumulación y liberación de esfuerzos.' },
    { nombre: 'Déficit de Momento Sísmico', peso: 20, descripcion: 'Ratio entre momento acumulado (tasa Ṁ₀ × tiempo) y momento esperado para el próximo evento. Basado en velocidad de convergencia, acoplamiento y área de falla.' },
    { nombre: 'Actividad Precursora (Enjambres)', peso: 10, descripcion: 'Conteo de enjambres sísmicos M3–M5 en el último mes. Señal de precarga o transferencia de esfuerzos.' },
  ],
  limitaciones: [
    'Los terremotos son fenómenos complejos: ningún modelo puede predecir hora y lugar exactos.',
    'Los intervalos de recurrencia están basados en catálogos históricos incompletos antes de 1900.',
    'La correlación entre actividad solar y sismicidad NO está científicamente establecida y no se usa en este modelo.',
    'Las probabilidades son estimaciones con alta incertidumbre epistémica.',
  ]
};
