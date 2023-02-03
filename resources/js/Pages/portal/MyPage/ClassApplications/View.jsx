import { usePage } from "@inertiajs/inertia-react"
import { Box, Chip, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import { useState } from "react"
import { useDispatch } from "react-redux"
import BackButton from "../../../../components/common/BackButton"

const View = () => {

    const dispatch = useDispatch()

    const { courseApplication } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: 'Class Application',
        text: '',
        url: '',
        confirmButtonText: 'Confirm',
        processing: false
    })

    const generalInformationStyle = {
        textAlign: {
            xs: "right",
            md: "left"
        }
    }

    const statusColors = {
        "Approved": 'success',
        "Pending": 'default',
        "Denied": 'error'
    }

    const displayApprovalStatus = () => {

        if (courseApplication.status === 'Pending') return ""

        return (
            <TableRow>
                <TableCell children={`Date ${courseApplication.status}`}/>
                <TableCell
                    align="right"
                    children={
                        courseApplication.status === 'Approved'
                        ? courseApplication.approved_at
                        : courseApplication.denied_at
                    }
                />
            </TableRow>
        )
    }

    return (
        <Box>
            <Grid container spacing={2}>
                <Grid item xs={12} lg={8}>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children="General Information"/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell width="10%" children="Title"/>
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.title}
                                    />
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children="Type"/>
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.type}
                                    />
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children="Category"/>
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.category}
                                    />
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children="Language"/>
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.language}
                                    />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell children="Content Information"/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>
                                        <div dangerouslySetInnerHTML={{ __html: courseApplication.description }} />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children="Status Information"/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell children="Status"/>
                                    <TableCell align="right">
                                        <Chip label={courseApplication.status} size="small" color={statusColors[courseApplication.status]}/>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Date Applied"/>
                                    <TableCell align="right" children={courseApplication.created_at}/>
                                </TableRow>
                                {displayApprovalStatus()}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children="Pricing Information"/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell width="50%" children="Price"/>
                                    <TableCell align="right" children={courseApplication.price}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell width="50%" children="Points Earned"/>
                                    <TableCell align="right" children={courseApplication.points_earned}/>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
            <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <BackButton />
                </Box>
            </Grid>
        </Box>
    )
}

export default View
