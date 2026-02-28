import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Hoisted mock values — defined before any vi.mock() hoisting takes effect
// ---------------------------------------------------------------------------
const { mockDispatch, mockExperimental, mockWalletAPI, mockOnWalletAPI, mockOnStakeKeyHash } = vi.hoisted(() => {
    const mockDispatch = vi.fn()
    const mockExperimental = { on: vi.fn(), off: vi.fn() }
    const mockWalletAPI = {
        getNetworkId: vi.fn().mockResolvedValue(0),
        getBalance: vi.fn().mockResolvedValue('0'),
        getChangeAddress: vi.fn().mockResolvedValue('deadbeef'),
        experimental: mockExperimental,
    }
    const mockOnWalletAPI = vi.fn()
    const mockOnStakeKeyHash = vi.fn()
    return { mockDispatch, mockExperimental, mockWalletAPI, mockOnWalletAPI, mockOnStakeKeyHash }
})

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock('@inertiajs/inertia-react', () => ({
    usePage: () => ({
        props: {
            translatables: {
                texts: {
                    wallet_connect: 'Connect Wallet',
                    wallet_connected: 'Connected',
                    wallet_balance: 'Balance:',
                    wallet_id: 'ID:',
                    wallet_verify: 'Verify',
                    wallet_switch: 'Switch',
                    wallet_hardware: 'Hardware',
                    wallet_message: 'Please sign',
                    mobile: 'Mobile',
                    wallet_reconnect_prompt: 'Reconnect',
                },
                wallets: { eternl: 'Eternl', flint: 'Flint', nami: 'Nami' },
                confirm: { mobile: { view: 'Open in mobile?' } },
                success: { wallet: { verify: 'Verified!' } },
                wallet_error: {
                    not_found: 'Not found',
                    no_signin: 'Not signed in',
                    not_connected: 'Not connected',
                    verify: 'Verify error',
                    disconnected: 'Disconnected',
                    wrong_network: 'Wrong network',
                    account_changed: 'Account changed',
                    network_changed: 'Network changed',
                },
            },
            cardano_network_id: 0,
        },
    }),
}))

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
}))

vi.mock('axios', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}))

vi.mock('react-device-detect', () => ({
    BrowserView: ({ children }) => children,
    MobileView: () => null,
}))

vi.mock('../../components/common/ConfirmationDialog', () => ({
    default: () => <div />,
}))

// Image imports
vi.mock('../../../img/eternl-logo.jpg', () => ({ default: 'eternl-logo.jpg' }))
vi.mock('../../../img/flint-logo.svg', () => ({ default: 'flint-logo.svg' }))
vi.mock('../../../img/nami-logo.svg', () => ({ default: 'nami-logo.svg' }))

// MUI icon mocks so data-testid is available for querying
vi.mock('@mui/icons-material/ChangeCircle', () => ({
    default: (props) => <svg data-testid="ChangeCircleIcon" {...props} />,
}))
vi.mock('@mui/icons-material/TaskAlt', () => ({
    default: (props) => <svg data-testid="TaskAltIcon" {...props} />,
}))

// ---------------------------------------------------------------------------
// Component import — MUST come after all vi.mock() declarations
// ---------------------------------------------------------------------------
import axios from 'axios'
import WalletConnector from './WalletConnector'

// ---------------------------------------------------------------------------
// beforeEach / afterEach
// ---------------------------------------------------------------------------
beforeEach(() => {
    vi.clearAllMocks()

    // Re-apply default resolved values after clearAllMocks clears them
    mockWalletAPI.getNetworkId.mockResolvedValue(0)
    mockWalletAPI.getBalance.mockResolvedValue('0')
    mockWalletAPI.getChangeAddress.mockResolvedValue('deadbeef')

    window.cardano = {
        eternl: { enable: vi.fn().mockResolvedValue(mockWalletAPI) },
    }

    axios.get.mockResolvedValue({ data: { loggedIn: true } })
    axios.post.mockResolvedValue({
        data: JSON.stringify({
            accountAmt: '2000000',
            stakeKeyAddr: 'stake_addr',
            stakeAddrBech32: 'stake1abc',
            stakeKeyHash: 'abc123456def',
            verified: false,
        }),
    })

    // Suppress expected console noise from component internals
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
    delete window.cardano
})

// ---------------------------------------------------------------------------
// Helper: connect the wallet so event listeners get registered
// ---------------------------------------------------------------------------
async function connectWallet({ getByLabelText, rerender }) {
    // Step 1: Click eternl button to set whichWalletSelected
    fireEvent.click(getByLabelText('eternl'))

    // Step 2: Wait for enable() flow to call onWalletAPI
    await waitFor(() => expect(mockOnWalletAPI).toHaveBeenCalledWith(mockWalletAPI))

    // Step 3: Rerender with walletAPI prop (simulates parent updating)
    rerender(
        <WalletConnector
            walletAPI={mockWalletAPI}
            onWalletAPI={mockOnWalletAPI}
            onStakeKeyHash={mockOnStakeKeyHash}
        />
    )

    // Step 4: Wait for event listeners to register
    await waitFor(() => expect(mockExperimental.on).toHaveBeenCalledTimes(2))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('F-12.3: CIP-30 event listener registration', () => {

    it('1. Registers accountChange and networkChange listeners on connect', async () => {
        const renderResult = render(
            <WalletConnector
                walletAPI={undefined}
                onWalletAPI={mockOnWalletAPI}
                onStakeKeyHash={mockOnStakeKeyHash}
            />
        )

        await connectWallet(renderResult)

        expect(mockExperimental.on).toHaveBeenCalledWith('accountChange', expect.any(Function))
        expect(mockExperimental.on).toHaveBeenCalledWith('networkChange', expect.any(Function))
    })

    it('2. Does not register listeners when experimental.on is absent', async () => {
        const walletAPINoExp = {
            getNetworkId: vi.fn().mockResolvedValue(0),
            getBalance: vi.fn().mockResolvedValue('0'),
            getChangeAddress: vi.fn().mockResolvedValue('deadbeef'),
            // no experimental property
        }

        window.cardano.eternl.enable.mockResolvedValue(walletAPINoExp)

        const { getByLabelText, rerender } = render(
            <WalletConnector
                walletAPI={undefined}
                onWalletAPI={mockOnWalletAPI}
                onStakeKeyHash={mockOnStakeKeyHash}
            />
        )

        // Click eternl, wait for onWalletAPI called with walletAPINoExp
        fireEvent.click(getByLabelText('eternl'))
        await waitFor(() => expect(mockOnWalletAPI).toHaveBeenCalledWith(walletAPINoExp))

        // Rerender with the no-experimental walletAPI
        rerender(
            <WalletConnector
                walletAPI={walletAPINoExp}
                onWalletAPI={mockOnWalletAPI}
                onStakeKeyHash={mockOnStakeKeyHash}
            />
        )

        // Verify listeners were never registered (robust negative assertion)
        await expect(
            waitFor(() => expect(mockExperimental.on).toHaveBeenCalled(), { timeout: 200 })
        ).rejects.toThrow()
    })

    it('3. networkChange with matching network ID causes no disconnect', async () => {
        const renderResult = render(
            <WalletConnector
                walletAPI={undefined}
                onWalletAPI={mockOnWalletAPI}
                onStakeKeyHash={mockOnStakeKeyHash}
            />
        )

        await connectWallet(renderResult)

        const networkChangeHandler = mockExperimental.on.mock.calls.find(c => c[0] === 'networkChange')[1]

        mockDispatch.mockClear()
        networkChangeHandler(0) // matching expectedNetworkId

        // No error dispatch should have occurred
        expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('4. networkChange with wrong network ID triggers disconnect', async () => {
        const renderResult = render(
            <WalletConnector
                walletAPI={undefined}
                onWalletAPI={mockOnWalletAPI}
                onStakeKeyHash={mockOnStakeKeyHash}
            />
        )

        await connectWallet(renderResult)

        const networkChangeHandler = mockExperimental.on.mock.calls.find(c => c[0] === 'networkChange')[1]

        networkChangeHandler(1) // wrong network

        await waitFor(() =>
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ payload: { message: 'Network changed' } })
            )
        )
    })

    it('5. accountChange success: re-fetches address and wallet info', async () => {
        const renderResult = render(
            <WalletConnector
                walletAPI={undefined}
                onWalletAPI={mockOnWalletAPI}
                onStakeKeyHash={mockOnStakeKeyHash}
            />
        )

        await connectWallet(renderResult)

        // Clear call counts before triggering accountChange
        mockWalletAPI.getChangeAddress.mockClear()
        axios.post.mockClear()

        const accountChangeHandler = mockExperimental.on.mock.calls.find(c => c[0] === 'accountChange')[1]
        await accountChangeHandler()

        await waitFor(() => {
            expect(mockWalletAPI.getChangeAddress).toHaveBeenCalled()
            expect(axios.post).toHaveBeenCalled()
        })
    })

    it('6. accountChange error: triggers disconnect', async () => {
        const renderResult = render(
            <WalletConnector
                walletAPI={undefined}
                onWalletAPI={mockOnWalletAPI}
                onStakeKeyHash={mockOnStakeKeyHash}
            />
        )

        await connectWallet(renderResult)

        mockWalletAPI.getChangeAddress.mockRejectedValueOnce(new Error('fail'))

        const accountChangeHandler = mockExperimental.on.mock.calls.find(c => c[0] === 'accountChange')[1]
        await accountChangeHandler()

        await waitFor(() =>
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ payload: { message: 'Account changed' } })
            )
        )
    })

    it('7. Cleanup on unmount: calls experimental.off for both listeners', async () => {
        const { unmount, ...rest } = render(
            <WalletConnector
                walletAPI={undefined}
                onWalletAPI={mockOnWalletAPI}
                onStakeKeyHash={mockOnStakeKeyHash}
            />
        )

        await connectWallet({ ...rest })

        unmount()

        expect(mockExperimental.off).toHaveBeenCalledWith('accountChange', expect.any(Function))
        expect(mockExperimental.off).toHaveBeenCalledWith('networkChange', expect.any(Function))
    })

    it('8. Cleanup on wallet switch: calls experimental.off', async () => {
        const renderResult = render(
            <WalletConnector
                walletAPI={undefined}
                onWalletAPI={mockOnWalletAPI}
                onStakeKeyHash={mockOnStakeKeyHash}
            />
        )

        await connectWallet(renderResult)

        // Clear prior calls (e.g. from heartbeat cleanup)
        mockExperimental.off.mockClear()

        // Find and click the switch wallet button via the ChangeCircleIcon
        fireEvent.click(screen.getByTestId('ChangeCircleIcon').closest('button'))

        expect(mockExperimental.off).toHaveBeenCalledWith('accountChange', expect.any(Function))
        expect(mockExperimental.off).toHaveBeenCalledWith('networkChange', expect.any(Function))
    })

})
