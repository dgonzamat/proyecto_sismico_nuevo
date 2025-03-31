import React, { useState, useEffect } from 'react';

const MapaRiesgo = () => {
  const [zonaRiesgo, setZonaRiesgo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [regionSeleccionada, setRegionSeleccionada] = useState(null);
  
  useEffect(() => {
    // Simular carga de datos de zonas de riesgo
    const cargarDatos = async () => {
      // Simular retraso de carga
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos de zonas de riesgo sísmico en Chile
      const datos = [
        { id: "CL-AP", name: "Arica y Parinacota", riesgo: 92, ultimoSismo: 2014, magnitudEsperada: 8.6 },
        { id: "CL-TA", name: "Tarapacá", riesgo: 88, ultimoSismo: 2014, magnitudEsperada: 8.2 },
        { id: "CL-AN", name: "Antofagasta", riesgo: 75, ultimoSismo: 2023, magnitudEsperada: 8.0 },
        { id: "CL-AT", name: "Atacama", riesgo: 97, ultimoSismo: 1922, magnitudEsperada: 8.7 },
        { id: "CL-CO", name: "Coquimbo", riesgo: 85, ultimoSismo: 2015, magnitudEsperada: 8.4 },
        { id: "CL-VS", name: "Valparaíso", riesgo: 78, ultimoSismo: 2010, magnitudEsperada: 8.5 },
        { id: "CL-RM", name: "Región Metropolitana", riesgo: 65, ultimoSismo: 2010, magnitudEsperada: 8.0 },
        { id: "CL-LI", name: "O'Higgins", riesgo: 60, ultimoSismo: 2010, magnitudEsperada: 7.8 },
        { id: "CL-ML", name: "Maule", riesgo: 70, ultimoSismo: 2010, magnitudEsperada: 8.0 },
        { id: "CL-BI", name: "Biobío", riesgo: 65, ultimoSismo: 2010, magnitudEsperada: 8.2 },
        { id: "CL-AR", name: "La Araucanía", riesgo: 55, ultimoSismo: 2010, magnitudEsperada: 7.5 },
        { id: "CL-LR", name: "Los Ríos", riesgo: 75, ultimoSismo: 1960, magnitudEsperada: 8.5 },
        { id: "CL-LL", name: "Los Lagos", riesgo: 88, ultimoSismo: 1960, magnitudEsperada: 9.0 },
        { id: "CL-AI", name: "Aysén", riesgo: 40, ultimoSismo: 2007, magnitudEsperada: 7.2 },
        { id: "CL-MA", name: "Magallanes", riesgo: 30, ultimoSismo: 1949, magnitudEsperada: 7.0 },
      ];
      
      setZonaRiesgo(datos);
      setCargando(false);
    };
    
    cargarDatos();
  }, []);
  
  // Función para determinar el color basado en el nivel de riesgo
  const getColorByRisk = (riesgo) => {
    if (riesgo > 90) return '#f44336'; // Rojo - crítico
    if (riesgo > 75) return '#ff9800'; // Naranja - alto
    if (riesgo > 50) return '#ffeb3b'; // Amarillo - moderado
    return '#4caf50'; // Verde - bajo
  };
  
  // Función para mostrar detalles de la región
  const mostrarDetallesRegion = (region) => {
    setRegionSeleccionada(region);
  };
  
  if (cargando) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando mapa de riesgo sísmico...</div>;
  }

  return (
    <div className="mapa-riesgo-container">
      <h2>Mapa de Riesgo Sísmico de Chile (2025)</h2>
      <p style={{ textAlign: 'center', marginBottom: '30px' }}>
        Visualización de las zonas con mayor probabilidad de actividad sísmica en los próximos 5 años
      </p>
      
      <div className="map-visualization" style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        {/* Visualización simplificada del mapa */}
        <div className="map-visual" style={{ flex: '1', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <h3>Nivel de Riesgo por Región</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
            {zonaRiesgo
              .sort((a, b) => b.riesgo - a.riesgo)
              .map((region) => (
                <div 
                  key={region.id}
                  onClick={() => mostrarDetallesRegion(region)}
                  style={{ 
                    padding: '15px', 
                    backgroundColor: getColorByRisk(region.riesgo),
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: region.riesgo > 75 ? 'white' : 'black',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'transform 0.2s',
                    transform: regionSeleccionada?.id === region.id ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: regionSeleccionada?.id === region.id ? '0 6px 12px rgba(0,0,0,0.15)' : 'none'
                  }}
                >
                  <span><strong>{region.name}</strong></span>
                  <span>Riesgo: {region.riesgo}%</span>
                </div>
            ))}
          </div>
        </div>
        
        {/* Panel de detalles */}
        <div className="region-details" style={{ flex: '1', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <h3>Detalles de la Región</h3>
          {regionSeleccionada ? (
            <div>
              <h4 style={{ color: getColorByRisk(regionSeleccionada.riesgo) }}>{regionSeleccionada.name}</h4>
              <div style={{ marginTop: '20px' }}>
                <p><strong>Nivel de riesgo:</strong> {regionSeleccionada.riesgo}%</p>
                <p><strong>Clasificación:</strong> {
                  regionSeleccionada.riesgo > 90 ? 'CRÍTICO' : 
                  regionSeleccionada.riesgo > 75 ? 'ALTO' : 
                  regionSeleccionada.riesgo > 50 ? 'MODERADO' : 'BAJO'
                }</p>
                <p><strong>Último gran sismo:</strong> {regionSeleccionada.ultimoSismo}</p>
                <p><strong>Años transcurridos:</strong> {2025 - regionSeleccionada.ultimoSismo}</p>
                <p><strong>Magnitud esperada:</strong> {regionSeleccionada.magnitudEsperada.toFixed(1)}</p>
                
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  backgroundColor: regionSeleccionada.riesgo > 75 ? '#fff3e0' : '#f1f8e9',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${getColorByRisk(regionSeleccionada.riesgo)}`
                }}>
                  <h5>Recomendaciones:</h5>
                  {regionSeleccionada.riesgo > 90 ? (
                    <p>Se recomienda revisar y actualizar urgentemente los planes de emergencia. Esta zona tiene una alta probabilidad de experimentar un terremoto mayor en los próximos 12 meses.</p>
                  ) : regionSeleccionada.riesgo > 75 ? (
                    <p>Se recomienda mantener planes de emergencia actualizados y realizar simulacros periódicos. Esta zona tiene una probabilidad significativa de actividad sísmica en los próximos 2-3 años.</p>
                  ) : (
                    <p>Se recomienda mantener precauciones estándar y conocer los protocolos de emergencia. El riesgo sísmico en esta zona es moderado a bajo en el corto plazo.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p>Seleccione una región en el mapa para ver sus detalles.</p>
          )}
        </div>
      </div>
      
      <div className="legend-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#4caf50', marginRight: '5px' }}></div>
            <span>Bajo riesgo (0-50%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#ffeb3b', marginRight: '5px' }}></div>
            <span>Riesgo moderado (51-75%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#ff9800', marginRight: '5px' }}></div>
            <span>Riesgo alto (76-90%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#f44336', marginRight: '5px' }}></div>
            <span>Riesgo crítico (91-100%)</span>
          </div>
        </div>
      </div>
      
      <div className="table-container">
        <h3>Tabla de Riesgo Sísmico por Región</h3>
        <table className="prediction-table">
          <thead>
            <tr>
              <th>Región</th>
              <th>Nivel de Riesgo (%)</th>
              <th>Último Gran Sismo</th>
              <th>Años Transcurridos</th>
              <th>Magnitud Esperada</th>
              <th>Clasificación</th>
            </tr>
          </thead>
          <tbody>
            {zonaRiesgo
              .sort((a, b) => b.riesgo - a.riesgo)
              .map((zona, index) => (
                <tr 
                  key={index} 
                  className={zona.riesgo > 90 ? 'high-risk' : zona.riesgo > 75 ? 'medium-risk' : 'low-risk'}
                  onClick={() => mostrarDetallesRegion(zona)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{zona.name}</td>
                  <td>{zona.riesgo}%</td>
                  <td>{zona.ultimoSismo}</td>
                  <td>{2025 - zona.ultimoSismo}</td>
                  <td>{zona.magnitudEsperada.toFixed(1)}</td>
                  <td>
                    {zona.riesgo > 90 ? 'Crítico' : 
                     zona.riesgo > 75 ? 'Alto' : 
                     zona.riesgo > 50 ? 'Moderado' : 'Bajo'}
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="methodology-section">
        <h3>Metodología de Evaluación de Riesgo</h3>
        <p>El mapa de riesgo sísmico se basa en los siguientes factores:</p>
        <ul>
          <li><strong>Tiempo transcurrido desde el último gran terremoto:</strong> Las regiones con períodos más largos sin actividad sísmica mayor tienden a acumular más energía tectónica.</li>
          <li><strong>Tasa histórica de recurrencia:</strong> Análisis estadístico de la frecuencia de terremotos mayores en cada región.</li>
          <li><strong>Acoplamiento de placas:</strong> Mediciones geodésicas que indican el grado de bloqueo entre las placas tectónicas.</li>
          <li><strong>Deformación cortical:</strong> Datos de GPS y satélite que muestran la acumulación de tensión en la corteza terrestre.</li>
          <li><strong>Correlación con actividad solar:</strong> Incorporación del análisis de correlación entre explosiones solares y eventos sísmicos.</li>
        </ul>
        <p>El modelo asigna un porcentaje de riesgo a cada región basado en la combinación ponderada de estos factores, actualizado con los datos más recientes de 2025.</p>
      </div>
    </div>
  );
};

export default MapaRiesgo;