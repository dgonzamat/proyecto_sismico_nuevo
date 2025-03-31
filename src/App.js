import React, { useState, useEffect, createContext } from 'react';
import './App.css';
import PrediccionSismica from './components/PrediccionSismica';
import CorrelacionSolarSismica from './components/CorrelacionSolarSismica';
import MapaRiesgo from './components/MapaRiesgo';

// Crear contexto para el tema
export const ThemeContext = createContext();

function App() {
  const [activeTab, setActiveTab] = useState('prediccion');
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Verificar preferencia de tema guardada
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(JSON.parse(savedTheme));
    }
  }, []);
  
  // Guardar preferencia de tema
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Simular tiempo de carga para mejorar la experiencia
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  const [tabHistory, setTabHistory] = useState(['prediccion']);
  
  // Modificar el manejador de clics para guardar historial de navegación
  const handleTabClick = (e, tabId) => {
    e.preventDefault();
    if (activeTab !== tabId) {
      setTabHistory(prev => [...prev, tabId]);
      setActiveTab(tabId);
      window.history.pushState(null, '', `#${tabId}`);
    }
  };
  
  // Función para volver atrás en la navegación
  const handleGoBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop(); // Eliminar el tab actual
      const previousTab = newHistory[newHistory.length - 1];
      setActiveTab(previousTab);
      setTabHistory(newHistory);
      window.history.pushState(null, '', `#${previousTab}`);
    }
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
            <CorrelacionSolarSismica />
          </section>
        );
      case 'mapa':
        return (
          <section id="mapa" className="section-container">
            <MapaRiesgo />
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
                
                <h4>Fuentes de Datos</h4>
                <p>El sistema utiliza datos sísmicos históricos y en tiempo real de:</p>
                <ul>
                  <li><strong>Centro Sismológico Nacional de Chile (CSN):</strong> Registros históricos desde 1900 y datos en tiempo real de la red de monitoreo nacional.</li>
                  <li><strong>Agencia Meteorológica de Japón (JMA):</strong> Datos de la red de monitoreo sísmico japonesa y modelos predictivos desarrollados tras el Gran Terremoto de Tohoku de 2011.</li>
                  <li><strong>Servicio Geológico de Estados Unidos (USGS):</strong> Datos complementarios para validación de modelos.</li>
                </ul>
                
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
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando datos sísmicos...</p>
          </div>
        ) : (
          <>
            <header className="App-header">
              <h1>Sistema de Predicción Sísmica</h1>
              <p>Basado en datos de centros sismológicos de Chile y Japón</p>
              <div className="data-source-info">
                <p>Los datos utilizados en este sistema provienen de fuentes oficiales del Centro Sismológico Nacional de Chile y la Agencia Meteorológica de Japón (JMA)</p>
              </div>
              <button 
                className="theme-toggle" 
                onClick={toggleDarkMode}
                aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </header>
            
            <nav className="main-nav">
              <ul>
                <li><a href="#prediccion" className={activeTab === 'prediccion' ? 'active' : ''} onClick={(e) => handleTabClick(e, 'prediccion')}>Predicción Sísmica</a></li>
                <li><a href="#correlacion" className={activeTab === 'correlacion' ? 'active' : ''} onClick={(e) => handleTabClick(e, 'correlacion')}>Correlación Solar</a></li>
                <li><a href="#mapa" className={activeTab === 'mapa' ? 'active' : ''} onClick={(e) => handleTabClick(e, 'mapa')}>Mapa de Riesgo</a></li>
                <li><a href="#acerca" className={activeTab === 'acerca' ? 'active' : ''} onClick={(e) => handleTabClick(e, 'acerca')}>Acerca del Proyecto</a></li>
                {tabHistory.length > 1 && (
                  <li className="nav-back"><button onClick={handleGoBack} className="back-button">Volver</button></li>
                )}
              </ul>
            </nav>
            
            <main className="App-content">
              <div className="breadcrumb">
                {tabHistory.map((tab, index) => (
                  <span key={index}>
                    {index > 0 && <span className="breadcrumb-separator"> &gt; </span>}
                    <span 
                      className={index === tabHistory.length - 1 ? 'breadcrumb-current' : 'breadcrumb-link'} 
                      onClick={index !== tabHistory.length - 1 ? () => {
                        setTabHistory(prev => prev.slice(0, index + 1));
                        setActiveTab(tab);
                        window.history.pushState(null, '', `#${tab}`);
                      } : undefined}
                    >
                      {tab === 'prediccion' && 'Predicción Sísmica'}
                      {tab === 'correlacion' && 'Correlación Solar'}
                      {tab === 'mapa' && 'Mapa de Riesgo'}
                      {tab === 'acerca' && 'Acerca del Proyecto'}
                    </span>
                  </span>
                ))}
              </div>
              
              <div className="tab-content-container">
                {renderActiveContent()}
              </div>
            </main>
            
              <footer className="App-footer">
                <p>© 2025 Sistema de Predicción Sísmica | <a href="#acerca">Acerca del proyecto</a></p>
                <p className="data-attribution">Datos proporcionados por el Centro Sismológico Nacional de Chile y la Agencia Meteorológica de Japón</p>
              </footer>
            </>
          )}
        </div>
      </ThemeContext.Provider>
  );
}

export default App;
