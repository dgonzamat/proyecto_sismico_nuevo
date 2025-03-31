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
                </ul>
              </nav>
              
              <main className="App-content">
                {renderActiveContent()}
              </main>
              
              <footer className="App-footer">
                <p>© 2025 Sistema de Predicción Sísmica | <a href="#acerca">Acerca del proyecto</a></p>
              </footer>
            </>
          )}
        </div>
      </ThemeContext.Provider>
  );
}

export default App;
