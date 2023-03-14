
import { Button, Typography, Box , Avatar, Grid, Paper, Stack } from "@mui/material"
import { Link, usePage } from "@inertiajs/inertia-react"
import { getRoute } from "../../helpers/routes.helper"
import placeholderImg from "../../../img/placeholder.png"

const User = ({ user, condensed = true }) => {
    const { translatables } = usePage().props

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" alignItems="center">
                <Box  mr={2}>
                    <Avatar
                        src={user.image || placeholderImg}
                        variant="circular"
                        sx={{
                            width: 80,
                            height: 80,
                            maxWidth: '100%',
                            mx: 'auto'
                        }}
                    />
                </Box>
                <Stack
                    direction={condensed ? 'column' : 'row'}
                    justifyContent="space-between"
                    alignItems={condensed ? 'flex-start' : 'center'}
                    flexGrow={1}
                >
                    <Box>
                        <Typography variant="caption" color="GrayText" children={translatables.texts.teacher} display="block" mb={-1} />
                        <Typography variant="h6" children={user.fullname} />
                        <Typography variant="caption" color="GrayText" children={`${translatables.texts.date_joined} ${user.created_at}`} display="block"  />
                    </Box>
                    <Box sx={ condensed ? { mt: 1 } : { ml: 'auto' } }>
                        <Link href={getRoute('portal.users.view', {id : user.id})}>
                            <Button
                                size={condensed ? 'small' : 'large'}
                                variant="contained"
                                children={translatables.texts.view_profile}
                            />
                        </Link>
                    </Box>
                </Stack>
            </Stack>
        </Paper>
    );
}

export default User
