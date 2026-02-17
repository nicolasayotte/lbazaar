import React from 'react';
import { usePage } from '@inertiajs/inertia-react';
import { Inertia } from '@inertiajs/inertia';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    Alert,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { getRoute } from '../../../helpers/routes.helper';

const Cancel = () => {
    const { course, error, translatables } = usePage().props;

    const handleRetry = () => {
        if (course?.id) {
            Inertia.visit(getRoute('course.details', { id: course.id }));
        } else {
            Inertia.visit('/');
        }
    };

    const handleGoHome = () => {
        Inertia.visit('/');
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ py: 8 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <ErrorOutlineIcon
                        color="error"
                        sx={{ fontSize: 80, mb: 2 }}
                    />

                    <Typography variant="h4" gutterBottom>
                        {translatables?.texts?.payment_cancelled || 'Payment Cancelled'}
                    </Typography>

                    <Typography variant="body1" color="text.secondary" paragraph>
                        {translatables?.texts?.payment_not_processed || 'Your payment was not processed.'}
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ my: 3, textAlign: 'left' }}>
                            {error}
                        </Alert>
                    )}

                    {course && (
                        <Box sx={{ my: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                {translatables?.texts?.course || 'Course'}
                            </Typography>
                            <Typography variant="h6">
                                {course.title}
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 3 }}>
                        {translatables?.texts?.payment_help || 'If you encountered an issue, please try again or contact support.'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                        <Button variant="outlined" fullWidth onClick={handleGoHome}>
                            {translatables?.texts?.home || 'Home'}
                        </Button>
                        <Button variant="contained" fullWidth onClick={handleRetry}>
                            {translatables?.texts?.try_again || 'Try Again'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Cancel;
