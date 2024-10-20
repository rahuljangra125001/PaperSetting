import { configureStore } from '@reduxjs/toolkit';
import AuthSlice from './AuthSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';

// Configuration for redux-persist
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['Auth'], // Only persist the Auth slice
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, AuthSlice);

// Configure the Redux store
export const store = configureStore({
    reducer: {
        Auth: persistedReducer, // Use the persisted reducer for Auth slice
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Disable serializable check if you're storing non-serializable data
        }),
    devTools: true, // Enable Redux DevTools in development mode
});

// Create a persistor
export const persistor = persistStore(store);
