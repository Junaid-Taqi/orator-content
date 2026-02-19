import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    status: 'idle',
    error: null,
    updatedContentPool: null,
};

export const updateContentPool = createAsyncThunk(
    'UpdateContentPool/updateContentPool',
    async (payload, { rejectWithValue }) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(`${serverUrl}/o/contentPoolApplication/updateContentPool`, payload, config);
            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to update content pool' }
            );
        }
    }
);

const UpdateContentPoolSlice = createSlice({
    name: 'UpdateContentPool',
    initialState,
    reducers: {
        resetUpdateContentPoolState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateContentPool.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateContentPool.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.updatedContentPool = action.payload;
                state.error = null;
            })
            .addCase(updateContentPool.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetUpdateContentPoolState } = UpdateContentPoolSlice.actions;
export default UpdateContentPoolSlice.reducer;
