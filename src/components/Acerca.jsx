import React from 'react';

const Acerca = () => (
  <section id="acerca" className="section-container">
    <h3 style={{ borderBottom: '2px solid #3f51b5', paddingBottom: '10px' }}>Acerca del Proyecto</h3>
    
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      <div style={{ flex: '1', minWidth: '300px' }}>
        <h4>Sistema Predictivo de Sismicidad para Chile</h4>
        <p>Este proyecto implementa un modelo avanzado de predicción sísmica basado en análisis multifactorial de datos históricos de fuentes como el Servicio Geológico de Estados Unidos (USGS) y el Centro Sismológico Nacional de Chile. Desarrollado como herramienta de apoyo para la gestión de riesgos y planificación de respuestas ante desastres naturales.</p>
        
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

export default Acerca; 