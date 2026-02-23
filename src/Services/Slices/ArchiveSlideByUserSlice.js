import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    status: 'idle',
    error: null,
    archivedSlide: null,
};

export const archiveSlideByUser = createAsyncThunk(
    'ArchiveSlideByUser/archiveSlideByUser',
    async (payload, { rejectWithValue }) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(
                `${serverUrl}/o/slidesApplication/archiveSlideByUser`,
                payload,
                config
            );

            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to archive slide' }
            );
        }
    }
);

const ArchiveSlideByUserSlice = createSlice({
    name: 'ArchiveSlideByUser',
    initialState,
    reducers: {
        resetArchiveSlideByUserState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(archiveSlideByUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(archiveSlideByUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.archivedSlide = action.payload;
                state.error = null;
            })
            .addCase(archiveSlideByUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetArchiveSlideByUserState } = ArchiveSlideByUserSlice.actions;
export default ArchiveSlideByUserSlice.reducer;
