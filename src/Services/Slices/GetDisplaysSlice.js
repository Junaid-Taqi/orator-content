import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    displayList: [],
    stats: null,
    status: 'idle',
    error: null,
};

export const getAllDisplays = createAsyncThunk(
    'GetDisplays/getAllDisplays',
    async (payload) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(`${serverUrl}/o/displayManagementApplication/getAllDisplays`, payload, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
);

const GetDisplaysSlice = createSlice({
    name: 'GetDisplays',
    initialState,
    reducers: {
        resetGetDisplaysState: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllDisplays.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(getAllDisplays.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (action.payload.success) {
                    state.displayList = action.payload.displays;
                    state.stats = action.payload.stats;
                }
            })
            .addCase(getAllDisplays.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export const { resetGetDisplaysState } = GetDisplaysSlice.actions;
export default GetDisplaysSlice.reducer;
