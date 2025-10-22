/**
 * Display options for select inputs
 *
 * @param {object[]} options The array of objects that will be displayed
 * @param {string} [optionValueColumn='id'] The property of the object that will be set as the value for the option `id`
 * @param {string} [optionLabelColumn='name'] The property of the object that will be set as the text for the option
 */
export const displaySelectOptions = (options, optionValueColumn = 'id', optionLabelColumn = 'name') => options.map((option, key) => (
    <option key={key} value={option[optionValueColumn]}>{option[optionLabelColumn]}</option>
))

/**
 * onChange method for handling useForm() state
 *
 * @param {*} e The onChange event
 * @param {func} setData The setData method from inertiajs useForm()
 */
export const handleOnChange = (e, setData) => {
    setData(e.target.name, e.target.value)
}

/**
 * onChange method for handling useForm() state
 *
 * @param {*} e The onChange event
 * @param {func} setData The setData method from inertiajs useForm()
 */
export const handleOnFileChange = (e, property, setData) => {
    setData(property, e.target.files[0])
}

/**
 * onChange method for handling useForm() state
 *
 * @param {string} value The value pass from editor
 * @param {func} setData The setData method from inertiajs useForm()
 * @param {string} value The properties of the value
 */
export const handleEditorOnChange = (value, setData, properties) => {
    setData(properties, value)
}


/**
 * onChange method for handling useForm() state specifically for select inputs
 *
 * @param {*} e The onChange event
 * @param {object} data The data from inertiajs useForm()
 * @param {func} transform The transform method from inertiajs useForm()
 * @param {func} submitHandler The form submit handler
 */
export const handleOnSelectChange = (e, data, transform, submitHandler) => {
    transform(() => ({
        ...data,
        page: 1,
        [e.target.name]: e.target.value
    }))

    submitHandler(e)
}
