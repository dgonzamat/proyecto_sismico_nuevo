import React from 'react';
import ReactDOM from 'react-dom/client';
// CSS imports should be at the top with other imports
import './styles/base.css';
import './styles/navigation.css';
import './styles/sections.css';
import './styles/prediction.css';
import './styles/correlation.css';
import './styles/map.css';
import './styles/darkmode.css';
import './styles/components.css';
import './styles/responsive.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
