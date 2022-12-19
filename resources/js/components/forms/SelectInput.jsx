import {FormControl, InputLabel, Select, MenuItem} from "@mui/material"
import { useState } from "react"

const SelectInput = (props) => {

    const displayMenuItem = () => {
        return (
            props.items.map((item, index) => {
                return <MenuItem key={index} value={item[props.itemValue]}>{item[props.itemLabel]}</MenuItem>
            })
        )
    }

    return (
        <FormControl fullWidth size="small" sx={{mt:1}}>
            <InputLabel>{props.label}</InputLabel>
            <Select fullWidth defaultValue={props.value} value={props.value} label={props.label} onChange={props.handleChange}>
                <MenuItem value=''>&nbsp;</MenuItem>
                {displayMenuItem()}
            </Select>
        </FormControl>
    );
}

export default SelectInput
