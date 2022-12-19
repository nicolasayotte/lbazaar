

import {FormControl, InputLabel, TextField} from "@mui/material"
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState } from "react"

const YearMonthPicker = (props) => {
    const [value, setValue] = useState(new Date());
    const currentYear = new Date().getFullYear()

    const handleDateChange = (date) => {

        setValue(new Date(date))
        let dateSelected = new Date(date)

        props.handleChange(dateSelected.getFullYear(), dateSelected.getMonth());
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <FormControl fullWidth size="small" sx={{mt:1}}>
                <InputLabel>{props.label}</InputLabel>
                <DatePicker
                    views={['year', 'month']}
                    openTo="year"
                    label={props.label}
                    minDate={dayjs(props.minDate)}
                    maxDate={dayjs(props.maxDate)}
                    value={value}
                    onChange={(date) => {
                        handleDateChange(date)
                    }}
                    renderInput={(params) => <TextField {...params} helperText={null} />}
                />
            </FormControl>
        </LocalizationProvider>
    );
}

export default YearMonthPicker
