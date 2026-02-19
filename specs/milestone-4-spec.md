# Spec: Milestone 4 — Front-End Development

**Source:** milestone-4.md  
**Generated:** 2026-02-19  
**Status:** DRAFT — requires operator review

---

## Domain Glossary

### Actors

| Actor | Description |
|-------|-------------|
| Student | A platform user who browses, purchases, and completes classes. Every student has an implicit custodial wallet capable of receiving on-chain assets. May also connect an external browser wallet. |
| Teacher | A platform user who creates classes, sets pricing in JPY, and configures completion rewards (NFT certificates and/or tokens). Can mint and send certificates to students who complete their class. |
| Admin | A platform operator with elevated privileges for platform-level configuration and oversight. |
| Community Member | Any user of the platform. Not a distinct role — this is a superset label covering Students, Teachers, and Admins. |

### Key Terms

| Term | Definition |
|------|------------|
| Class | A purchasable learning unit created by a Teacher with a price denominated in JPY. |
| Course Completion | A state transition already defined in the existing platform. When a student meets the existing completion criteria, they become eligible for any configured rewards. |
| NFT Certificate | A non-fungible token minted on-chain representing proof of class completion. Configured per-class by the Teacher. |
| Token Reward | A fungible token distributed on-chain to a student upon class completion. Configured per-class by the Teacher. |
| Custodial Wallet | A platform-managed wallet assigned implicitly to every student. Capable of receiving NFT certificates and token rewards without requiring the student to connect an external wallet. |
| External Wallet | A browser-based wallet (e.g., the set of wallets currently supported by the platform) that a student may optionally connect for direct ADA payments. |
| ADA Price | The class price expressed in ADA, derived from the teacher-set JPY price via a market-rate conversion at the time of purchase. |

---

## System Constraints

- **SC-01**: All class prices are authored by Teachers in JPY. Any ADA-denominated price displayed to the user must be a conversion from the canonical JPY price.
- **SC-02**: ADA payment confirmation uses pessimistic finality: a transaction is considered confirmed only after 10 on-chain confirmations.
- **SC-03**: No private key material for custodial wallets may be exposed to the client at any point.
- **SC-04**: The Stripe integration must be configured through the Japanese Stripe onboarding flow. Any regulatory or disclosure requirements imposed by that flow must be satisfied. `[ASSUMPTION: the specific regulatory requirements are handled at the Stripe account configuration level and do not impose additional in-app UI beyond standard Stripe checkout.]`
- **SC-05**: All UI related to the legacy "points" system must be fully removed. No migration or communication is required — the platform is not yet live and no user data exists for points.
- **SC-06**: All currently supported external wallets must function correctly for: purchasing classes with ADA, minting/receiving NFT certificates, and (for Teachers) minting and sending certificates to students.

---

## Features

### F-01: Class Pricing in ADA | MUST

**F-01.1: ADA price display (happy path)**
- **GIVEN** a Teacher has created a class with a price set in JPY
- **WHEN** a Student views the class listing or detail page
- **THEN** the system displays both the JPY price and a current ADA equivalent, clearly labeling that the ADA amount is a live conversion

**F-01.2: ADA price freshness**
- **GIVEN** a Student is viewing a class with a displayed ADA price
- **WHEN** the market rate changes while the student is on the page
- **THEN** the displayed ADA price reflects a reasonably current rate, and the student is informed if the rate changes significantly between page load and checkout initiation `[ASSUMPTION: "reasonably current" and "significantly" need operator-defined thresholds — e.g., refresh every 60s, alert on >5% drift]`

**F-01.3: ADA conversion unavailable (failure)**
- **GIVEN** the system cannot retrieve a current ADA/JPY exchange rate
- **WHEN** a Student views a class listing
- **THEN** the JPY price is displayed normally, the ADA price shows an unavailability notice, and the ADA payment path is temporarily disabled while the credit card path remains fully functional

---

### F-02: Purchase Class with ADA | MUST

**F-02.1: Successful ADA purchase (happy path)**
- **GIVEN** a Student with a connected external wallet containing sufficient ADA, viewing a class detail page
- **WHEN** the Student selects ADA payment and confirms the transaction in their wallet
- **THEN** the system displays a pending state indicating the transaction is awaiting confirmation, the Student cannot submit a duplicate payment for the same class, and the class is not yet accessible

**F-02.2: ADA transaction confirmed**
- **GIVEN** a Student has a pending ADA payment for a class
- **WHEN** the transaction reaches 10 on-chain confirmations
- **THEN** the system grants the Student access to the class, updates the student's purchase history, and displays a confirmation with the transaction reference

**F-02.3: ADA transaction rejected or timed out (failure)**
- **GIVEN** a Student has a pending ADA payment for a class
- **WHEN** the transaction fails on-chain or does not reach 10 confirmations within a defined timeout period
- **THEN** the system returns the student to a pre-purchase state for that class, displays a clear failure message with guidance to retry, and no access is granted `[ASSUMPTION: timeout threshold needs to be defined by the operator — e.g., 30 minutes]`

**F-02.4: Insufficient ADA (failure)**
- **GIVEN** a Student with a connected external wallet containing less ADA than the current class price
- **WHEN** the Student attempts to initiate an ADA payment
- **THEN** the transaction is not submitted, the Student sees a message indicating the shortfall, and the system suggests the credit card alternative

**F-02.5: No wallet connected (edge case)**
- **GIVEN** a Student without a connected external wallet
- **WHEN** the Student selects the ADA payment option
- **THEN** the system prompts the Student to connect a supported wallet before proceeding, and does not display the pending/confirmation flow until a wallet is connected

---

### F-03: Purchase Class with Credit Card (Stripe) | MUST

**F-03.1: Successful credit card purchase (happy path)**
- **GIVEN** a Student viewing a class detail page
- **WHEN** the Student selects credit card payment and completes the Stripe checkout flow
- **THEN** the system grants immediate access to the class, updates the Student's purchase history, and displays a confirmation with a payment receipt

**F-03.2: Credit card payment declined (failure)**
- **GIVEN** a Student in the Stripe checkout flow
- **WHEN** the payment is declined by the card issuer
- **THEN** the Student sees a clear error message from the checkout flow, no access is granted, and the Student can retry or switch to ADA payment

**F-03.3: Stripe checkout abandoned (edge case)**
- **GIVEN** a Student who has initiated but not completed the Stripe checkout flow
- **WHEN** the Student closes or navigates away from the checkout
- **THEN** no payment is processed, no access is granted, and the Student can re-initiate purchase from the class page

---

### F-04: Parallel Payment Path Presentation | MUST

**F-04.1: Both payment options visible**
- **GIVEN** a Student viewing any purchasable class
- **WHEN** the class detail or purchase UI is rendered
- **THEN** both the ADA payment option and the credit card payment option are clearly presented as parallel choices, with neither prioritized or hidden

**F-04.2: One path unavailable, other remains functional (degradation)**
- **GIVEN** a Student viewing a purchasable class and one payment method is temporarily unavailable (e.g., ADA conversion rate unavailable, or Stripe is down)
- **WHEN** the Student views the payment options
- **THEN** the unavailable method is visually disabled with an explanation, and the available method remains fully functional

---

### F-05: NFT Certificate Reward — Teacher Configuration | MUST

**F-05.1: Teacher enables NFT certificate (happy path)**
- **GIVEN** a Teacher creating or editing a class
- **WHEN** the Teacher enables the NFT certificate reward and provides the required certificate configuration
- **THEN** the system saves the NFT certificate as a completion reward for that class, and the class listing indicates to students that an NFT certificate is available upon completion `[ASSUMPTION: "required certificate configuration" — e.g., image, metadata — needs to be defined based on existing platform minting capabilities]`

**F-05.2: Teacher disables or does not set NFT certificate**
- **GIVEN** a Teacher creating or editing a class
- **WHEN** the Teacher does not enable an NFT certificate reward
- **THEN** no NFT-related UI is shown to students for that class upon completion

---

### F-06: Token Reward — Teacher Configuration | MUST

**F-06.1: Teacher enables token reward (happy path)**
- **GIVEN** a Teacher creating or editing a class
- **WHEN** the Teacher enables the token reward and specifies the reward amount
- **THEN** the system saves the token reward configuration for that class, and the class listing indicates to students that a token reward is available upon completion

**F-06.2: Teacher disables or does not set token reward**
- **GIVEN** a Teacher creating or editing a class
- **WHEN** the Teacher does not enable a token reward
- **THEN** no token-reward-related UI is shown to students for that class upon completion

---

### F-07: Combined Reward Configuration | MUST

**F-07.1: Teacher sets both NFT and token reward**
- **GIVEN** a Teacher creating or editing a class
- **WHEN** the Teacher enables both the NFT certificate and the token reward
- **THEN** both rewards are saved independently, the class listing reflects both, and both are distributed on the same completion trigger

---

### F-08: Student Receives NFT Certificate on Completion | MUST

**F-08.1: Automatic delivery to custodial wallet (happy path)**
- **GIVEN** a Student who completes a class that has an NFT certificate reward configured
- **WHEN** the platform's existing completion criteria are met
- **THEN** the NFT certificate is minted and delivered to the Student's custodial wallet, and the Student sees a notification or UI element confirming receipt

**F-08.2: Student has external wallet connected (variant)**
- **GIVEN** a Student with a connected external wallet who completes a class with an NFT certificate reward
- **WHEN** completion criteria are met
- **THEN** the NFT certificate is delivered to the non-custodial wallet

**F-08.3: Minting failure (failure)**
- **GIVEN** a Student who has met completion criteria for a class with an NFT certificate reward
- **WHEN** the minting or delivery transaction fails on-chain
- **THEN** the Student is informed that the reward is pending, the system retries or queues the delivery, and the Student's completion status is not reverted

---

### F-09: Student Receives Token Reward on Completion | MUST

**F-09.1: Automatic delivery to custodial wallet (happy path)**
- **GIVEN** a Student who completes a class that has a token reward configured
- **WHEN** the platform's existing completion criteria are met
- **THEN** the token reward is distributed to the Student's custodial wallet, and the Student sees a notification or UI element confirming the amount received

**F-09.2: Distribution failure (failure)**
- **GIVEN** a Student who has met completion criteria for a class with a token reward
- **WHEN** the on-chain distribution transaction fails
- **THEN** the Student is informed the reward is pending, the system retries or queues the distribution, and the Student's completion status is not reverted

---

### F-10: Teacher Mints and Sends Certificates | MUST

**F-10.1: Teacher sends certificate to completed student (happy path)**
- **GIVEN** a Teacher viewing a class roster showing students who have completed the class
- **WHEN** the Teacher initiates the mint-and-send action for a specific student
- **THEN** the NFT certificate is minted and sent to that Student's custodial wallet, and the Teacher sees confirmation of the successful transaction

**F-10.2: Teacher attempts to send to non-completed student (failure)**
- **GIVEN** a Teacher viewing a class roster
- **WHEN** the Teacher attempts to send a certificate to a Student who has not met completion criteria
- **THEN** the action is blocked, and the Teacher sees a message explaining the student has not completed the class

**F-10.3: Minting fails during teacher-initiated send (failure)**
- **GIVEN** a Teacher who has initiated a certificate send for a completed Student
- **WHEN** the on-chain minting or delivery transaction fails
- **THEN** the Teacher is informed of the failure with a clear message, the action can be retried, and no partial or invalid NFT is delivered

---

### F-11: Remove Legacy Points UI | MUST

**F-11.1: Points UI fully removed**
- **GIVEN** the platform UI in its current state, which contains references to a points system
- **WHEN** this milestone is deployed
- **THEN** no UI element referencing points, point balances, point earning, or point redemption remains visible to any Actor on any screen

---

### F-12: Wallet Flow Verification | MUST

**F-12.1: External wallet connects successfully**
- **GIVEN** a user (Student or Teacher) with a supported external browser wallet installed
- **WHEN** the user initiates wallet connection from the platform
- **THEN** the wallet connects, the platform displays the connected wallet address, and the user can proceed to wallet-dependent actions

**F-12.2: Unsupported wallet (failure)**
- **GIVEN** a user attempting to connect a wallet that is not in the supported set
- **WHEN** the connection is attempted
- **THEN** the user sees a clear message listing the supported wallets

**F-12.3: Wallet disconnects mid-session (edge case)**
- **GIVEN** a user with a connected external wallet in an active session
- **WHEN** the wallet is disconnected (browser extension disabled, user manually disconnects)
- **THEN** the platform detects the disconnection, disables wallet-dependent actions, and prompts the user to reconnect

---

## Open Questions

- **OQ-01**: What are the currently supported external wallets? The spec references them as a set but does not enumerate them.
- **OQ-02**: What thresholds define "reasonably current" for ADA price refresh and "significant" for price drift alerts? (See F-01.2)
- **OQ-03**: What is the timeout duration for an unconfirmed ADA transaction before it is treated as failed? (See F-02.3)
- **OQ-04**: Should students have the option to receive NFT certificates / token rewards to a connected external wallet instead of the custodial wallet? (See F-08.2)
- **OQ-05**: What is the required certificate configuration a teacher must provide when setting up an NFT reward? (See F-05.1)
- **OQ-06**: Is the Teacher's mint-and-send action (F-10) a manual override in addition to the automatic delivery on completion (F-08), or is it the only delivery mechanism?

## Assumptions

- **A-01**: (SC-04) Japan-specific Stripe compliance is handled at the account configuration level and does not introduce additional in-app UI beyond standard Stripe checkout components.
- **A-02**: (F-01.2) ADA price refresh interval and drift threshold need operator-defined values.
- **A-03**: (F-02.3) ADA transaction timeout threshold needs operator-defined value.
- **A-04**: (F-08.2) All on-chain rewards are delivered to the custodial wallet by default, regardless of whether an external wallet is connected.
- **A-05**: (F-05.1) The specific metadata and assets required from a Teacher to configure an NFT certificate depend on the existing platform minting capabilities and are not defined here.
