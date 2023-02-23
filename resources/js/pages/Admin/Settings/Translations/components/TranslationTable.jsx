import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import Input from "../../../../../components/forms/Input"

const TranslationTable = ({ data, formData, handleOnChange }) => {

    if (data && data.length <= 0) {
        return <EmptyCard />
    }

    const displayTableData = data.map(translation => (
        <TableRow key={translation.key}>
            <TableCell children={translation.en} />
            <TableCell>
                <Input
                    name="translations"
                    placeholder="Enter japanese translation"
                    value={formData[translation.key]}
                    onChange={e => handleOnChange(e, translation.key)}
                />
            </TableCell>
        </TableRow>
    ))

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell children="EN (English)" />
                        <TableCell width="60%" children="JA (Japanese)" />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayTableData}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default TranslationTable
