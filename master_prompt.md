# SURYA - Master Project Specification & Prompt

## 1. Project Identity & Vision
**Project Name:** SURYA (Smart Unified Resource for Judicial Assistance)
**Core Concept:** A unified platform serving both institutional users (Document Management System for the justice system) and public users (citizens, lawyers, students for legal assistance). 
**Key Technologies:** Frontend (React/Vite), Database & Auth (Supabase), Identity (DigiLocker Mock/Clone), Blockchain (Ethereum/Polygon/Hyperledger for immutable logging).

---

## 2. Platform Architecture & User Flows

### A. Core Landing Page
- **Main Hero Section:** Prominent SURYA branding.
- **Primary CTA:** A sleek "Login" button with a pop-up micro-animation on hover.
- **Top Navigation Bar:** Includes a specific button labeled **"SURYA for Judicial Assistance"**.

### B. Flow 1: Institutional / DMS Access (Main Login Button)
1. **Click Login:** Routes to a Mock DigiLocker Authentication Page.
2. **DigiLocker Auth:** User inputs Phone Number and PIN to authenticate.
3. **Role & ID Verification:** After DigiLocker auth, user is redirected to a new page to enter their **Unique Department ID** and **Select their Institutional Role** (e.g., Investigating Officer, Judicial Officer).
4. **Backend Validation (Supabase):** The system verifies if the provided Unique ID and Role map correctly to the verified DigiLocker identity.
5. **Redirection:** Access granted to the specialized Institutional Dashboard.

### C. Flow 2: Public & Professional Assistance (Top Bar Button)
1. **Click "SURYA for Judicial Assistance":** Opens a modal/popup with 3 Role Cards: **Citizen**, **Lawyer**, and **Student**.
2. **Role Selection & DigiLocker Auth:** Clicking a card routes to the Mock DigiLocker Auth (Phone + PIN/OTP).
3. **Role-Specific Routing:**
   - **Citizen / Student:** Redirected directly to their respective personalized SURYA dashboards (already existing in the codebase).
   - **Lawyer:** Redirected to a secondary validation layer requiring a **Unique Lawyer ID (e.g., Bar Council ID)**. Supabase verifies this ID matches the DigiLocker identity. Upon success, routes to the personalized Lawyer Dashboard.

---

## 3. Blockchain Integration Strategy
As a blockchain expert, the implementation of decentralized ledger technology in SURYA will focus on **trust, immutability, and auditing** rather than tokenomics. 

**Where & How Blockchain is Used:**
1. **Evidence & Document Integrity (Hash-chaining):** When an institutional user uploads a legal document or evidence file, the file is stored in standard cloud storage (Supabase Storage), but its cryptographic hash (SHA-256) is committed to a smart contract on the blockchain. Any attempt to alter the file will change its hash, breaking the cryptographic match and flagging the document as tampered.
2. **Immutable Audit Trails:** Every critical action (who accessed a sensitive case file, when a lawyer verified their ID, when an officer updated a record) is logged as a transaction on the blockchain. This creates a mathematically provable, tamper-evident audit log that can be presented in court to prove chain of custody.
3. **Smart Contracts for Access Control (Optional/Advanced):** RBAC (Role-Based Access Control) rules can be enforced by smart contracts, ensuring no centralized admin can unilaterally grant unauthorized access to sealed records.

---

## 4. Database & Backend Strategy (Supabase)
Supabase will handle relational data, standard user sessions, and API routes.

**Mock Database Requirements for Auth:**
- `digilocker_users`: Stores mock DigiLocker data (Phone, PIN, Real Name, Aadhaar/DigiLocker UUID).
- `institutional_identities`: Maps `digilocker_uuid` -> `unique_dept_id` -> `role`. Used to validate Flow 1.
- `lawyer_registry`: Maps `digilocker_uuid` -> `bar_council_id`. Used to validate the Lawyer branch in Flow 2.

---

## 5. Execution Directives for the AI
When acting upon this prompt, the AI must:
1. Build out the **DigiLocker Mock Auth UI** pixel-perfectly to mimic the real application.
2. Wire up the **Supabase** backend to handle the multi-step verification (DigiLocker Auth -> Unique ID/Role Auth).
3. Retain existing dashboard code but integrate the new authentication gatekeepers.
4. Ensure the landing page aligns precisely with the described flow (Main Login vs. Top Bar Assistant).
5. Document all smart contract logic for the blockchain audit module.
