import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Box, Button, CircularProgress, Typography, Alert } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ course, onSuccess, onCancel, translatables }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setErrorMessage(null);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/success?course_id=${course.id}`,
            },
        });

        // If we get here, there was an error (successful payments redirect automatically)
        if (error) {
            setErrorMessage(error.message);
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {translatables?.texts?.payment_amount || 'Amount'}: ¥{course.price?.toLocaleString()}
                </Typography>
            </Box>

            <PaymentElement
                options={{
                    layout: 'tabs',
                }}
            />

            {errorMessage && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {errorMessage}
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                    variant="outlined"
                    fullWidth
                    onClick={onCancel}
                    disabled={processing}
                >
                    {translatables?.texts?.cancel || 'Cancel'}
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={!stripe || processing}
                    startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <CreditCardIcon />}
                >
                    {processing
                        ? (translatables?.texts?.processing || 'Processing...')
                        : `${translatables?.texts?.pay || 'Pay'} ¥${course.price?.toLocaleString()}`
                    }
                </Button>
            </Box>
        </form>
    );
};

const StripeCheckout = ({ clientSecret, course, onSuccess, onCancel, translatables }) => {
    if (!clientSecret) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {translatables?.texts?.loading || 'Loading...'}
                </Typography>
            </Box>
        );
    }

    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#1976d2',
        },
    };

    const options = {
        clientSecret,
        appearance,
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
                course={course}
                onSuccess={onSuccess}
                onCancel={onCancel}
                translatables={translatables}
            />
        </Elements>
    );
};

export default StripeCheckout;
