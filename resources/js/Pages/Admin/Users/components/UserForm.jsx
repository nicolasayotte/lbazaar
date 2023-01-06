import { useForm } from "@inertiajs/inertia-react"
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions } from "../../../../helpers/form.helper"
import routes from "../../../../helpers/routes.helper"
import { actions } from "../../../../store/slices/ToasterSlice"

const UserForm = ({ messages, errors, roleOptions, countryOptions, classificationOptions }) => {

    const dispatch = useDispatch()

    const [isTeacher, setIsTeacher] = useState(false);

    const { data, setData, post, processing } = useForm('CreateUserForm', {
        first_name: '',
        last_name: '',
        email: '',
        role_id: '',
        classification_id: '',
        country_id: ''
    })

    const handleOnChange = (e) => {
        setData(e.target.name, e.target.value)
    }

    const handleOnRoleChange = (e) => {

        const input = e.target

        const isTeacher = input.selectedIndex === 2

        if (isTeacher) {
            setIsTeacher(true)
        } else {
            setIsTeacher(false)

            setData(data => ({
                ...data,
                classification_id: ''
            }))
        }

        setData(data => ({
            ...data,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        post(routes["admin.users.store"], {
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        })
    }

    const roleInput = document.getElementById('role_id')

    useEffect(() => {
        if (roleInput && roleInput.selectedIndex === 2) {
            setIsTeacher(true)
        }
    }, [roleInput])

    return (
        <form onSubmit={handleSubmit}>
            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell
                                width="20%"
                                variant="borderless"
                                children="First Name"
                            />
                            <TableCell variant="borderless">
                                <Input
                                    name="first_name"
                                    value={data.first_name}
                                    onChange={handleOnChange}
                                    errors={errors}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell
                                width="20%"
                                variant="borderless"
                                children="Last Name"
                            />
                            <TableCell variant="borderless">
                                <Input
                                    name="last_name"
                                    value={data.last_name}
                                    onChange={handleOnChange}
                                    errors={errors}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell
                                width="20%"
                                variant="borderless"
                                children="Email"
                            />
                            <TableCell variant="borderless">
                                <Input
                                    placeholder="e.g. john@example.com"
                                    name="email"
                                    value={data.email}
                                    onChange={handleOnChange}
                                    errors={errors}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell
                                width="20%"
                                variant="borderless"
                                children="Role"
                            />
                            <TableCell variant="borderless">
                                <Input
                                    select
                                    id="role_id"
                                    name="role_id"
                                    value={data.role_id}
                                    onChange={handleOnRoleChange}
                                    errors={errors}
                                >
                                    <option value="">Select Role</option>
                                    {displaySelectOptions(roleOptions, 'value', 'name')}
                                </Input>
                            </TableCell>
                        </TableRow>
                        {
                            (isTeacher) &&
                            <TableRow>
                                <TableCell
                                    width="20%"
                                    variant="borderless"
                                    children="Classification"
                                />
                                <TableCell variant="borderless">
                                    <Input
                                        select
                                        name="classification_id"
                                        value={data.classification_id}
                                        onChange={handleOnChange}
                                        errors={errors}
                                    >
                                        <option value="">Select Classification</option>
                                        {displaySelectOptions(classificationOptions)}
                                    </Input>
                                </TableCell>
                            </TableRow>
                        }
                        <TableRow>
                            <TableCell width="20%" variant="borderless">Country</TableCell>
                            <TableCell variant="borderless">
                                <Input
                                    select
                                    name="country_id"
                                    value={data.country_id}
                                    onChange={handleOnChange}
                                    errors={errors}
                                >
                                    <option value="">Select Country</option>
                                    {displaySelectOptions(countryOptions)}
                                </Input>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={2} align="right">
                                <Button
                                    variant="contained"
                                    children="Create New User"
                                    type="submit"
                                    disabled={processing}
                                    onClick={handleSubmit}
                                />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </form>
    )
}

export default UserForm
