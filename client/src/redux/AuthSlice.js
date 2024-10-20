import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { get } from '../services/ApiEndpoint';

// Asynchronous thunk to check user status
export const updateUser = createAsyncThunk('auth/updateUser', async () => {
    try {
        const response = await get('/api/auth/CheckUser');
        return response.data; // Return user data
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to check user status.'); // Improved error handling
    }
});

// Initial state
const initialState = {
    loading: false,
    error: null,
    user: null,
};

// Create AuthSlice
const AuthSlice = createSlice({
    name: 'Auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload; // Set user data
        },
        Logout: (state) => {
            state.user = null; // Clear user data
            state.loading = false; // Reset loading state
            state.error = null; // Reset error state
        },
        resetError: (state) => {
            state.error = null; // Reset error message
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateUser.pending, (state) => {
                state.loading = true; // Set loading to true when request starts
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false; // Reset loading state
                state.user = action.payload; // Update user state
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false; // Reset loading state
                state.error = action.error.message; // Store error message
                state.user = null; // Reset user state on error
            });
    },
});

// Export actions and reducer
export const { setUser, Logout, resetError } = AuthSlice.actions;
export default AuthSlice.reducer;
