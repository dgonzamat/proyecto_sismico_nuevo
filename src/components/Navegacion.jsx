import React, { useState } from 'react';

const Navegacion = ({ onSectionChange }) => {
  const [seccionActiva, setSeccionActiva] = useState('prediccion');
  
  const cambiarSeccion = (seccion) => {
    setSeccionActiva(seccion);
    onSectionChange(seccion);
  };
  
  return (
    <div className="navegacion-container" style={{ marginBottom: '20px' }}>
      <div className="nav-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button 
          onClick={() => cambiarSeccion('prediccion')} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: seccionActiva === 'prediccion' ? '#3f51b5' : '#e0e0e0',
            color: seccionActiva === 'prediccion' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: seccionActiva === 'prediccion' ? 'bold' : 'normal'
          }}
        >
          Predicción Sísmica
        </button>
        <button 
          onClick={() => cambiarSeccion('correlacion')} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: seccionActiva === 'correlacion' ? '#3f51b5' : '#e0e0e0',
            color: seccionActiva === 'correlacion' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: seccionActiva === 'correlacion' ? 'bold' : 'normal'
          }}
        >
          Correlación Solar
        </button>
        <button 
          onClick={() => cambiarSeccion('mapa')} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: seccionActiva === 'mapa' ? '#3f51b5' : '#e0e0e0',
            color: seccionActiva === 'mapa' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: seccionActiva === 'mapa' ? 'bold' : 'normal'
          }}
        >
          Mapa de Riesgo
        </button>
      </div>
    </div>
  );
};

export default Navegacion;