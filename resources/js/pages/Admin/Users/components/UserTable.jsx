import { Link, usePage } from "@inertiajs/inertia-react"
import { Block, Check, Download, Search } from "@mui/icons-material"
import { IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Box, Menu, MenuItem } from "@mui/material"
import { useState } from "react"
import EmptyCard from "../../../../components/common/EmptyCard"
import routes, { getRoute } from "../../../../helpers/routes.helper"

const UserTable = ({ data, handleOnEnable, handleOnDisable, export_options, export_type }) => {

    const { translatables } = usePage().props

    const [exportDropdown, setExportDropdown] = useState(null)
    const [openedDropdown, setOpenedDropdown] = useState(null)

    const handleOnExportDropdownClick = (e, id) => {
        setExportDropdown(e.currentTarget)
        setOpenedDropdown(id)
    }

    const handleOnExportDropdownClose = () => {
        setExportDropdown(null)
        setOpenedDropdown(null)
    }

    const enableButton = (id, isDisabled) => (
        <IconButton
            size="small"
            title={translatables.texts.enable}
            disabled={isDisabled}
            onClick={() => handleOnEnable(id)}
        >
            <Check fontSize="inherit" color={isDisabled ? 'inherit' : 'success'}/>
        </IconButton>
    )

    const disableButton = (id, isDisabled) => (
        <IconButton
            size="small"
            title={translatables.texts.disable}
            disabled={isDisabled}
            onClick={() => handleOnDisable(id)}
        >
            <Block fontSize="inherit" color={isDisabled ? 'inherit' : 'error'} />
        </IconButton>
    )

    const displayTableData = rows => rows.map((row, index) => {

        const exportButton = () => {

            const MenuItems = () => export_options && export_options.map((exportOption, index) => (
                <MenuItem key={index}>
                    <a
                        href={`${routes["admin.users.export"]}?user_id=${row.id}&export_type=${exportOption.id}`}
                        children={exportOption.name}
                    />
                </MenuItem>
            ))

            return (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        id={`export-button-${row.id}`}
                        color="primary"
                        size="small"
                        title={translatables.texts.export_csv}
                        onClick={e => handleOnExportDropdownClick(e, row.id)}
                    >
                        <Download fontSize="inherit" />
                    </IconButton>
                    <Menu
                        id={`export-menu-${row.id}`}
                        anchorEl={exportDropdown}
                        open={openedDropdown === row.id}
                        onClose={handleOnExportDropdownClose}
                    >
                        <MenuItems />
                    </Menu>
                </Box>
            )
        }

        return (
            <TableRow key={index}>
                <TableCell children={row.name}/>
                <TableCell children={row.email}/>
                <TableCell children={row.roles.join(', ')} align="center"/>
                <TableCell children={row.status} align="center"/>
                <TableCell children={row.date_joined} align="center"/>
                <TableCell align="center">
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <Link href={getRoute('admin.users.view', { id: row.id })}>
                            <IconButton size="small" title={translatables.texts.view}>
                                <Search fontSize="inherit" />
                            </IconButton>
                        </Link>
                        { enableButton(row.id, row.is_active) }
                        { disableButton(row.id, !row.is_active) }
                        { exportButton() }
                    </Stack>
                </TableCell>
            </TableRow>
        )
    })

    if (data && data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell children={translatables.texts.name} />
                        <TableCell children={translatables.texts.email} />
                        <TableCell children={translatables.texts.role} align="center" />
                        <TableCell children={translatables.texts.status} align="center" />
                        <TableCell children={translatables.texts.date_joined} align="center" />
                        <TableCell children={translatables.texts.actions} align="center" />
                    </TableRow>
                </TableHead>
                <TableBody>
                    { displayTableData(data) }
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default UserTable
