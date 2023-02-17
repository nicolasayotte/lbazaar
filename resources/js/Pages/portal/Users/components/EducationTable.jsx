import { usePage } from "@inertiajs/inertia-react"
import { Paper, Table, TableBody, TableContainer, TableHead, TableRow } from "@mui/material"
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import { styled } from '@mui/material/styles';

const EducationTable = ({ data }) => {

    const { translatables } = usePage().props

    const StyledTableCell = styled(TableCell)(({ theme }) => ({
        [`&.${tableCellClasses.head}`]: {
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.common.white,
        },
        [`&.${tableCellClasses.body}`]: {
          fontSize: 14,
        },
      }));

      const StyledTableRow = styled(TableRow)(({ theme }) => ({
        '&:nth-of-type(odd)': {
          backgroundColor: theme.palette.action.hover,
        },
        // hide last border
        '&:last-child td, &:last-child th': {
          border: 0,
        },
      }));

    const displayTableData = rows => rows.map((row, index) => {

        return (
            <StyledTableRow key={index}>
                <StyledTableCell children={row.school}/>
                <StyledTableCell children={row.degree}/>
                <StyledTableCell children={`${row.start_date} — ${row.end_date}`}/>
            </StyledTableRow>
        )
    })
    return (
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell children={translatables.education.school} />
                            <StyledTableCell children={translatables.education.degree} />
                            <StyledTableCell children={translatables.education.date} />
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

export default EducationTable
