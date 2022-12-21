import { createSlice } from '@reduxjs/toolkit'

const types = {
    success: 'success',
    error: 'error'
}

const initialState = {
    open: false,
    message: '',
    type: types.success,
    duration: 3000
}


const ToasterSlice = createSlice({
    name: 'toaster',
    initialState: initialState,
    reducers: {
        success: (state, action) => state = {
            ...state,
            open: true,
            type: types.success,
            ...action.payload
        },
        error: (state, action) => state = {
            ...state,
            open: true,
            type: types.error,
            ...action.payload
        },
        hide: (state, action) => state = {
            ...state,
            open: false
        }
    }
})

export const actions = ToasterSlice.actions

export default ToasterSlice
