import React, { StrictMode } from 'react';
// import ReactDOM from 'react-dom';
import App from './App';

import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<><App tab="home" /></>);

// ReactDOM.render(<App />, document.getElementById('root'));
