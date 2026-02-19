import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    contentPoolList: [],
    total: 0,
    status: 'idle',
    error: null,
};

export const getAllContentPool = createAsyncThunk(
    'GetContentPool/getAllContentPool',
    async (payload, { rejectWithValue }) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(`${serverUrl}/o/contentPoolApplication/getAllContentPool`, payload, config);
            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to fetch content pools' }
            );
        }
    }
);

const GetContentPoolSlice = createSlice({
    name: 'GetContentPool',
    initialState,
    reducers: {
        resetGetContentPoolState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllContentPool.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(getAllContentPool.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.contentPoolList = action.payload?.data || [];
                state.total = action.payload?.total || 0;
                state.error = null;
            })
            .addCase(getAllContentPool.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetGetContentPoolState } = GetContentPoolSlice.actions;
export default GetContentPoolSlice.reducer;
