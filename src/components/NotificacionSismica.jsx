import React, { useState } from 'react';

const NotificacionSismica = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [notificacionesActivas, setNotificacionesActivas] = useState(false);
  
  const toggleNotificaciones = () => {
    if (!notificacionesActivas) {
      // Solicitar permiso para notificaciones
      if (Notification.permission !== "granted") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            setNotificacionesActivas(true);
            mostrarMensajeExito();
          }
        });
      } else {
        setNotificacionesActivas(true);
        mostrarMensajeExito();
      }
    } else {
      setNotificacionesActivas(false);
    }
  };
  
  const mostrarMensajeExito = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };
  
  return (
    <div className="notificacion-container">
      <button 
        className={`btn-notificacion ${notificacionesActivas ? 'activo' : ''}`}
        onClick={toggleNotificaciones}
      >
        {notificacionesActivas ? 'Desactivar Notificaciones' : 'Activar Notificaciones'}
      </button>
      
      {showNotification && (
        <div className="mensaje-exito">
          Notificaciones activadas. Recibirás alertas de eventos sísmicos importantes.
        </div>
      )}
    </div>
  );
};

export default NotificacionSismica;