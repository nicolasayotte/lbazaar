import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { usePage } from '@inertiajs/inertia-react'

const BadgesTable = ({ data }) => {
    const { translatables } = usePage().props


    if (data && data.length <= 0) {
        data.push({
            type: 'student',
            name: 'Certificate of Completion - Calculus',
            formatted_datetime: 'Tuesday, Mar 19 2024 12:06 AM',
        })
        // TODO put this back
        // return <EmptyCard />
    }

    const handleMint = (name) => {
        const popupWidth = 500;
        const popupHeight = 700;

        // Calculate the center of the screen
        const left = window.top.outerWidth / 2 + window.top.screenX - (popupWidth / 2);
        const top = window.top.outerHeight / 2 + window.top.screenY - (popupHeight / 2);

        const popup = window.open(
            "https://pay.nmkr.io/?p=31970d0c2a694954a416d36847e50375&n=aa680d6c884b4b10ba7e76ff3fd9ebcc",
            "NFT-MAKER PRO Payment Gateway",
            `popup=1, location=1, width=${popupWidth}, height=${popupHeight}, left=${left}, top=${top}`
        );
        console.debug('handleMint', popup)
    }

    const displayTableData = rows => rows.map((row, index) => {
        return (
            <TableRow key={index}>
                <TableCell children={row.type} align="center" />
                <TableCell children={row.name} align="center" />
                <TableCell children={row.formatted_datetime} align="center" />
                <TableCell align="center">
                    <Button onClick={() => handleMint(row.name)}>Mint</Button>
                </TableCell>
            </TableRow>
        )
    })

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell children={translatables.texts.type} align="center" />
                        <TableCell children={translatables.texts.badge_name} align="center" />
                        <TableCell children={translatables.texts.date} align="center" />
                        <TableCell align="center" />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayTableData(data)}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default BadgesTable
