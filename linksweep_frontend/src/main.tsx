import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';  // or './global.css' depending on the project

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);