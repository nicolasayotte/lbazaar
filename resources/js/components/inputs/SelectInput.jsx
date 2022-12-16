

import {FormControl, InputLabel, Select, MenuItem} from "@mui/material"
import { useState } from "react"

const SelectInput = (props) => {
    return (
        <FormControl fullWidth size="small" sx={{mt:1}}>
            <InputLabel>{props.label}</InputLabel>
            <Select fullWidth defaultValue="" label={props.label} onChange={props.handleChange}>
                <MenuItem value=''>&nbsp;</MenuItem>
                {
                    props.items.map((item, index) => {
                        return (
                            <MenuItem key={index} value={item[props.itemValue]}>{item[props.itemLabel]}</MenuItem>
                        );
                })}
            </Select>
        </FormControl>
    );
}

export default SelectInput
