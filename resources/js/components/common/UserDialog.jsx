import { usePage } from "@inertiajs/inertia-react"
import { CalendarMonth, LocationOn, Verified } from "@mui/icons-material"
import { Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Tooltip, Typography } from "@mui/material"

const UserDialog = ({ open, user, handleClose, cancelButtonText = ''}) => {

    const { translatables } = usePage().props

    cancelButtonText = cancelButtonText || translatables.texts.back

    const UserInformation = () => {

        const items = [
            {
                label: translatables.texts.country,
                value: user.country.name,
                icon: <LocationOn fontSize="small" color="primary" />
            },
            {
                label: translatables.texts.date_joined,
                value: user.created_at,
                icon: <CalendarMonth fontSize="small" color="error" />
            },
            {
                label: translatables.texts.badges,
                value: user.badges && user.badges.length > 0 ? user.badges.length : 0,
                icon: <Verified fontSize="small" color="warning" />
            }
        ]

        const informationItems = () => items.map((item, index) => (
            <Tooltip key={index} title={item.label}>
                <Chip
                    variant="outlined"
                    icon={item.icon}
                    label={item.value}
                    sx={{
                        width: { xs: '100%', md: 'auto' }
                    }}
                />
            </Tooltip>
        ))

        return (
            <Stack
                direction={{
                    xs: 'column',
                    md: 'row'
                }}
                spacing={1}
                alignItems="center"
                justifyContent="center"
                children={informationItems()}
            />
        )
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
        >
            <DialogContent sx={{ pt: 4 }}>
                <Box textAlign="center">
                    <Avatar
                        src={user.image}
                        variant="circular"
                        sx={{
                            width: 200,
                            height: 200,
                            maxWidth: '100%',
                            mx: 'auto'
                        }}
                    />
                    <Box my={2}>
                        <Typography variant="h4" children={user.fullname} />
                        <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                            <a href={`mailto:${user.email}`} target="_blank" children={user.email} />
                        </Typography>
                    </Box>
                    <UserInformation />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button
                    variant="contained"
                    children={cancelButtonText}
                    onClick={handleClose}
                />
            </DialogActions>
        </Dialog>
    )
}

export default UserDialog
