
export const displaySelectOptions = (options, optionValueColumn = 'id', optionLabelColumn = 'name') => options.map((option, key) => (
    <option key={key} value={option[optionValueColumn]}>{option[optionLabelColumn]}</option>
))
