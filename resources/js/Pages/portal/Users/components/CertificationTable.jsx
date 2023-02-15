import { usePage } from "@inertiajs/inertia-react"
import { Paper, Table, TableBody, TableContainer, TableHead, TableRow } from "@mui/material"
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import { styled } from '@mui/material/styles';

const CertificationTable = ({ data }) => {

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
                <StyledTableCell children={row.title}/>
                <StyledTableCell children={row.awarded_by}/>
                <StyledTableCell children={row.awarded_at}/>
            </StyledTableRow>
        )
    })
    return (
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell children={translatables.certification.certificate_title} />
                            <StyledTableCell children={translatables.certification.awarded_by} />
                            <StyledTableCell children={translatables.certification.awarded_at} />
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

export default CertificationTable
