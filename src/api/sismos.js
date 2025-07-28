import Papa from 'papaparse';

export const calcularEnergiaSismica = (magnitud) => {
  return Math.pow(10, 4.4 + 1.5 * magnitud);
};

export const cargarDatosUSGS = async () => {
  try {
    const fechaInicio = "1900-01-01";
    const magnitudMinima = 7.0;
    // Ajuste de límites para cubrir todo Chile continental y zonas costeras
    const minLatitude = -56.0;
    const maxLatitude = -17.0;
    const minLongitude = -76.0;
    const maxLongitude = -66.0;

    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${fechaInicio}&minmagnitude=${magnitudMinima}&minlatitude=${minLatitude}&maxlatitude=${maxLatitude}&minlongitude=${minLongitude}&maxlongitude=${maxLongitude}&orderby=time`;

    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error(`Error en la solicitud a la API de USGS: ${respuesta.statusText}`);
    }
    const datos = await respuesta.json();

    const datosMapeados = datos.features.map(sismo => ({
      id_unico: `USGS_${sismo.id}`,
      año: new Date(sismo.properties.time).getFullYear(),
      magnitud: sismo.properties.mag,
      ubicacion: sismo.properties.place,
      profundidad: sismo.geometry.coordinates[2],
      energia: calcularEnergiaSismica(sismo.properties.mag)
    }));
    
    return datosMapeados;

  } catch (error) {
    console.error("Error al obtener datos reales de USGS:", error);
    return null;
  }
};

export const cargarDatosChile = async () => {
  try {
    const url = 'https://chilealerta.com/api/query/?user=demo&select=ultimos_sismos_chile&limit=50';
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error(`Error en la solicitud a la API de Chile Alerta: ${respuesta.statusText}`);
    }
    const datos = await respuesta.json();

    if (!datos.ultimos_sismos_Chile) {
      throw new Error("Formato de respuesta inesperado de Chile Alerta API");
    }

    return datos.ultimos_sismos_Chile.map(sismo => ({
      id_unico: `CSN_${sismo.id}`,
      año: new Date(sismo.utc_time.replace(' ', 'T') + 'Z').getFullYear(),
      magnitud: parseFloat(sismo.magnitude),
      ubicacion: sismo.reference,
      profundidad: parseFloat(sismo.depth),
      energia: calcularEnergiaSismica(parseFloat(sismo.magnitude))
    }));

  } catch (error) {
    console.error("Error al obtener datos de Chile Alerta:", error);
    return null;
  }
}; 

// Obtener el número de manchas solares actual desde SILSO (Sunspot Index and Long-term Solar Observations)
export const obtenerSunspotNumberActual = async () => {
  try {
    const url = 'https://www.sidc.be/SILSO/DATA/EISN/EISN_current.txt';
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('No se pudo obtener el número de manchas solares');
    const text = await resp.text();
    // El archivo tiene varias líneas, la última suele ser la más reciente
    const lineas = text.trim().split('\n');
    const ultimaLinea = lineas[lineas.length - 1];
    // Formato: YYYY MM DD EISN ...
    const partes = ultimaLinea.trim().split(/\s+/);
    const sunspotNumber = parseFloat(partes[3]);
    return sunspotNumber;
  } catch (e) {
    console.error('Error obteniendo sunspot number:', e);
    return null;
  }
};

// Contar terremotos recientes (última semana) M>6.5 en el Cinturón de Fuego del Pacífico
export const contarSismosCinturonFuego = async () => {
  try {
    // Bounding box aproximado del Cinturón de Fuego del Pacífico
    const ahora = new Date();
    const hace7Dias = new Date(ahora.getTime() - (7 * 24 * 60 * 60 * 1000));
    const fechaInicio = hace7Dias.toISOString().split('T')[0];
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${fechaInicio}&minmagnitude=6.5&minlatitude=-60&maxlatitude=60&minlongitude=-150&maxlongitude=150&orderby=time`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('No se pudo obtener sismos del Cinturón de Fuego');
    const data = await resp.json();
    // Filtrar por regiones del Pacífico (aproximado)
    const pacifico = data.features.filter(f => {
      const lon = f.geometry.coordinates[0];
      // Longitudes típicas del Pacífico (excluye Atlántico y Eurasia)
      return (lon < -60 || lon > 110);
    });
    return pacifico.length;
  } catch (e) {
    console.error('Error obteniendo sismos Cinturón de Fuego:', e);
    return null;
  }
}; 

// Contar enjambres sísmicos (3 o más sismos M3.0-M5.0 en la última semana) en una zona
export const contarEnjambresZona = async (minLat, maxLat, minLon, maxLon) => {
  try {
    const ahora = new Date();
    const hace30Dias = new Date(ahora.getTime() - (30 * 24 * 60 * 60 * 1000));
    const fechaInicio = hace30Dias.toISOString().split('T')[0];
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${fechaInicio}&minmagnitude=3&maxmagnitude=5&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLon}&maxlongitude=${maxLon}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('No se pudo obtener sismos para enjambres');
    const data = await resp.json();
    // Agrupar por día
    const dias = {};
    data.features.forEach(f => {
      const d = new Date(f.properties.time).toISOString().split('T')[0];
      if (!dias[d]) dias[d] = 0;
      dias[d]++;
    });
    // Un enjambre es 3 o más sismos en un mismo día
    const enjambres = Object.values(dias).filter(count => count >= 3).length;
    return enjambres;
  } catch (e) {
    console.error('Error obteniendo enjambres sísmicos:', e);
    return 0;
  }
}; 

// Cargar y procesar el CSV de Wikipedia (terremotos_chile_wiki.csv)
export const cargarDatosWikipediaCSV = async () => {
  return new Promise((resolve, reject) => {
    Papa.parse('/terremotos_chile_wiki.csv', {
      download: true,
      header: true,
      complete: (result) => {
        // Filtrar y mapear los datos relevantes
        const datos = result.data
          .filter(row => {
            // Magnitud: usar MW si está, si no MS
            const mag = parseFloat(row["MW"] || row["MS"]);
            const año = parseInt((row["Fecha y hora[n 4]\u200b"] || '').split(' ')[2]);
            return mag >= 7.0 && año >= 1900;
          })
          .map(row => {
            const mag = parseFloat(row["MW"] || row["MS"]);
            const año = parseInt((row["Fecha y hora[n 4]\u200b"] || '').split(' ')[2]);
            return {
              año,
              magnitud: mag,
              ubicacion: row["Zonas afectadas"] || row["Nombre"],
              referencia: row["Nombre"],
              epicentro: row["Epicentro"],
              tsunami: row["Tsunami"],
              muertos: row["Muertos[n 5]\u200b"]
            };
          });
        resolve(datos);
      },
      error: (err) => reject(err)
    });
  });
}; 