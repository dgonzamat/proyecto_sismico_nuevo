import React, { useState, useEffect, useCallback } from 'react';
import './styles/base.css';
import './App.css'; 
import PrediccionSismica from './components/PrediccionSismica';
import CorrelacionSolarSismica from './components/CorrelacionSolarSismica';
import MapaRiesgo from './components/MapaRiesgo';
import Acerca from './components/Acerca';
import HistorialSismico from './components/HistorialSismico';
import MapaSismosRecientes from './components/MapaSismosRecientes';
import { terremotosChile } from './api/datosTerremotosChile';
import { SEGMENTOS_CHILE } from './api/modeloSismologico';


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
        // Asignar zona usando los mismos segmentos del modelo predictivo (SEGMENTOS_CHILE)
        // para garantizar consistencia entre HistorialSismico y PrediccionSismica.
        const datosMapeados = terremotosChile.map(t => {
          const segmento = SEGMENTOS_CHILE.find(
            s => t.lat >= s.minLat && t.lat <= s.maxLat &&
                 t.lon >= s.minLon && t.lon <= s.maxLon
          );
          const zona = segmento ? segmento.nombre : 'Otras zonas de Chile';
          return {
            año: parseInt(t.fecha.split('/')[2]),
            magnitud: t.mw || t.ms,
            ubicacion: zona,
            zona,
            segmentoId: segmento ? segmento.id : null,
            referencia: t.efecto,
            profundidad: t.profundidad,
            lat: t.lat,
            lon: t.lon,
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
          {/* Navegación principal con ARIA completo (WCAG 2.1 AA) */}
          <nav className="main-nav" aria-label="Navegación principal">
            <ul role="tablist">
              {[
                { id: 'prediccion',      label: 'Predicción Sísmica' },
                { id: 'mapa',            label: 'Mapa de Riesgo'     },
                { id: 'historial',       label: 'Historial Sísmico'  },
                { id: 'sismos-recientes',label: 'Sismos Recientes'   },
                { id: 'correlacion',     label: 'Correlación Solar ⚠' },
                { id: 'acerca',          label: 'Acerca'             },
              ].map(({ id, label }) => (
                <li key={id} role="presentation">
                  <a
                    href={`#${id}`}
                    role="tab"
                    aria-selected={tab === id}
                    aria-current={tab === id ? 'page' : undefined}
                    className={tab === id ? 'active' : ''}
                    onClick={(e) => handleTabClick(e, id)}
                  >
                    {label}
                  </a>
                </li>
              ))}
              {tabHistory.length > 1 && (
                <li role="presentation" className="nav-back">
                  <button onClick={handleGoBack} className="back-button" aria-label="Volver a la sección anterior">
                    ← Volver
                  </button>
                </li>
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
