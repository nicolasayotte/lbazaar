import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CardanoNetworkStatus from './CardanoNetworkStatus'

const trans = { texts: { cardano_network_degraded: 'Degraded msg', cardano_network_unreachable: 'Unreachable msg' } }

describe('CardanoNetworkStatus', () => {
    it('renders nothing when healthy', () => {
        const { container } = render(<CardanoNetworkStatus status="healthy" translatables={trans} />)
        expect(container).toBeEmptyDOMElement()
    })
    it('renders warning for degraded', () => {
        render(<CardanoNetworkStatus status="degraded" translatables={trans} />)
        expect(screen.getByText('Degraded msg')).toBeInTheDocument()
    })
    it('renders error for unreachable', () => {
        render(<CardanoNetworkStatus status="unreachable" translatables={trans} />)
        expect(screen.getByText('Unreachable msg')).toBeInTheDocument()
    })
})
