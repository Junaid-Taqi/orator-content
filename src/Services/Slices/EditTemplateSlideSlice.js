import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    status: 'idle',
    error: null,
    updatedSlide: null,
};

export const editTemplateSlide = createAsyncThunk(
    'EditTemplateSlide/editTemplateSlide',
    async (payload, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('groupId', String(payload.groupId));
            formData.append('userId', String(payload.userId));
            formData.append('slideId', String(payload.slideId));
            formData.append('title', payload.title || '');
            formData.append('subtitle', payload.subtitle || '');
            formData.append('articleUrl', payload.articleUrl || '');
            formData.append('webDescription', payload.webDescription || '');
            formData.append('totemDescription', payload.totemDescription || '');
            formData.append('linkUrl', payload.linkUrl || '');
            formData.append('configJSON', payload.configJSON || '');
            formData.append('priority', String(payload.priority));
            formData.append('durationSeconds', String(payload.durationSeconds));
            formData.append('startDate', payload.startDate || '');
            formData.append('archiveDate', payload.archiveDate || '');
            formData.append('publish', String(payload.publish !== false));
            formData.append('eventEnabled', String(Boolean(payload.eventEnabled)));
            formData.append('eventMode', String(payload.eventEnabled ? Number(payload.eventMode || 1) : 0));

            if (payload.eventEnabled) {
                const mode = Number(payload.eventMode || 1);
                if (mode === 1) {
                    formData.append('eventStartDate', payload.eventStartDate || '');
                } else if (mode === 2) {
                    formData.append('eventStartDate', payload.eventStartDate || '');
                    formData.append('eventEndDate', payload.eventEndDate || '');
                } else if (mode === 3) {
                    formData.append('eventDates', JSON.stringify(payload.eventDates || []));
                }
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(
                `${serverUrl}/o/slidesApplication/editTemplateSlide`,
                formData,
                config
            );

            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to update template slide' }
            );
        }
    }
);

const EditTemplateSlideSlice = createSlice({
    name: 'EditTemplateSlide',
    initialState,
    reducers: {
        resetEditTemplateSlideState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(editTemplateSlide.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(editTemplateSlide.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.updatedSlide = action.payload;
                state.error = null;
            })
            .addCase(editTemplateSlide.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetEditTemplateSlideState } = EditTemplateSlideSlice.actions;
export default EditTemplateSlideSlice.reducer;
