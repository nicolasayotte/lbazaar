import { Box, Card, CardContent, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"

const InquiryView = () => {
    return (
        <Box>
            <Typography
                variant="h4"
                children="View Inquiry"
                gutterBottom
            />
            <Grid container>
                <Grid item xs={12} md={12}>
                    <TableContainer sx={{ mb: 4 }} component={Paper}>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell align="right">Name</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Email</TableCell>
                                    <TableCell align="right">johndoe@example.com</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Date Sent</TableCell>
                                    <TableCell align="right">10/01/2022</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Subject</TableCell>
                                    <TableCell align="right">Lorem Ipsum Dolor Sit Amet</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2}>
                                        <Typography variant="p" sx={{ mb: 2, display: 'block' }}>Message</Typography>
                                        <Typography variant="p">
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin suscipit, dolor id elementum laoreet, elit felis elementum orci, non finibus sem enim nec sapien. Curabitur semper dapibus libero, ut convallis turpis. Aliquam semper, massa et ornare consequat, nisi nisi sagittis libero, vitae interdum tellus tortor quis ex. Fusce posuere et sapien nec convallis. Nullam elit lorem, facilisis non varius ut, efficitur pellentesque nisi. Proin pretium, enim ut dapibus molestie, nibh lacus tincidunt risus, nec consectetur libero arcu at sem. Integer placerat nisi vel velit viverra elementum. Sed sit amet mi diam. Fusce quis tortor maximus leo posuere dictum. Nullam at efficitur lectus. Nunc sollicitudin eros et mollis varius.

In in turpis tortor. Vestibulum interdum, mauris quis scelerisque pellentesque, elit libero feugiat mi, at convallis sapien ligula non felis. Nunc erat orci, sagittis non laoreet at, posuere sit amet dolor. Aliquam facilisis arcu dignissim, tempor tellus id, lobortis ipsum. Suspendisse potenti. Sed et justo eget libero suscipit gravida a quis quam. Morbi nisi massa, pretium non dolor vulputate, mattis placerat nisi. Duis euismod erat et risus lacinia, et blandit purus consectetur. Curabitur magna nibh, feugiat congue porttitor et, auctor non dui. Vivamus at ante eu urna aliquam iaculis. Duis varius quis mauris ullamcorper luctus. Fusce eu vehicula nibh. Donec consequat et diam ut efficitur. Mauris finibus nisi justo. Aliquam convallis dolor at ipsum imperdiet auctor. Praesent sed nulla fermentum erat lacinia placerat sit amet vel diam.

Nunc pretium aliquam auctor. In sed dui fermentum, tincidunt justo aliquam, condimentum erat. Fusce nec euismod eros. Maecenas nisl nisi, luctus vitae neque eu, dictum suscipit magna. Pellentesque congue bibendum leo id cursus. Pellentesque euismod urna quis mi viverra lacinia. Maecenas porta facilisis interdum. Aenean lobortis vehicula posuere. Nullam a tempor turpis, eget mollis risus.

Ut laoreet lectus tortor. Donec congue metus id ex tincidunt molestie vel vel ante. Quisque fringilla justo imperdiet velit vulputate, non commodo ante pulvinar. Ut at risus in magna tincidunt consectetur. Duis et quam porta, gravida massa vitae, malesuada ante. Donec porta finibus ligula euismod lobortis. Donec feugiat hendrerit sem sed semper.

In eu mattis sem. Aenean auctor lorem placerat, vulputate dolor eu, cursus nunc. In euismod quam elit. Donec id facilisis leo. Cras nunc tortor, tempor at mattis in, egestas at neque. Aenean quis suscipit metus. Nulla facilisi. In vehicula accumsan rutrum. Aenean vel justo a arcu congue viverra a vitae nibh. Mauris efficitur dignissim arcu quis hendrerit.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    )
}

export default InquiryView
