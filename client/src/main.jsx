import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Provider } from 'react-redux';
import { store,persistor } from './redux/Store.js';
import { PersistGate } from 'redux-persist/integration/react';
import "./index.css";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <App />
            </PersistGate>
        </Provider>
    </React.StrictMode>
);
