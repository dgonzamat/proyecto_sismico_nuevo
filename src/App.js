import React from 'react';
import './App.css';
import PrediccionSismica from './components/PrediccionSismica';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Sistema de Predicción Sísmica</h1>
        <p>Basado en datos de centros sismológicos de Chile y Japón</p>
      </header>
      
      <nav className="main-nav">
        <ul>
          <li><a href="#prediccion">Predicción Sísmica</a></li>
          <li><a href="#correlacion">Correlación Solar</a></li>
          <li><a href="#mapa">Mapa de Riesgo</a></li>
          <li><a href="#acerca">Acerca del Proyecto</a></li>
        </ul>
      </nav>
      
      <main className="App-content">
        <PrediccionSismica />
      </main>
    </div>
  );
}

export default App;
