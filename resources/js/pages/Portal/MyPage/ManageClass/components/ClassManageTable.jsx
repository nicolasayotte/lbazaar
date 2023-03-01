import { Link, usePage } from "@inertiajs/inertia-react"
import { Delete, Settings } from "@mui/icons-material"
import { Chip, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { getRoute } from "../../../../../helpers/routes.helper"

const ClassManageTable = ({ data, handleOnDelete }) => {

    const { translatables } = usePage().props

    const displayTableData = rows => rows.map((row, index) => {

        return (
            <TableRow key={index}>
                <TableCell children={row.title}/>
                <TableCell align="center" children={row.type}/>
                <TableCell align="center" children={row.format}/>
                <TableCell align="center" children={row.category}/>
                <TableCell sx={{ whiteSpace: 'nowrap'}} align="center" children={row.publishedDate}/>
                <TableCell sx={{ whiteSpace: 'nowrap'}} align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Link title={translatables.title.class.manage.view} href={getRoute('mypage.course.manage_class.schedules', { id: row.id })}>
                            <IconButton size="small">
                                <Settings fontSize="inherit"/>
                            </IconButton>
                        </Link>
                        <IconButton
                            disabled={!row.isDeletable}
                            onClick={() => handleOnDelete(row.id)}
                            size="small"
                            title={translatables.texts.delete}
                        >
                            <Delete fontSize="inherit" color={row.isDeletable ? 'error' : 'disabled'}/>
                        </IconButton>
                    </Stack>
                </TableCell>
            </TableRow>
        )
    })

    if (data && data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell children="Title"/>
                            <TableCell align="center" children={translatables.texts.type} />
                            <TableCell align="center" children={translatables.texts.format} />
                            <TableCell align="center" children={translatables.texts.category} />
                            <TableCell align="center" children={translatables.texts.date_created} />
                            <TableCell align="center" children={translatables.texts.actions} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayTableData(data)}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}

export default ClassManageTable
