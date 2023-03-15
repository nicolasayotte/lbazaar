import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import Input from "../../../../../components/forms/Input"

const GeneralSettingsTable = ({ data, formData, handleOnChange, translatables, errors }) => {

    if (data && data.length <= 0) {
        return <EmptyCard />
    }
    console.log(errors)
    const displayTableData = data.map(general_setting => (
        <TableRow key={general_setting.slug}>
            <TableCell children={general_setting.name} />
            <TableCell>
                <Input
                    type={general_setting.type}
                    name={`general_settings.${general_setting.slug}`}
                    value={formData[general_setting.slug]}
                    onChange={e => handleOnChange(e, general_setting.slug)}
                    errors={errors}
                />
            </TableCell>
        </TableRow>
    ))

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell children={translatables.texts.name} />
                        <TableCell width="60%" children={translatables.texts.content} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayTableData}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default GeneralSettingsTable
