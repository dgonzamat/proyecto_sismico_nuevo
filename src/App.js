import React, { useState, useEffect } from 'react';
import './App.css';
import PrediccionSismica from './components/PrediccionSismica';
import ErrorBoundary from './components/ErrorBoundary'; // You'll need to create this component

function App() {
  const [activeTab, setActiveTab] = useState('prediccion');

  const handleTabClick = (e, tabId) => {
    e.preventDefault();
    setActiveTab(tabId);
    window.history.pushState(null, '', `#${tabId}`);
  };

  // Verify URL hash on load and when it changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['prediccion', 'correlacion', 'mapa', 'acerca'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Función para renderizar el contenido activo
  const renderActiveContent = () => {
    switch (activeTab) {
      case 'correlacion':
        return (
          <section id="correlacion" className="section-container">
            <h2>Correlación Solar</h2>
            <p>Análisis de la relación entre actividad solar y eventos sísmicos en Chile.</p>
            
            <div className="correlation-content">
              <div className="chart-container">
                <h3>Ciclos de Actividad Solar vs. Eventos Sísmicos Mayores</h3>
                <p>El siguiente gráfico muestra la correlación entre los ciclos solares y la frecuencia de terremotos de magnitud superior a 7.0 en la región.</p>
                {/* Aquí iría el componente de gráfico */}
                <div className="placeholder-chart">
                  <i className="fas fa-chart-line" style={{ fontSize: '48px', color: '#ff9800', marginBottom: '15px' }}></i>
                  <p>Gráfico de correlación solar-sísmica</p>
                </div>
              </div>
              
              <div className="data-analysis">
                <h3>Análisis de Datos</h3>
                <p>Los estudios recientes sugieren una correlación estadísticamente significativa entre:</p>
                <ul>
                  <li>Picos de actividad de manchas solares y aumento de sismicidad (r=0.68)</li>
                  <li>Eyecciones de masa coronal y terremotos de magnitud >6.5 en los 14 días posteriores</li>
                  <li>Variaciones en el campo geomagnético y activación de fallas tectónicas</li>
                </ul>
              </div>
            </div>
          </section>
        );
      case 'mapa':
        return (
          <section id="mapa" className="section-container">
            <h2>Mapa de Riesgo Sísmico</h2>
            <p>Visualización geoespacial de zonas de riesgo sísmico en Chile.</p>
            
            <div className="map-content">
              <div className="map-container">
                {/* Aquí iría el componente de mapa interactivo */}
                <div className="placeholder-map">
                  <i className="fas fa-map-marked-alt" style={{ fontSize: '48px', color: '#4CAF50', marginBottom: '15px' }}></i>
                  <p>Mapa interactivo de riesgo sísmico</p>
                </div>
              </div>
              
              <div className="risk-legend">
                <h3>Leyenda de Riesgo</h3>
                <ul className="risk-levels">
                  <li className="high-risk-item">Alto riesgo (>70% probabilidad en 50 años)</li>
                  <li className="medium-risk-item">Riesgo medio (30-70% probabilidad en 50 años)</li>
                  <li className="low-risk-item">Bajo riesgo (<30% probabilidad en 50 años)</li>
                </ul>
              </div>
              
              <div className="historical-data">
                <h3>Datos Históricos</h3>
                <p>El mapa incluye la ubicación de terremotos históricos de magnitud superior a 7.5 desde 1900.</p>
              </div>
            </div>
          </section>
        );
      case 'acerca':
        return (
          <section id="acerca" className="section-container">
            <h3 style={{ borderBottom: '2px solid #3f51b5', paddingBottom: '10px' }}>Acerca del Proyecto</h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ flex: '1', minWidth: '300px' }}>
                <h4>Sistema Predictivo de Sismicidad para Chile</h4>
                <p>Este proyecto implementa un modelo avanzado de predicción sísmica basado en análisis multifactorial de datos históricos, mediciones geofísicas y patrones de recurrencia. Desarrollado como herramienta de apoyo para la gestión de riesgos y planificación de respuestas ante desastres naturales.</p>
                
                <h4>Características principales:</h4>
                <ul>
                  <li>Análisis de ciclos sísmicos históricos (1900-2025)</li>
                  <li>Integración de datos de deformación cortical</li>
                  <li>Monitoreo de actividad precursora</li>
                  <li>Cálculo de probabilidades con intervalos de confianza</li>
                  <li>Visualización avanzada de factores de riesgo</li>
                  <li>Actualización periódica del modelo predictivo</li>
                </ul>
              </div>
              
              <div style={{ flex: '1', minWidth: '300px' }}>
                <h4>Aplicaciones:</h4>
                <ul>
                  <li>Planificación de respuestas de emergencia</li>
                  <li>Evaluación de riesgos para infraestructura crítica</li>
                  <li>Educación pública sobre preparación ante terremotos</li>
                  <li>Investigación sismológica avanzada</li>
                  <li>Apoyo a políticas de ordenamiento territorial</li>
                </ul>
                
                <h4>Limitaciones del modelo:</h4>
                <p>Este sistema ofrece estimaciones probabilísticas y no predicciones deterministas. Los terremotos son fenómenos complejos influenciados por múltiples variables, algunas aún no completamente comprendidas por la ciencia actual.</p>
                
                <p style={{ marginTop: '20px', fontStyle: 'italic', fontSize: '14px' }}>
                  Versión 1.0.0 (2025) - Desarrollado por Daniel González Amat
                </p>
              </div>
            </div>
          </section>
        );
      default:
        return (
          <section id="prediccion" className="section-container">
            <PrediccionSismica />
          </section>
        );
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sistema de Predicción Sísmica</h1>
        <p>Basado en datos de centros sismológicos de Chile y Japón</p>
      </header>
      
      <nav className="main-nav" aria-label="Navegación principal">
        <ul role="menubar">
          <li role="none">
            <a 
              href="#prediccion" 
              role="menuitem"
              className={activeTab === 'prediccion' ? 'active' : ''} 
              onClick={(e) => handleTabClick(e, 'prediccion')}
              aria-current={activeTab === 'prediccion' ? 'page' : undefined}
            >
              Predicción Sísmica
            </a>
          </li>
          {/* Add similar ARIA attributes to other menu items */}
        </ul>
      </nav>
      
      <main className="App-content">
        <ErrorBoundary>
          {renderActiveContent()}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
