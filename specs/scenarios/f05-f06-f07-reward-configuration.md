# Test Scenarios: F-05, F-06, F-07 — Reward Configuration (Teacher)

**Source spec:** specs/milestone-4-spec.md
**Scope:** F-05 (NFT Certificate — Teacher Configuration), F-06 (Token Reward — Teacher Configuration), F-07 (Combined Reward Configuration)
**Generated:** 2026-02-19
**Status:** CONFIRMED — assumptions resolved, ready for implementation

---

## Prerequisites

Conditions that must be true before any scenario in this set can run:

- The platform is deployed and accessible
- [Teacher_A] is a registered Teacher with permission to create and edit classes
- [Teacher_B] is a separate registered Teacher with permission to create and edit classes
- [Class_Alpha] is a class owned by [Teacher_A] (either in creation or already saved, as specified per scenario)
- [Class_Beta] is a class owned by [Teacher_B]
- [Teacher_A] is authenticated as their own account when performing actions on [Class_Alpha]
- [Teacher_B] is authenticated as their own account when performing actions on [Class_Beta]
- No completion rewards have been pre-configured on any class unless explicitly stated in a scenario's GIVEN

### Deferred scope (not covered here)

The following behaviors are stated in F-05.1, F-06.1, and F-07.1 but are deferred to the F-08/F-09 test scenario set:

- Student-visible reward indicators on class listing and detail pages
- The student experience when a reward is enabled vs. disabled

---

## F-05: NFT Certificate Reward — Teacher Configuration

> **Clarification applied:** The NFT certificate is enabled by default on every new class. The default configuration uses the class name and Teacher's name in the certificate fields, and a default image. The Teacher may customize any of these or explicitly disable the certificate. (Resolves OQ-05 and A-05 from the spec.)

---

### TS-05.01: New class form shows NFT certificate enabled by default

**Traces to:** F-05.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] has opened the class creation form for a new class [Class_Alpha]

**WHEN:**
- [Teacher_A] views the NFT certificate section of the creation form without making any changes

**THEN:**
- The NFT certificate toggle is in the enabled state

---

### TS-05.02: Default certificate configuration reflects class name and teacher name

**Traces to:** F-05.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha] and has entered a class name (e.g., "Introduction to Cardano")

**WHEN:**
- [Teacher_A] views the NFT certificate configuration fields without having made any manual changes to them

**THEN:**
- The certificate name/title field is pre-populated with a value derived from the class name "Introduction to Cardano"
- The teacher attribution field is pre-populated with [Teacher_A]'s name
- A default certificate image is pre-populated in the image field

**NOTES:** This scenario validates the operator-provided clarification that defaults exist. The exact derivation logic (e.g., "Introduction to Cardano" → certificate title verbatim vs. transformed) is an implementation decision for the downstream agent, not a behavioral assertion here.

---

### TS-05.03: Saving a class with default NFT certificate persists the reward

**Traces to:** F-05.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] has filled in [Class_Alpha]'s required fields and has not changed any NFT certificate defaults

**WHEN:**
- [Teacher_A] saves [Class_Alpha]

**THEN:**
- The system confirms the class has been saved
- When [Teacher_A] reopens [Class_Alpha] for editing, the NFT certificate toggle is still in the enabled state and the default configuration values are present

---

### TS-05.04: Teacher customizes NFT certificate name and image and saves

**Traces to:** F-05.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha] with the NFT certificate in its default enabled state

**WHEN:**
- [Teacher_A] replaces the certificate name with a custom value "My Custom Certificate"
- [Teacher_A] replaces the default image with a custom uploaded image
- [Teacher_A] saves the class

**THEN:**
- The system confirms the class has been saved
- When [Teacher_A] reopens [Class_Alpha] for editing, the certificate name field shows "My Custom Certificate" and the custom image is displayed — not the defaults

---

### TS-05.05: Custom certificate name with default image is saved correctly

**Traces to:** F-05.1
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha] with the NFT certificate in its default enabled state

**WHEN:**
- [Teacher_A] changes only the certificate name (leaves the image as the default)
- [Teacher_A] saves the class

**THEN:**
- When [Teacher_A] reopens [Class_Alpha] for editing, the certificate name shows the custom value and the default image is still present

---

### TS-05.06: Teacher explicitly disables NFT certificate on a new class

**Traces to:** F-05.2
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha] and the NFT certificate is enabled by default

**WHEN:**
- [Teacher_A] toggles the NFT certificate off
- [Teacher_A] saves the class

**THEN:**
- The system confirms the class has been saved
- When [Teacher_A] reopens [Class_Alpha] for editing, the NFT certificate toggle is in the disabled state

---

### TS-05.07: Teacher re-enables a previously disabled NFT certificate

**Traces to:** F-05.1, F-05.2
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- [Teacher_A] has an existing [Class_Alpha] where the NFT certificate was explicitly disabled and saved

**WHEN:**
- [Teacher_A] edits [Class_Alpha] and toggles the NFT certificate back on
- [Teacher_A] saves the class

**THEN:**
- The system confirms the class has been saved
- When [Teacher_A] reopens [Class_Alpha] for editing, the NFT certificate toggle is in the enabled state

---

### TS-05.08: Teacher edits an existing class and changes the NFT certificate name

**Traces to:** F-05.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] has an existing [Class_Alpha] with a default NFT certificate configured and saved

**WHEN:**
- [Teacher_A] edits [Class_Alpha] and changes the certificate name to "Updated Certificate Name"
- [Teacher_A] saves the class

**THEN:**
- When [Teacher_A] reopens [Class_Alpha] for editing, the certificate name field shows "Updated Certificate Name"

---

### TS-05.09: Teacher clears the certificate name field — system requires a non-empty value

**Traces to:** F-05.1
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha] with the NFT certificate enabled

**WHEN:**
- [Teacher_A] clears the certificate name field leaving it empty
- [Teacher_A] attempts to save the class

**THEN:**
- The system does not save the class
- [Teacher_A] sees an error or validation message indicating that the certificate name is required
- [Teacher_A] remains on the class form with all other field values intact

**NOTES:** The certificate name is pre-populated by default. Clearing it and attempting to save is a validation error — the system must not silently revert to the default.

---

### TS-05.10: Teacher_A cannot configure NFT certificate on Teacher_B's class

**Traces to:** IMPLICIT — no direct spec scenario
**Category:** CONSTRAINT VALIDATION
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_B] owns [Class_Beta] with a default NFT certificate configuration
- [Teacher_A] is authenticated as their own account

**WHEN:**
- [Teacher_A] attempts to access the reward configuration for [Class_Beta]

**THEN:**
- [Teacher_A] is denied access and cannot view or modify [Class_Beta]'s NFT certificate configuration
- The NFT certificate configuration for [Class_Beta] remains unchanged

---

## F-06: Token Reward — Teacher Configuration

> **Behavior note:** Unlike the NFT certificate (which is ON by default), the token reward is OFF by default. The Teacher must actively enable it and supply an amount.

---

### TS-06.01: New class form shows token reward disabled by default

**Traces to:** F-06.2
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] has opened the class creation form for a new class [Class_Alpha]

**WHEN:**
- [Teacher_A] views the token reward section of the creation form without making any changes

**THEN:**
- The token reward toggle is in the disabled state and no reward amount is pre-populated

---

### TS-06.02: Teacher enables token reward with a valid positive amount and saves

**Traces to:** F-06.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha] with the token reward in its default disabled state

**WHEN:**
- [Teacher_A] toggles the token reward on
- [Teacher_A] enters a valid positive amount (e.g., 100)
- [Teacher_A] saves the class

**THEN:**
- The system confirms the class has been saved
- When [Teacher_A] reopens [Class_Alpha] for editing, the token reward toggle is enabled and the amount field shows 100

---

### TS-06.03: Saving a class without enabling token reward — no reward is configured

**Traces to:** F-06.2
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha] and has not toggled the token reward on

**WHEN:**
- [Teacher_A] saves the class

**THEN:**
- The system confirms the class has been saved
- When [Teacher_A] reopens [Class_Alpha] for editing, the token reward toggle is in the disabled state

---

### TS-06.04: Teacher enables token reward then disables it before saving — no reward is saved

**Traces to:** F-06.2
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha] and has toggled the token reward on with an amount of 50

**WHEN:**
- [Teacher_A] toggles the token reward back off (without saving yet)
- [Teacher_A] saves the class

**THEN:**
- When [Teacher_A] reopens [Class_Alpha] for editing, the token reward toggle is in the disabled state and no amount is shown

---

### TS-06.05: Teacher attempts to save with token reward enabled but no amount entered

**Traces to:** F-06.1
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha] and has toggled the token reward on

**WHEN:**
- [Teacher_A] leaves the reward amount field empty
- [Teacher_A] attempts to save the class

**THEN:**
- The system does not save the class
- [Teacher_A] sees an error or validation message indicating that a reward amount is required
- [Teacher_A] remains on the class form with the token reward toggle still in the enabled state

---

### TS-06.06: Teacher sets token reward amount to zero — system rejects it

**Traces to:** F-06.1
**Category:** BOUNDARY
**Criticality:** MEDIUM

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha] and has toggled the token reward on

**WHEN:**
- [Teacher_A] enters 0 as the reward amount
- [Teacher_A] attempts to save the class

**THEN:**
- The system does not save the class
- [Teacher_A] sees a message indicating the reward amount must be greater than zero

**NOTES:** Zero is a validation error — the system must not treat it as equivalent to disabling the reward.

---

### TS-06.07: Teacher edits existing class and increases the token reward amount

**Traces to:** F-06.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] has an existing [Class_Alpha] with a token reward of 100 saved

**WHEN:**
- [Teacher_A] edits [Class_Alpha] and changes the reward amount to 200
- [Teacher_A] saves the class

**THEN:**
- When [Teacher_A] reopens [Class_Alpha] for editing, the token reward amount field shows 200

---

### TS-06.08: Teacher edits existing class and disables a previously configured token reward

**Traces to:** F-06.2
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] has an existing [Class_Alpha] with a token reward of 100 saved

**WHEN:**
- [Teacher_A] edits [Class_Alpha] and toggles the token reward off
- [Teacher_A] saves the class

**THEN:**
- When [Teacher_A] reopens [Class_Alpha] for editing, the token reward toggle is in the disabled state

---

### TS-06.09: Teacher_A cannot configure token reward on Teacher_B's class

**Traces to:** IMPLICIT — no direct spec scenario
**Category:** CONSTRAINT VALIDATION
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_B] owns [Class_Beta] with a token reward of 50 configured
- [Teacher_A] is authenticated as their own account

**WHEN:**
- [Teacher_A] attempts to access the reward configuration for [Class_Beta]

**THEN:**
- [Teacher_A] is denied access and cannot view or modify [Class_Beta]'s token reward configuration
- The token reward configuration for [Class_Beta] remains unchanged

---

## F-07: Combined Reward Configuration

---

### TS-07.01: Teacher saves a class with both NFT certificate and token reward enabled

**Traces to:** F-07.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha]
- The NFT certificate is enabled with default configuration
- [Teacher_A] has also toggled the token reward on with an amount of 75

**WHEN:**
- [Teacher_A] saves [Class_Alpha]

**THEN:**
- The system confirms the class has been saved
- When [Teacher_A] reopens [Class_Alpha] for editing, the NFT certificate toggle is enabled and the token reward toggle is enabled with an amount of 75

---

### TS-07.02: Changing the NFT certificate configuration does not affect the token reward

**Traces to:** F-07.1
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] has an existing [Class_Alpha] with both an NFT certificate (custom name "Cert A") and a token reward of 75 configured and saved

**WHEN:**
- [Teacher_A] edits [Class_Alpha] and changes only the NFT certificate name to "Cert B"
- [Teacher_A] saves the class

**THEN:**
- When [Teacher_A] reopens [Class_Alpha] for editing, the NFT certificate name shows "Cert B" AND the token reward amount still shows 75, unchanged

---

### TS-07.03: Changing the token reward amount does not affect the NFT certificate

**Traces to:** F-07.1
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] has an existing [Class_Alpha] with both an NFT certificate (custom name "Cert A") and a token reward of 75 configured and saved

**WHEN:**
- [Teacher_A] edits [Class_Alpha] and changes only the token reward amount to 150
- [Teacher_A] saves the class

**THEN:**
- When [Teacher_A] reopens [Class_Alpha] for editing, the token reward amount shows 150 AND the NFT certificate name still shows "Cert A", unchanged

---

### TS-07.04: Teacher disables NFT certificate while token reward remains active

**Traces to:** F-07.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] has an existing [Class_Alpha] with both rewards configured (NFT certificate enabled, token reward of 75)

**WHEN:**
- [Teacher_A] edits [Class_Alpha], toggles the NFT certificate off, and saves

**THEN:**
- When [Teacher_A] reopens [Class_Alpha] for editing, the NFT certificate toggle is in the disabled state AND the token reward toggle is still enabled with an amount of 75

---

### TS-07.05: Teacher disables token reward while NFT certificate remains active

**Traces to:** F-07.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] has an existing [Class_Alpha] with both rewards configured (NFT certificate enabled, token reward of 75)

**WHEN:**
- [Teacher_A] edits [Class_Alpha], toggles the token reward off, and saves

**THEN:**
- When [Teacher_A] reopens [Class_Alpha] for editing, the token reward toggle is in the disabled state AND the NFT certificate toggle is still enabled with its configuration intact

---

### TS-07.06: Teacher disables both rewards in a single edit

**Traces to:** F-07.1
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- [Teacher_A] has an existing [Class_Alpha] with both rewards configured

**WHEN:**
- [Teacher_A] edits [Class_Alpha], toggles the NFT certificate off, toggles the token reward off, and saves

**THEN:**
- When [Teacher_A] reopens [Class_Alpha] for editing, both the NFT certificate toggle and the token reward toggle are in the disabled state

---

### TS-07.07: Teacher attempts to save with both rewards enabled but token amount missing

**Traces to:** F-07.1
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is creating [Class_Alpha]
- The NFT certificate is enabled with its default configuration
- [Teacher_A] has toggled the token reward on but left the amount field empty

**WHEN:**
- [Teacher_A] attempts to save the class

**THEN:**
- The system does not save the class
- [Teacher_A] sees a validation error for the missing token reward amount
- The NFT certificate toggle remains in the enabled state (the partial form state is not reset)

---

## Coverage Summary

**F-05.1** — TS-05.01, TS-05.02, TS-05.03, TS-05.04, TS-05.05, TS-05.07, TS-05.08, TS-05.09 (Happy Path, Edge Case, Failure)
**F-05.2** — TS-05.06, TS-05.07 (Happy Path, Edge Case)
**(implicit)** — TS-05.10 (Constraint Validation)
**F-06.1** — TS-06.02, TS-06.05, TS-06.06, TS-06.07 (Happy Path, Failure, Boundary)
**F-06.2** — TS-06.01, TS-06.03, TS-06.04, TS-06.08 (Happy Path, Edge Case)
**(implicit)** — TS-06.09 (Constraint Validation)
**F-07.1** — TS-07.01, TS-07.02, TS-07.03, TS-07.04, TS-07.05, TS-07.06, TS-07.07 (Happy Path, Edge Case, Failure)

**Total spec scenarios in scope:** 5
**Total test scenarios generated:** 26
**Expansion ratio:** 26/5 (5.2×)

### Gaps

- **Student-visible reward indicators** (F-05.1, F-06.1, F-07.1 all state "the class listing indicates to students that a reward is available"): Deferred to F-08/F-09 scenario set per operator instruction.
- **Editing rewards after students have enrolled or completed the class**: The spec does not address this state transition (e.g., disabling a reward on a class that already has completions pending delivery). Flagged as out of spec scope; recommend a follow-up spec scenario.
- **OQ-06 intersection**: Whether Teacher mint-and-send (F-10) is a manual override of automatic delivery (F-08) or the sole delivery mechanism affects F-05 configuration semantics, but has no impact on the configuration scenarios here. No gap in this set.
