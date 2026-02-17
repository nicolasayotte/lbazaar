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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getRoute } from '../../../helpers/routes.helper';

const Success = () => {
    const { course, payment, translatables } = usePage().props;

    const handleGoToCourse = () => {
        if (course?.id) {
            Inertia.visit(getRoute('course.details', { id: course.id }));
        }
    };

    const handleGoToMyPage = () => {
        Inertia.visit(getRoute('mypage.course.history.index'));
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ py: 8 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <CheckCircleIcon
                        color="success"
                        sx={{ fontSize: 80, mb: 2 }}
                    />

                    <Typography variant="h4" gutterBottom>
                        {translatables?.texts?.payment_successful || 'Payment Successful!'}
                    </Typography>

                    <Typography variant="body1" color="text.secondary" paragraph>
                        {translatables?.texts?.enrollment_confirmed || 'Your enrollment has been confirmed.'}
                    </Typography>

                    {course && (
                        <Box sx={{ my: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                {translatables?.texts?.course || 'Course'}
                            </Typography>
                            <Typography variant="h6">
                                {course.title}
                            </Typography>
                            {payment && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {translatables?.texts?.amount_paid || 'Amount Paid'}: ¥{payment.amount?.toLocaleString()}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {payment?.receipt_url && (
                        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                            {translatables?.texts?.receipt_sent || 'A receipt has been sent to your email.'}
                            {' '}
                            <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                                {translatables?.texts?.view_receipt || 'View Receipt'}
                            </a>
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                        <Button variant="outlined" fullWidth onClick={handleGoToMyPage}>
                            {translatables?.texts?.my_courses || 'My Courses'}
                        </Button>
                        <Button variant="contained" fullWidth onClick={handleGoToCourse}>
                            {translatables?.texts?.view_course || 'View Course'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Success;
