import { createSlice } from '@reduxjs/toolkit'

const ToasterSlice = createSlice({
    name: 'toaster',
    initialState: {
        open: false,
        message: '',
        type: 'success'
    },
    reducers: {
        toggle: (state, action) => {
            state.open = action.payload.open
            state.type = action.payload.type ?? state.type
            state.message = action.payload.message ?? state.message
        }
    }
})

export const actions = ToasterSlice.actions

export default ToasterSlice
