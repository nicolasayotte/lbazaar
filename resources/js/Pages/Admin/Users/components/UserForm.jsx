import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions } from "../../../../helpers/form.helper"

const UserForm = ({ roleOptions, countryOptions, classificationOptions }) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell width="20%" variant="borderless">First Name</TableCell>
                        <TableCell variant="borderless">
                            <Input />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell width="20%" variant="borderless">Last Name</TableCell>
                        <TableCell variant="borderless">
                            <Input />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell width="20%" variant="borderless">Email</TableCell>
                        <TableCell variant="borderless">
                            <Input />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell width="20%" variant="borderless">Role</TableCell>
                        <TableCell variant="borderless">
                            <Input
                                select
                            >
                                <option value="">Select Role</option>
                                {displaySelectOptions(roleOptions)}
                            </Input>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell width="20%" variant="borderless">Classification</TableCell>
                        <TableCell variant="borderless">
                            <Input
                                select
                            >
                                <option value="">Select Classification</option>
                                {displaySelectOptions(classificationOptions)}
                            </Input>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell width="20%" variant="borderless">Country</TableCell>
                        <TableCell variant="borderless">
                            <Input
                                select
                            >
                                <option value="">Select Country</option>
                                {displaySelectOptions(countryOptions, 'value', 'name')}
                            </Input>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={2} align="right">
                            <Button
                                variant="contained"
                                children="Create New User"
                            />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default UserForm
