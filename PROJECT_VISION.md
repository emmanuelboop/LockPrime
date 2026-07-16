# LockPrime — Project Vision

## Overview

LockPrime is a financial savings application designed to help users save money by locking funds away for a period of time chosen by the user.

The core idea is simple:

1. A user creates an account.
2. The user creates a savings vault.
3. The user chooses how long the money should remain locked.
4. The user deposits money into the vault.
5. The money cannot be withdrawn until the vault's unlock date.
6. Once the vault unlocks, the user can withdraw their money.

The purpose of LockPrime is to help people who struggle with spending money they intended to save. Instead of relying only on self-control, users can create a commitment that prevents them from accessing their savings until a future date.

---

## Current Project Status

The application currently has:

- User registration
- User login
- JWT authentication
- Protected backend API endpoints
- User-specific vaults
- Vault creation
- Custom vault lock periods
- Depositing money into vaults
- Withdrawing money from unlocked vaults
- Server-side prevention of withdrawals from locked vaults
- Frontend disabling of withdrawals while a vault is locked
- Transaction history
- Deposit transaction records
- Withdrawal transaction records
- PostgreSQL database
- Prisma ORM
- React frontend
- Express/Node.js backend

At the current development stage, vault balances and transactions are simulated database values. No real money is currently being transferred.

---

## Core Product Rules

### Vault Ownership

Every vault belongs to a specific authenticated user.

A user must never be able to access, modify, deposit into, or withdraw from another user's vault.

The backend must determine the authenticated user from the JWT rather than trusting a user ID supplied by the frontend.

### Locked Funds

A vault has an unlock date.

Before the unlock date:

- Users may deposit additional money.
- Users may view the vault.
- Users may view transaction history.
- Users cannot withdraw money.

After the unlock date:

- Users can withdraw available funds.

Lock restrictions must always be enforced by the backend.

Frontend restrictions, such as disabling the Withdraw button, are for user experience only and must never replace backend security.

### Transactions

Every movement of money should have a transaction record.

Transaction types currently include:

- Deposit
- Withdrawal

Transaction history should accurately represent all changes to a vault's balance.

---

## Future Real-Money Integration

The long-term goal is for LockPrime to support real deposits and withdrawals.

Possible funding methods may include:

- Interac e-Transfer
- Bank transfers
- Payment providers
- Other supported Canadian payment methods

The application should eventually allow users to deposit real money into their LockPrime account or vaults and withdraw eligible funds after the lock period expires.

Real-money functionality must not be implemented as simple database balance updates.

Before handling real money, the project will require proper payment infrastructure, transaction verification, security controls, regulatory research, and reconciliation.

The database balance should reflect confirmed financial transactions rather than being treated as the source of real funds.

---

## Security Principles

Because LockPrime is intended to eventually deal with money, security is a major priority.

The application should:

- Authenticate users securely.
- Authorize access to every user-owned resource.
- Never trust user IDs supplied by the frontend.
- Validate all financial amounts on the backend.
- Prevent negative or invalid deposits.
- Prevent withdrawals greater than the available balance.
- Prevent withdrawals before the unlock date.
- Keep an accurate transaction history.
- Use database transactions for balance-changing operations.
- Avoid exposing sensitive information to the frontend.
- Handle authentication expiration correctly.
- Protect production secrets and environment variables.
- Prevent duplicate financial operations.

Security-critical rules must be enforced on the server.

---

## Development Philosophy

Build the project incrementally.

For each new feature:

1. Inspect the existing implementation first.
2. Identify what already exists.
3. Recommend the next logical improvement.
4. Create a plan before modifying code.
5. Identify exactly which files need to change.
6. Keep changes focused and minimal.
7. Do not modify unrelated files.
8. Show the developer the changes for review.
9. Test existing functionality after changes.
10. Maintain the existing architecture unless there is a clear reason to change it.

Do not implement large groups of features at once.

Work on one logical feature at a time.

---

## Current Development Priorities

The immediate goal is to turn the existing prototype into a secure and polished full-stack application before attempting real-money integration.

Priorities include:

1. Strengthen authentication and authorization.
2. Improve financial amount handling and validation.
3. Ensure vault balances and transaction history always remain consistent.
4. Improve error handling.
5. Improve vault locking and unlocking UX.
6. Improve the dashboard and overall UI.
7. Add proper loading, success, and error states.
8. Improve transaction history.
9. Add user profile/account functionality.
10. Prepare the architecture for eventual payment integration.

---

## Instructions for AI Coding Assistants

When working on this project:

- Read this document before proposing major features.
- Inspect the existing code before suggesting changes.
- Do not assume a feature is missing without checking.
- Preserve existing working functionality.
- Recommend what should be built next based on the current state of the project.
- Explain why the recommended feature should come next.
- Create a plan before editing files.
- State exactly which files will be modified.
- Do not modify code until the developer approves the plan.
- Keep each change small enough to review.
- Do not make unrelated refactors.
- Show the exact diff after implementation.
- Prioritize security and correctness for authentication and financial operations.
- Remember that current balances are simulated and that real-money integration is a future goal.