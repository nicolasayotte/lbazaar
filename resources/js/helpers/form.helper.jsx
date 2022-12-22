import { MenuItem } from "@mui/material"

export const displaySelectOptions = (options, optionValueColumn = 'id', optionLabelColumn = 'name') => options.map((option, key) => (
    <MenuItem key={key} value={option[optionValueColumn]}>{option[optionLabelColumn]}</MenuItem>
))
