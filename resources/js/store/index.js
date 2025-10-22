import { configureStore } from '@reduxjs/toolkit'
import ToasterSlice from './slices/ToasterSlice'

const store = configureStore({
    reducer: {
        toaster: ToasterSlice.reducer
    }
})

export default store
