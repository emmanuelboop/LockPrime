# LockPrime — System Architecture

## 1. Purpose

This document describes the technical architecture and architectural direction of LockPrime.

LockPrime is a financial savings application designed to help users save money by locking funds inside savings vaults for a user-selected period of time.

The current application is an MVP/prototype. Vault balances and transactions are currently represented using database records. No real money is currently transferred.

The long-term goal is to support real deposits and withdrawals through appropriate Canadian payment infrastructure while maintaining strict vault-locking rules.

This document describes both:

1. The current implemented architecture.
2. The intended direction of the architecture as LockPrime grows.

The actual codebase remains the source of truth. AI coding assistants must inspect the current implementation before assuming that this document reflects every implementation detail.

---

# 2. Repository Architecture

LockPrime is organized as a multi-application project.

Current top-level structure:

LockPrime/
│
├── locked-vault-client/
│   └── React frontend
│
├── locked-vault-server/
│   └── Node.js / Express backend
│
├── payments/
│   └── Reserved for future payment-related architecture
│
├── notifications/
│   └── Reserved for future notification functionality
│
├── shared/
│   └── Reserved for code or definitions shared across applications
│
├── docs/
│   └── Additional technical and product documentation
│
├── PROJECT_VISION.md
└── ARCHITECTURE.md

The frontend and backend are separate sibling applications.

The `payments`, `notifications`, and `shared` directories represent architectural boundaries for future growth.

They should not contain unnecessary code simply because the directories exist.

New services should only be introduced when application complexity justifies separating them.

---

# 3. Current High-Level Architecture

The currently implemented application follows a client-server architecture.

User
↓
React Frontend
↓
Axios API Client
↓
HTTP / REST API
↓
Express Backend
↓
Authentication Middleware
↓
Controllers
↓
Service Layer
↓
Prisma ORM
↓
PostgreSQL

Current technologies:

## Frontend

- React
- Vite
- JavaScript / JSX
- Tailwind CSS
- shadcn/ui
- Axios
- React Router

## Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT authentication

The frontend and backend communicate through HTTP API requests.

---

# 4. Architectural Principles

LockPrime should follow these core architectural principles.

## Backend Is Authoritative

The frontend must never be trusted to enforce security-critical or financial rules.

The backend is responsible for:

- Authentication
- Authorization
- Vault ownership
- Lock enforcement
- Balance validation
- Deposit validation
- Withdrawal validation
- Transaction integrity

Frontend restrictions exist primarily for user experience.

For example, disabling a Withdraw button on a locked vault improves UX, but the backend must independently reject the withdrawal.

## Users Must Be Isolated

Every user-owned resource must be authorized using the authenticated user's identity.

Knowing a resource ID must never grant access to that resource.

## Financial Operations Must Be Atomic

Operations that change balances and create transaction records should occur inside database transactions.

## Real Money Must Not Be Simulated as Database Updates

The current MVP uses simulated balances.

Future real-money functionality must rely on confirmed payment events and proper financial infrastructure.

---

# 5. Frontend Application

Location:

locked-vault-client/

The frontend is responsible for presenting the LockPrime user experience.

Primary responsibilities:

- User registration
- User login
- Client-side authenticated navigation
- Displaying vaults
- Creating vaults
- Initiating deposits
- Initiating withdrawals
- Displaying transaction history
- Displaying lock status
- Providing loading, success, and error feedback

The frontend must not be treated as a trusted environment.

Users can modify browser code, localStorage, API requests, and frontend state.

All important rules must therefore be revalidated by the backend.

---

# 6. Frontend Structure

The frontend is organized approximately as:

locked-vault-client/
│
├── src/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── package.json
└── vite.config.js

The exact implementation should always be inspected before making architectural assumptions.

---

# 7. Frontend Pages

Important frontend pages include:

## Landing Page

Provides the public introduction to LockPrime.

Future responsibilities may include:

- Product explanation
- Benefits of locked savings
- Calls to action
- Registration navigation
- Login navigation

## Register Page

Allows users to create a LockPrime account.

Expected flow:

RegisterPage
↓
POST /api/auth/register
↓
Backend validates request
↓
User created
↓
Navigate to Login

## Login Page

Authenticates an existing user.

Expected flow:

LoginPage
↓
POST /api/auth/login
↓
Backend verifies credentials
↓
JWT returned
↓
Token stored on client
↓
Navigate to Dashboard

## Dashboard Page

Acts as the main authenticated application interface.

Responsibilities include:

- Loading authenticated user's vaults
- Displaying vault cards
- Opening vault details
- Creating vaults
- Refreshing vault state after mutations

---

# 8. Frontend Authentication

Authentication currently uses JWT.

Expected flow:

Login
↓
Backend issues JWT
↓
Frontend stores token
↓
Axios attaches token
↓
Backend verifies token

The frontend may use a `ProtectedRoute` component to prevent unauthenticated navigation to pages such as `/dashboard`.

A frontend route guard is not a security boundary.

Protected backend endpoints must still independently verify the JWT.

Future authentication improvements may include:

- Expired-token handling
- Invalid-token handling
- Automatic logout
- Centralized 401 handling
- More secure token storage strategies
- Refresh-token architecture if required

These improvements should be introduced deliberately rather than added prematurely.

---

# 9. Frontend API Layer

Frontend API communication should primarily go through:

locked-vault-client/src/services/

The configured Axios instance should be centralized.

Example:

services/
├── api.js
├── vaultService.js
└── transactionService.js

## api.js

Responsibilities:

- Backend base URL
- Shared Axios configuration
- JWT Authorization header
- Future centralized response/error handling

## vaultService.js

Handles vault-related API calls.

Possible responsibilities:

- getVaults()
- createVault()
- depositMoney()
- withdrawMoney()

## transactionService.js

Handles transaction-related requests.

Current example:

- getTransactions(vaultId)

As the application grows, services may be reorganized by domain.

---

# 10. Backend Application

Location:

locked-vault-server/

The backend is responsible for the authoritative application and business logic.

Current high-level request flow:

HTTP Request
↓
Express Route
↓
Authentication Middleware
↓
Controller
↓
Service
↓
Prisma
↓
PostgreSQL

The backend should remain responsible for security-critical decisions.

---

# 11. Backend Structure

The backend is organized approximately as:

locked-vault-server/
│
├── config/
│   └── prisma.js
│
├── controllers/
│   ├── authController.js
│   └── vaultController.js
│
├── middleware/
│   └── authMiddleware.js
│
├── routes/
│   ├── authRoutes.js
│   └── vaultRoutes.js
│
├── services/
│   └── vaultService.js
│
├── prisma/
│   └── schema.prisma
│
├── server.js
└── package.json

The actual repository should always be inspected before modifying these layers.

---

# 12. Backend Layer Responsibilities

## Routes

Routes define API endpoints.

Routes should:

- Define endpoint paths
- Apply middleware
- Connect requests to controllers

Routes should contain minimal business logic.

## Authentication Middleware

Authentication middleware should:

1. Read the Authorization header.
2. Extract the JWT.
3. Verify the JWT.
4. Determine the authenticated user.
5. Attach authenticated identity to the request.

Downstream code should use the authenticated identity instead of trusting user identity supplied by the frontend.

## Controllers

Controllers handle HTTP-specific concerns.

Controllers should:

- Read request parameters
- Read request bodies
- Read authenticated user identity
- Call services
- Return responses
- Pass or handle errors appropriately

Controllers should not contain complex financial business logic.

## Services

Services contain business rules.

The vault service currently handles major vault operations.

Examples:

- Create vault
- Retrieve vaults
- Deposit money
- Withdraw money
- Retrieve transactions

Business rules should be centralized rather than duplicated across controllers.

---

# 13. Authentication and Authorization

Authentication answers:

"Who is making this request?"

Authorization answers:

"Is this user allowed to perform this operation?"

These must remain separate concepts.

Example request:

POST /api/vaults/123/withdraw

Authentication verifies the JWT.

Authorization must then verify:

vault.id = 123

AND

vault.userId = authenticatedUserId

This ownership validation applies to:

- Viewing vaults
- Depositing
- Withdrawing
- Viewing transactions
- Future vault updates
- Future vault deletion

The backend should derive the authenticated user's identity from the verified JWT.

It should not trust:

- userId from request body
- userId from localStorage
- userId supplied by frontend components

---

# 14. Database

LockPrime currently uses PostgreSQL through Prisma ORM.

Primary domain entities currently include:

User
↓
Vault
↓
Transaction

Relationships:

User
1 → many
Vault

Vault
1 → many
Transaction

---

# 15. User Model

The User represents an authenticated LockPrime account.

A user may own multiple vaults.

User credentials must be handled securely.

Passwords must never be stored in plaintext.

Authentication-related data should not be unnecessarily returned to the frontend.

---

# 16. Vault Model

A Vault represents a locked savings container.

Important conceptual fields include:

- id
- name
- balance
- unlockDate
- userId

The vault belongs to one user.

The vault may contain many transactions.

The backend must enforce vault ownership for every vault-specific operation.

---

# 17. Transaction Model

A Transaction records financial activity associated with a vault.

Current transaction types include:

- deposit
- withdrawal

Conceptual transaction information includes:

- id
- vaultId
- amount
- type
- createdAt

Current transaction records represent simulated financial activity.

The transaction architecture will need to evolve before handling real money.

---

# 18. Vault Creation Flow

Current conceptual flow:

User creates vault
↓
Frontend submits vault data
↓
POST /api/vaults
↓
JWT verified
↓
Authenticated user identified
↓
Controller calls vault service
↓
Service calculates unlock date
↓
Vault created in PostgreSQL
↓
Vault returned
↓
Frontend refreshes vault list

The backend must determine vault ownership using the authenticated user.

---

# 19. Deposit Flow

Current MVP deposit flow:

User enters deposit amount
↓
Frontend sends deposit request
↓
Backend authenticates user
↓
Backend verifies vault ownership
↓
Database transaction begins
↓
Vault balance increases
↓
Deposit transaction created
↓
Database transaction commits
↓
Updated state returned

The balance update and transaction creation should succeed or fail together.

Deposits are currently simulated.

No actual funds enter LockPrime.

---

# 20. Withdrawal Flow

Current withdrawal flow:

User selects Withdraw
↓
Frontend checks lock state for UX
↓
Backend receives withdrawal request
↓
Backend authenticates user
↓
Backend verifies vault ownership
↓
Backend verifies unlock date
↓
Backend verifies sufficient balance
↓
Database transaction begins
↓
Vault balance decreases
↓
Withdrawal transaction created
↓
Database transaction commits

The backend lock check is authoritative.

A malicious or modified frontend must not be able to bypass vault locking.

---

# 21. Vault Locking

Every vault has an unlock timestamp.

Conceptual backend rule:

Current Time < Unlock Date
→ Withdrawal Rejected

Current Time >= Unlock Date
→ Withdrawal May Proceed

Additional withdrawal requirements still apply, such as sufficient balance and ownership.

The frontend may disable the Withdraw button when:

new Date() < new Date(vault.unlockDate)

This improves UX but does not provide security.

---

# 22. Transaction History

Users can view transaction history associated with their vaults.

Conceptual flow:

Open Vault
↓
Request Transactions
↓
Backend authenticates user
↓
Backend verifies vault ownership
↓
Transactions retrieved
↓
Newest transactions returned first
↓
Frontend displays history

As transaction volume grows, this should eventually support:

- Pagination
- Filtering
- Transaction statuses
- Dedicated transaction views

---

# 23. Financial Amount Handling

Financial amount handling is a high-priority architectural concern.

Floating-point values should not be relied upon for production financial calculations.

Before real-money integration, LockPrime should adopt a deliberate money representation.

Possible approaches include:

## Integer Minor Units

Example:

$10.25 CAD

stored as:

1025 cents

This avoids common floating-point rounding problems.

## Fixed-Precision Decimal

An appropriate PostgreSQL/Prisma Decimal representation may also be considered.

The chosen approach should be applied consistently across:

- Database
- Backend
- API
- Payment integrations

This decision must be made before production real-money functionality.

---

# 24. Financial Data Integrity

Balance-changing operations must preserve consistency.

A deposit should never result in:

Balance updated
Transaction missing

A withdrawal should never result in:

Transaction created
Balance unchanged

Database transactions should ensure that related operations succeed or fail together.

Financial operations should eventually also protect against:

- Duplicate requests
- Concurrent withdrawals
- Replay attacks
- Partial failures
- Negative balances

---

# 25. Payments Domain

Location:

```
payments/
├── config.js
├── constants.js
├── events/normalizedProviderEvents.js
├── providers/
│   ├── PaymentProvider.js      # adapter contract
│   ├── registry.js
│   └── simulatedProvider.js    # default dev/test provider
└── services/
    ├── ledgerService.js
    ├── paymentOrchestrationService.js
    ├── webhookService.js
    └── reconciliationService.js  # stub
```

The payments domain is provider-independent. Vault rules remain in `services/vaultService.js`; all money movement flows through `paymentOrchestrationService.js`.

**Default provider:** `PAYMENT_PROVIDER=simulated` (instant settle for dev/tests).

**Deposit/withdraw API response shape (always):**

```json
{
  "vault": { "...": "..." },
  "payment": { "id": "...", "status": "...", "direction": "DEPOSIT|WITHDRAWAL" }
}
```

**Webhook endpoint:** `POST /api/webhooks/payments/:provider` (501 for simulated).

Real provider adapters (Cybrid, VoPay, Flinks, etc.) plug into `payments/providers/registry.js` without changing vault logic.

---

# 26. Future Real-Money Flow

A future real-money deposit should conceptually resemble:

User Requests Deposit
↓
LockPrime Backend
↓
Payment Provider
↓
Payment Pending
↓
Provider Processes Payment
↓
Verified Provider Confirmation
↓
LockPrime Records Confirmed Financial Event
↓
Vault Funds Become Available

The frontend submitting a deposit request must never be enough to increase a real-money balance.

A real withdrawal may resemble:

User Requests Withdrawal
↓
Authenticate User
↓
Verify Vault Ownership
↓
Verify Vault Is Unlocked
↓
Verify Available Funds
↓
Create Withdrawal Request
↓
Payment Provider Processes Transfer
↓
Receive Verified Result
↓
Update Financial Records

Exact behavior depends on the future provider and regulatory architecture.

---

# 27. Future Transaction Statuses

Real-money transactions will likely require statuses.

Examples:

PENDING
PROCESSING
COMPLETED
FAILED
REVERSED
CANCELLED

The current simple `deposit` and `withdrawal` transaction types are not sufficient to model the entire lifecycle of real payments.

Transaction type and transaction status should remain separate concepts.

Example:

type = WITHDRAWAL

status = PENDING

---

# 28. Ledger Architecture

LockPrime uses an **append-only signed ledger** (`LedgerEntry`) that can evolve into full double-entry accounting later. It is **not** full double-entry today.

**Account types (per vault):**

| Account | Meaning |
|---|---|
| `AVAILABLE` | Spendable balance; mirrored by `Vault.balance` |
| `WITHDRAWAL_PENDING` | Reserved during pending withdrawals |

**Invariant:**

```
Vault.balance === SUM(LedgerEntry.amount WHERE accountType = 'AVAILABLE')
```

**Withdrawal reservation (no `Vault.reservedBalance` column):**

1. Initiate: paired entries move funds `AVAILABLE → WITHDRAWAL_PENDING`; `Vault.balance` decreases immediately.
2. Settle: clear `WITHDRAWAL_PENDING` only.
3. Fail: compensating entries move funds back to `AVAILABLE`.

**Migration backfill:** existing vaults received one `OPENING_BALANCE` ledger entry on `AVAILABLE` equal to their pre-migration `Vault.balance`. Pre-ledger history remains in `Transaction`.

All monetary values use `Decimal` (Prisma), not JavaScript floating-point arithmetic.

---

# 29. Concurrency

Financial operations must eventually account for multiple requests occurring simultaneously.

Example:

Vault Balance = $100

Request A withdraws $80
Request B withdraws $80

Both requests must not independently read $100 and both succeed.

Future protections may include:

- Atomic database operations
- Database transactions
- Appropriate isolation levels
- Row locking
- Optimistic concurrency
- Ledger constraints

The specific strategy should be chosen based on the final financial architecture.

---

# 30. Idempotency

Real payment operations should eventually support idempotency.

If the same deposit or withdrawal request is submitted twice because of:

- Network retries
- Browser retries
- Provider retries
- Duplicate webhook delivery

LockPrime must avoid processing the financial event twice.

Future architecture may use:

- Idempotency keys
- Unique provider transaction IDs
- Unique database constraints
- Processed webhook event records

---

# 31. Notifications Domain

Location:

notifications/

This directory is reserved for future notification functionality.

Possible responsibilities:

- Vault unlocked notifications
- Deposit confirmation
- Withdrawal confirmation
- Failed transaction alerts
- Security notifications
- Email notifications
- Push notifications

Notifications should respond to confirmed application events.

For example:

Payment Confirmed
↓
Financial State Updated
↓
Notification Triggered

A notification should not determine whether a financial transaction succeeded.

---

# 32. Shared Domain

Location:

shared/

This directory is reserved for code or definitions genuinely shared between multiple parts of LockPrime.

Potential future uses:

- Shared constants
- Transaction types
- Validation schemas
- Shared API types
- Domain event definitions

Avoid turning `shared/` into a miscellaneous utility directory.

Code should only move into `shared/` when multiple applications genuinely need it.

---

# 33. Documentation

Location:

docs/

This directory contains additional technical documentation.

Possible future documents include:

docs/
├── AUTHENTICATION.md
├── VAULT_RULES.md
├── PAYMENTS.md
├── DATABASE.md
├── API.md
└── SECURITY.md

Not all documents need to exist immediately.

Documentation should be introduced as architectural complexity increases.

The two primary project-level documents are:

PROJECT_VISION.md
ARCHITECTURE.md

`PROJECT_VISION.md` explains what LockPrime is trying to become.

`ARCHITECTURE.md` explains how the system is structured and the architectural principles guiding development.

---

# 34. Error Handling

Current error handling may be relatively simple.

As LockPrime grows, the backend should move toward consistent error handling.

Possible architecture:

Service
↓
Typed/Application Error
↓
Controller/Error Middleware
↓
Consistent API Response

Common HTTP status categories:

400 — Invalid input

401 — Authentication required

403 — Operation not permitted

404 — Resource not found

409 — State conflict

500 — Unexpected server failure

Financial business errors should not automatically become generic HTTP 500 errors.

Examples:

Vault still locked

Insufficient funds

Invalid amount

These are expected business conditions and should return appropriate responses.

---

# 35. Testing Architecture

Automated testing should become increasingly important as LockPrime grows.

High-priority areas:

## Authentication

- Registration
- Login
- Missing token rejection
- Invalid token rejection
- Expired token behavior

## Authorization

- User cannot access another user's vault
- User cannot deposit into another user's vault
- User cannot withdraw from another user's vault
- User cannot view another user's transactions

## Vault Locking

- Locked vault rejects withdrawal
- Unlocked vault allows valid withdrawal

## Financial Validation

- Zero deposit rejected
- Negative deposit rejected
- Invalid amount rejected
- Zero withdrawal rejected
- Negative withdrawal rejected
- Excessive withdrawal rejected

## Transaction Integrity

- Deposit changes balance and records transaction
- Withdrawal changes balance and records transaction
- Failed operations do not partially update data

## Concurrency

- Simultaneous withdrawals cannot create negative balances

Tests for authentication and financial business rules should be prioritized before real payment integration.

---

# 36. Deployment Architecture

The frontend and backend should remain independently deployable.

Conceptually:

Frontend Hosting
↓
HTTPS
↓
Backend API
↓
Managed PostgreSQL

Future infrastructure may additionally include:

Payment Providers
Notification Providers
Background Workers
Job Queues
Monitoring
Logging

Infrastructure complexity should be introduced only when required.

Do not prematurely convert the application into microservices.

A modular monolith or clearly separated frontend/backend architecture is appropriate for the current stage.

---

# 37. Evolution Strategy

LockPrime should evolve incrementally.

Current:

React Frontend
+
Express Backend
+
PostgreSQL

Near future:

Stronger Auth
+
Financial Validation
+
Testing
+
Improved Error Handling

Later:

Payment Integration
+
Ledger
+
Idempotency
+
Reconciliation
+
Notifications

Potential future scale:

Background Workers
+
Queues
+
Monitoring
+
Specialized Services

Do not introduce distributed-system complexity before it provides a clear benefit.

---

# 38. AI Coding Assistant Rules

AI coding assistants such as Cursor should follow these rules when working on LockPrime.

Before recommending work:

1. Read PROJECT_VISION.md.
2. Read ARCHITECTURE.md.
3. Inspect the actual repository.
4. Inspect both `locked-vault-client/` and `locked-vault-server/` when relevant.
5. Check whether the proposed feature already exists.

Before changing code:

1. Explain the problem.
2. Recommend one focused next step.
3. Create an implementation plan.
4. List every file that will be created or modified.
5. Explain why each file needs to change.
6. Wait for developer approval.

During implementation:

1. Modify only approved files.
2. Keep changes minimal and focused.
3. Do not perform unrelated refactoring.
4. Preserve existing functionality.
5. Follow existing architectural patterns unless there is a strong reason not to.
6. Never weaken backend security because equivalent frontend validation exists.

After implementation:

1. Show the exact diff.
2. Explain each meaningful change.
3. Identify tests that should be performed.
4. Do not automatically begin another feature.

For financial functionality:

1. Treat all financial operations as security-critical.
2. Validate inputs on the backend.
3. Verify authenticated ownership.
4. Preserve transaction consistency.
5. Use database transactions where appropriate.
6. Never treat frontend state as financial truth.
7. Remember that current balances are simulated.
8. Do not introduce real-money functionality without an approved architecture.

---

# 39. Current Development Priorities

The current priority order is approximately:

1. Complete and strengthen authentication.
2. Strengthen resource authorization.
3. Validate financial amounts.
4. Fix transaction and balance consistency issues.
5. Improve backend error handling.
6. Add automated tests for critical business logic.
7. Improve frontend loading, success, and error states.
8. Improve vault management UX.
9. Improve transaction history.
10. Add profile/account functionality.
11. Design future payment architecture.
12. Design ledger architecture.
13. Integrate real-money payment infrastructure only after the necessary foundations exist.

Cursor should inspect the actual current state before choosing the next item because some priorities may already have been completed.

---

# 40. Architectural Rule of Thumb

When deciding where logic belongs:

UI presentation
→ locked-vault-client

Client API communication
→ locked-vault-client/src/services

Authentication enforcement
→ locked-vault-server

Vault business rules
→ locked-vault-server

Financial validation
→ locked-vault-server

Database persistence
→ locked-vault-server / Prisma

Future external payment integrations
→ payments domain or appropriate backend payment module

Future notification delivery
→ notifications domain

Genuinely cross-application definitions
→ shared

Technical documentation
→ docs

When uncertain, prefer keeping related functionality together rather than prematurely creating a new service.