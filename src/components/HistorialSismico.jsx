import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HistorialSismico = ({ datos, cargando }) => {
  if (cargando) {
    return <div>Cargando historial de sismos...</div>;
  }

  if (!datos || datos.length === 0) {
    return <div>No se encontraron terremotos mayores a 7.0 Richter en el período seleccionado.</div>;
  }

  return (
    <div className="historial-sismico-container">
      <h2>Historial de Terremotos Mayores en Chile</h2>
      <p>Esta tabla y gráfico muestran los sismos de magnitud 7.0 o superior registrados desde 2001, obtenidos de fuentes como USGS y el Centro Sismológico Nacional de Chile.</p>
      
      {/* Historical Data Chart */}
      <div className="chart-container">
        <h3>Gráfico de Sismicidad Histórica</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={datos}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="año" />
            <YAxis domain={[7, 9.5]} label={{ value: 'Magnitud (Richter)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'magnitud') {
                  return [`${value} Richter`, 'Magnitud'];
                }
                if (name === 'energia') {
                  return [typeof value === 'number' && !isNaN(value) ? `${value.toExponential(2)} J` : '-', 'Energía liberada'];
                }
                return [value, name];
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip" style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
                      <p><strong>Año: {data.año}</strong></p>
                      <p>Magnitud: {data.magnitud} Richter</p>
                      <p>Ubicación: {data.ubicacion}</p>
                      <p>Profundidad: {data.profundidad} km</p>
                      <p>Energía: {typeof data.energia === 'number' && !isNaN(data.energia) ? data.energia.toExponential(2) + ' J' : '-'}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="magnitud" stroke="#8884d8" name="Magnitud" strokeWidth={2} dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <table className="prediction-table">
        <thead>
          <tr>
            <th>Año</th>
            <th>Ubicación</th>
            <th>Magnitud (Richter)</th>
            <th>Profundidad (km)</th>
          </tr>
        </thead>
        <tbody>
          {datos.slice().sort((a, b) => b.año - a.año || b.magnitud - a.magnitud).map((sismo, index) => (
            <tr key={sismo.id_unico || index}>
              <td>{sismo.año}</td>
              <td>{sismo.ubicacion}</td>
              <td>{typeof sismo.magnitud === 'number' && !isNaN(sismo.magnitud) ? sismo.magnitud.toFixed(1) : '-'}</td>
              <td>{typeof sismo.profundidad === 'number' && !isNaN(sismo.profundidad) ? sismo.profundidad.toFixed(2) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistorialSismico; 