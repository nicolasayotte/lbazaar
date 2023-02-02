import { Link, usePage } from "@inertiajs/inertia-react"
import { Search } from "@mui/icons-material"
import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"
import { getRoute } from "../../../../helpers/routes.helper"

const InquiryTable = ({ data }) => {

    const { translatables } = usePage().props

    const displayTableData = rows => rows.map((row, index) => (
        <TableRow key={index}>
            <TableCell children={row.name}/>
            <TableCell children={row.email}/>
            <TableCell children={row.subject}/>
            <TableCell align="center" children={row.created_at}/>
            <TableCell align="center">
                <Link href={getRoute('admin.inquiries.view', { id: row.id })}>
                    <IconButton
                        title={translatables.texts.view}
                        variant="text"
                        size="small"
                    >
                        <Search fontSize="inherit" />
                    </IconButton>
                </Link>
            </TableCell>
        </TableRow>
    ))

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
                        <TableCell children={translatables.texts.subject} />
                        <TableCell align="center" children={translatables.texts.date} width={100}/>
                        <TableCell align="center" children={translatables.texts.actions}/>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayTableData(data)}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default InquiryTable
