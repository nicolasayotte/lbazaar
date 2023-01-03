import { Link } from "@inertiajs/inertia-react"
import { Search } from "@mui/icons-material"
import { Button, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"
import { getRoute } from "../../../../helpers/routes.helper"

const InquiryTable = ({ data }) => {

    const displayTableData = rows => rows.map((row, index) => (
        <TableRow key={index}>
            <TableCell children={row.name}/>
            <TableCell children={row.email}/>
            <TableCell children={row.subject}/>
            <TableCell align="center" children={row.created_at}/>
            <TableCell align="center">
                <Link href={getRoute('admin.inquiries.view', { id: row.id })}>
                    <IconButton title="View" variant="text" size="small">
                        <Search />
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
                        <TableCell children="Name"/>
                        <TableCell children="Email"/>
                        <TableCell children="Subject"/>
                        <TableCell align="center" children="Date" width={100}/>
                        <TableCell align="center" children="Actions"/>
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
