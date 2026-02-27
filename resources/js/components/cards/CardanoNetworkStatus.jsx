import { Alert } from "@mui/material"

const CardanoNetworkStatus = ({ status, translatables }) => {
    if (!status || status === 'healthy') return null
    if (status === 'degraded') {
        return (
            <Alert severity="warning" sx={{ mb: 1 }}>
                {translatables?.texts?.cardano_network_degraded
                    ?? 'The Cardano network is experiencing delays. Credit card payment is recommended.'}
            </Alert>
        )
    }
    return (
        <Alert severity="error" sx={{ mb: 1 }}>
            {translatables?.texts?.cardano_network_unreachable
                ?? 'The Cardano network is currently unreachable. ADA payments are temporarily disabled.'}
        </Alert>
    )
}

export default CardanoNetworkStatus
