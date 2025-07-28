import React, { useState, useEffect, useCallback } from 'react';
import './styles/base.css';
import './App.css'; 
import PrediccionSismica from './components/PrediccionSismica';
import CorrelacionSolarSismica from './components/CorrelacionSolarSismica';
import MapaRiesgo from './components/MapaRiesgo';
import Acerca from './components/Acerca';
import HistorialSismico from './components/HistorialSismico';
import MapaSismosRecientes from './components/MapaSismosRecientes';
import { calcularEnergiaSismica } from './api/sismos';
import { terremotosChile } from './api/datosTerremotosChile';


function App() {
  const [tab, setTab] = useState('historial');
  const [datosHistoricos, setDatosHistoricos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [fuenteDeDatos, setFuenteDeDatos] = useState('Simulados');
  const [tabHistory, setTabHistory] = useState(['historial']);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setFuenteDeDatos('Cargando...');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Usar terremotosChile como fuente principal
      if (terremotosChile && terremotosChile.length > 0) {
        setFuenteDeDatos('Histórico (interno)');
        // Mapear al formato esperado y asignar zona
        const datosMapeados = terremotosChile.map(t => {
          // Asignar zona por latitud
          let zona = '';
          if (t.lat >= -20.5 && t.lat <= -18.0) zona = 'Arica-Iquique';
          else if (t.lat > -24.0 && t.lat < -20.5) zona = 'Iquique-Antofagasta';
          else if (t.lat > -26.5 && t.lat <= -24.0) zona = 'Antofagasta-Taltal';
          else if (t.lat > -29.5 && t.lat <= -26.5) zona = 'Taltal-Huasco';
          else if (t.lat > -30.5 && t.lat <= -29.5) zona = 'Huasco-La Serena';
          else if (t.lat > -32.5 && t.lat <= -30.5) zona = 'La Serena-Illapel';
          else if (t.lat > -41.5 && t.lat <= -39.5) zona = 'Valdivia-Chiloé';
          else zona = '';
          return {
            año: parseInt(t.fecha.split('/')[2]),
            magnitud: t.mw || t.ms,
            ubicacion: zona,
            zona,
            referencia: t.efecto,
            profundidad: t.profundidad,
            fecha: t.fecha,
            hora: t.hora
          };
        });
        setDatosHistoricos(datosMapeados);
      } else {
        setFuenteDeDatos('Sin datos reales disponibles');
        setDatosHistoricos([]);
      }
      setCargando(false);
    } catch (error) {
      console.error('Error al cargar datos históricos:', error);
      setFuenteDeDatos('Sin datos reales disponibles');
      setDatosHistoricos([]);
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleTabClick = (e, tabName) => {
    e.preventDefault();
    if (tab !== tabName) {
      setTab(tabName);
      setTabHistory(prev => [...prev, tabName]);
      window.history.pushState(null, '', `#${tabName}`);
    }
  };

  const handleGoBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop();
      const previousTab = newHistory[newHistory.length - 1];
      setTab(previousTab);
      setTabHistory(newHistory);
      window.history.pushState(null, '', `#${previousTab}`);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['prediccion', 'historial', 'correlacion', 'mapa', 'acerca', 'sismos-recientes'].includes(hash)) {
        setTab(hash);
      }
    };

    window.addEventListener('popstate', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);


  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <h1 className="title">Sistema de Predicción Sísmica</h1>
          <p className="subtitle">Basado en datos de centros sismológicos de Chile</p>
          <nav className="main-nav">
            <ul>
              <li><a href="#prediccion" className={tab === 'prediccion' ? 'active' : ''} onClick={(e) => handleTabClick(e, 'prediccion')}>Predicción Sísmica</a></li>
              <li><a href="#historial" className={tab === 'historial' ? 'active' : ''} onClick={(e) => handleTabClick(e, 'historial')}>Historial Sísmico</a></li>
              <li><a href="#sismos-recientes" className={tab === 'sismos-recientes' ? 'active' : ''} onClick={(e) => handleTabClick(e, 'sismos-recientes')}>Sismos Recientes</a></li>
              <li><a href="#correlacion" className={tab === 'correlacion' ? 'active' : ''} onClick={(e) => handleTabClick(e, 'correlacion')}>Correlación Solar</a></li>
              <li><a href="#mapa" className={tab === 'mapa' ? 'active' : ''} onClick={(e) => handleTabClick(e, 'mapa')}>Mapa de Riesgo</a></li>
              <li><a href="#acerca" className={tab === 'acerca' ? 'active' : ''} onClick={(e) => handleTabClick(e, 'acerca')}>Acerca del Proyecto</a></li>
              {tabHistory.length > 1 && (
                <li className="nav-back"><button onClick={handleGoBack} className="back-button">Volver</button></li>
              )}
            </ul>
          </nav>
        </div>
      </header>
      
      <main>
        <div className="content">
          {tab === 'prediccion' && <PrediccionSismica datosHistoricos={datosHistoricos} fuenteDeDatos={fuenteDeDatos} cargando={cargando} onActualizar={cargarDatos} />}
          {tab === 'historial' && <HistorialSismico datos={datosHistoricos} cargando={cargando} />}
          {tab === 'sismos-recientes' && <MapaSismosRecientes />}
          {tab === 'correlacion' && <CorrelacionSolarSismica />}
          {tab === 'mapa' && <MapaRiesgo datosHistoricos={datosHistoricos} />}
          {tab === 'acerca' && <Acerca />}
        </div>
      </main>
    </div>
  );
}

export default App;
