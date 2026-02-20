import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    slides: [],
    counters: {
        totalSlides: 0,
        active: 0,
        scheduled: 0,
        archived: 0,
    },
    status: 'idle',
    error: null,
};

export const getAllSlides = createAsyncThunk(
    'GetAllSlides/getAllSlides',
    async (payload, { rejectWithValue }) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(
                `${serverUrl}/o/slidesApplication/getAllSlides`,
                payload,
                config
            );

            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to fetch slides' }
            );
        }
    }
);

const GetAllSlidesSlice = createSlice({
    name: 'GetAllSlides',
    initialState,
    reducers: {
        resetGetAllSlidesState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllSlides.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(getAllSlides.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.slides = action.payload?.data || [];
                state.counters = action.payload?.counters || initialState.counters;
                state.error = null;
            })
            .addCase(getAllSlides.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetGetAllSlidesState } = GetAllSlidesSlice.actions;
export default GetAllSlidesSlice.reducer;
