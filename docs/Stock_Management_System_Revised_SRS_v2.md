# Stock Management System — Software Requirements Specification v2.0

Consolidated Professional Edition — Integrating the existing SRS with the detailed store, receiving, evaluation, stock-card, bin-card, requisition, issue, return, transfer, asset and disposal workflows.

## Document Control

| Field | Value |
|---|---|
| Document title | Software Requirements Specification – Stock Management System |
| Version | 2.0 – Consolidated |
| Status | Requirements baseline / implementation-ready draft |
| Prepared for | Organization / Project Stakeholders |
| Methodology | Agile |
| Primary architecture | Three-tier web application |
| Database | PostgreSQL |
| Primary API style | REST API |
| Date | 10 August 2026 |

This document is a consolidated revision. It preserves the core requirements of the original 50-page SRS while expanding the system around the detailed operational use cases supplied by the stakeholders.

## Document Control and Revision History

| Version | Date | Change | Status |
|---|---|---|---|
| 1.0 | — | Original Stock Management System SRS covering inventory, receiving, issuing, transfers, reports, audit and RBAC. | Superseded |
| 2.0 | 10 Aug 2026 | Consolidated and expanded SRS. Added detailed store, item category/location, goods receipt, TEC evaluation, GRN, SRC, bin-card, requisition, SIV/ISIV, assets, returns, transfers, shelf-life and disposal workflows. Added implementation clarification rules. | Current |

## Table of Contents

1. Introduction
2. Overall Description of the Existing System
3. Proposed System Overview
4. Stakeholders, Actors and Roles
5. Functional Requirements
6. Detailed System Use Cases
7. Business Rules and Workflow Rules
8. Non-Functional Requirements
9. System Architecture and Technical Design
10. Data Model and Data Dictionary
11. User Interface Requirements
12. Reports, Notifications and Audit
13. Security Requirements
14. Integration and External Services
15. Testing and Acceptance Requirements
16. Implementation Plan and Batching Strategy
17. Risks, Assumptions and Clarification Register
18. Feasibility, Schedule and Cost
19. Traceability Matrix
20. References
- Appendix A – Glossary
- Appendix B – Sample Electronic Forms
- Appendix C – Initial Permission Matrix

## 1. Introduction

### 1.1 Background

Inventory and property management is a critical operational function for organizations that acquire, store, issue, transfer, safeguard and dispose of materials and assets. The original system specification identified the limitations of paper-based records, including bin cards, stock record cards, requisition forms and manually prepared reports. The consolidated system retains that operational model while digitizing the workflow, approvals, records and audit trail.

The proposed Stock Management System (SMS) is a web-based system that provides a centralized source of truth for store information, item classification, physical storage locations, receipts, evaluations, stock records, bin-level balances, requisitions, issues, returns, transfers, fixed assets, shelf-life monitoring, disposal and reporting.

### 1.2 Problem Statement

- Difficulty tracking stock movement across stores, bins and departments.
- Human errors in manual recording and calculations.
- Loss, duplication and inconsistency of inventory records.
- Delays in preparing receiving, issuing and management reports.
- Poor visibility of stock shortages, overstocking, damaged and obsolete materials.
- Weak linkage between physical documents and inventory transactions.
- Limited transparency over approvals and technical evaluation decisions.
- Difficulty maintaining accurate stock cards and bin cards.
- Difficulty monitoring material transfers, returns, shelf life and disposal.
- Limited real-time information for management and operational staff.

### 1.3 Purpose

The purpose of the project is to design and implement a secure, auditable and workflow-driven Stock Management System that automates the organization's material and property management processes while preserving required business controls and document-based procedures.

### 1.4 General Objective

To develop a computerized Stock Management System that improves inventory accuracy, operational efficiency, transparency, accountability and availability of real-time stock information.

### 1.5 Specific Objectives

- Implement secure authentication, authorization and role-based access control.
- Manage stores, departments/stores, item categories, item master data and physical storage locations.
- Digitize goods receipt recording, document verification and technical evaluation.
- Generate and maintain Goods Receiving Notes (GRN / Model 19) for accepted materials.
- Automatically maintain Stock Record Cards (SRC) and dynamically maintain Bin Cards.
- Digitize store requisitions and the approval/issue workflow.
- Support preliminary and inter-store issue vouchers (SIV/ISIV) and their approval/amendment/finalization.
- Register and track fixed assets where applicable.
- Digitize material return requests and technical evaluation/approval workflows.
- Support material transfer requests, approvals and execution.
- Monitor shelf life and material status, flag disposal candidates and manage disposal workflows.
- Support stock taking, reconciliation, FIFO valuation where applicable, reporting and audit.

### 1.6 Scope

- Authentication and user/role management.
- Store and storage-location management.
- Item master, categories, units and suppliers.
- Receiving, inspection and technical evaluation.
- GRN and receiving documentation.
- Stock cards and bin cards.
- Requisitions, SIV/ISIV and gate/dispatch controls.
- Returns and transfers.
- Fixed asset registration.
- Shelf-life, damaged/obsolete monitoring and disposal.
- Stock taking and reconciliation.
- Reporting, dashboards, notifications and audit logs.

### 1.7 Initial Limitations / Deferred Capabilities

The original SRS explicitly excluded mobile application integration, AI demand forecasting, barcode/RFID integration, offline synchronization, banking integration and multi-organization support. These remain deferred unless stakeholders formally approve a scope change. The system should nevertheless be designed so these capabilities can be added later without restructuring the core inventory ledger.

### 1.8 Methodology

The project follows Agile development: requirement validation, analysis, design, implementation, testing, user acceptance, deployment and maintenance. Requirements that depend on organization-specific policies will be validated during implementation rather than silently assumed.

## 2. Overall Description of the Existing System

### 2.1 Existing Process

The existing process is primarily manual and document-driven. Departments request materials through requisition forms. Store personnel receive and inspect materials, record transactions in stock registers, bin cards and stock record cards, and issue materials after authorization. Stock taking, reconciliation and reporting are also performed using paper records and manual calculations.

### 2.2 Existing Actors

| Actor | Current responsibility |
|---|---|
| Property Administration Officer (PAO) | Supervises inventory activities and approves requests, transfers and related records. |
| Storekeeper / Store Head | Receives, stores, safeguards and issues materials; maintains store records. |
| Stock Clerk | Maintains stock records, transactions and reports. |
| Department Head | Reviews/approves department material requests. |
| Accountant | Handles financial values and inventory valuation/reporting. |
| Security Officer | Controls movement of materials into and out of the premises. |
| Technical Evaluation Committee (TEC) | Inspects/evaluates materials where technical acceptance is required. |
| Property Registration Officer | Registers accepted property/fixed assets where applicable. |
| Supplier / Donor | Provides goods and supporting documents. |

### 2.3 Existing Business Rules

- Every inventory item has a unique item code.
- Received goods are inspected before final storage/acceptance.
- Only authorized personnel approve inventory transactions.
- Inventory cannot be issued without an approved requisition.
- Every inventory movement is recorded.
- Every stock item has a stock record and bin-level record where applicable.
- Stock records are updated for receipts, issues, returns and transfers.
- FIFO is the baseline valuation method stated in the original SRS.
- Physical stock taking is performed at least once per fiscal year.
- Damaged and obsolete items are identified and reported.
- Materials leaving the organization require appropriate authorization/gate documentation.
- Stock discrepancies are investigated and corrected through an auditable process.
- Users/departments remain accountable for issued materials.
- Reorder levels and safety stock may be configured.
- Only authorized users can access restricted inventory information.

## 3. Proposed System Overview

### 3.1 System Vision

The SMS will provide a single digital workflow from material receipt to acceptance, storage, issue, return, transfer, asset registration and disposal. Each operational document becomes a traceable transaction that can be linked to users, roles, departments, stores, bins, items and approvals.

### 3.2 Core Modules

| Module | Primary responsibility |
|---|---|
| Authentication & Access | Login, sessions, password management, RBAC, permissions, audit. |
| Organization & Store Setup | Stores, departments, store types, responsible officers and configurations. |
| Item Master | Items, categories, units, codes, properties, reorder levels and status. |
| Supplier Management | Supplier/donor profiles and supporting information. |
| Location Management | Store → area → shelf/rack → bin/location hierarchy. |
| Receiving | Goods receipt record, supporting documents, inspection and temporary receipt. |
| Technical Evaluation | TEC inspection, decision, remarks and approval trail. |
| GRN | Accepted material receiving note / Model 19 record and document generation. |
| Stock Cards | Automatic SRC creation and perpetual transaction history. |
| Bin Cards | Bin-level movements, balances and supporting document references. |
| Requisition & Issue | Store requisitions, approvals, SIV/ISIV, issue and gate controls. |
| Returns | SRN/material return request, technical evaluation and approval. |
| Transfers | Bin/store/organizational transfer requests, approvals and execution. |
| Fixed Assets | Registration and lifecycle tracking of fixed assets. |
| Shelf Life & Disposal | Expiry/status monitoring, disposal flagging and disposal workflow. |
| Stock Taking | Physical counts, variance analysis and reconciliation. |
| Reporting & Analytics | Operational, inventory, financial and audit reports. |
| Notifications | Approval alerts, receipt evaluation alerts, low stock, shelf-life and disposal alerts. |

### 3.3 High-Level Transaction Lifecycle

1. Material is received with purchase, donation or other supporting documents.
2. A temporary Goods Receipt Record is created and verified.
3. Where required, the Store Head notifies the Technical Evaluation Committee.
4. TEC evaluates the material and records approve/reject and remarks.
5. Accepted material proceeds to GRN generation/recording.
6. The system creates or updates the Stock Record Card and Bin Card.
7. Material becomes available according to its item/store/location status.
8. Departments create store requisitions and authorized officers approve them.
9. The store prepares and approves SIV/ISIV documentation and issues stock.
10. Every issue, return, transfer and adjustment updates the stock ledger and bin balance.
11. Expired, damaged or obsolete materials are flagged and routed through disposal controls.

## 4. Stakeholders, Actors and Roles

| Actor | Responsibilities |
|---|---|
| Administrator | System configuration, users, roles, permissions, master data and technical administration. |
| Property Administration Officer (PAO) | Supervision, approval, monitoring, reporting and property controls. |
| Store Head / Storekeeper | Store operations, receiving, storage, issue, return, bin management and operational approvals assigned to the role. |
| Stock Clerk | Stock record maintenance, transaction preparation and reports. |
| Technical Evaluation Committee (TEC) | Technical inspection and acceptance/rejection decisions. |
| Property Registration Officer | Registers accepted fixed assets/property where applicable. |
| Department Head | Approves departmental store requisitions. |
| Requester / Department User | Creates material requests and views request status. |
| Accountant | Inventory valuation and financial reports. |
| Security Officer | Verifies authorized material movement at organizational entry/exit points. |
| Supplier / Donor | External party associated with received materials; may remain an external record rather than a login user. |

> **Implementation clarification rule:** If an approval authority, document number/model, status transition, calculation method, segregation-of-duty rule, or relationship between two records is unclear, the affected implementation task must be marked BLOCKED/NEEDS CLARIFICATION. Developers must not silently invent organization policy. The clarification should be recorded in the requirements decision log and then incorporated into the affected requirement, workflow and database constraint.

## 5. Functional Requirements

### 5.1 Functional Requirement Conventions

Each requirement is written using the term 'shall'. A requirement is testable when the system can demonstrate the specified behavior through a user action, API call, database state, generated document, notification or audit event.

### Authentication & Access

- **FR-01** The system shall authenticate registered users before access to protected functions.
- **FR-02** The system shall support role-based permissions and least-privilege access.
- **FR-03** The system shall maintain user sessions and secure logout.
- **FR-04** The system shall record security-sensitive authentication and authorization events.

### Store and Master Data

- **FR-05** The system shall create, update, activate/deactivate and view store information, including main stores and department stores.
- **FR-06** The system shall maintain item categories and associate each category with an appropriate store/type where required.
- **FR-07** The system shall maintain item master records, unique item codes, units of measure, status and inventory control parameters.
- **FR-08** The system shall maintain supplier/donor records and supporting information.
- **FR-09** The system shall maintain hierarchical physical locations for materials within stores.

### Receiving and Acceptance

- **FR-10** The system shall create Goods Receipt Records for received materials and capture supporting purchase/donation documents.
- **FR-11** The system shall support temporary receipt status pending required evaluation.
- **FR-12** The system shall notify the TEC/assigned evaluators when technical inspection is required.
- **FR-13** The system shall record TEC evaluation decisions, remarks and evidence.
- **FR-14** The system shall update receipt status based on the authorized evaluation decision.
- **FR-15** The system shall notify the Property Registration Officer for accepted materials requiring property registration.
- **FR-16** The system shall generate and record the GRN / Model 19 information for accepted materials.

### Stock Cards and Bin Cards

- **FR-17** The system shall automatically create a Stock Record Card for a new material when the material becomes an accepted stock item.
- **FR-18** The system shall update the Stock Record Card for receipts, issues, returns, transfers and approved adjustments.
- **FR-19** The system shall allow authorized users to view current balance and historical SRC transactions.
- **FR-20** The system shall dynamically create/maintain Bin Cards for used storage bins and locations.
- **FR-21** The system shall record inbound/outbound direction, quantity, supporting document reference, source/destination location and resulting balance on bin-level transactions.
- **FR-22** The system shall calculate perpetual stock balances from validated transactions and prevent unauthorized negative balances unless a specifically approved exception policy exists.
- **FR-23** The system shall support stock transfer between bins while preserving an auditable source and destination trail.

### Requisition and Issue

- **FR-24** The system shall allow authorized requesters to create store requisitions.
- **FR-25** The system shall route requisitions to the configured approval authority.
- **FR-26** The system shall support approval and rejection with reason/remarks.
- **FR-27** The system shall support creation of preliminary SIV/ISIV records from approved requisitions.
- **FR-28** The system shall support authorized approval and amendment of SIV/ISIV documents.
- **FR-29** The system shall generate/finalize the required SIV/ISIV document according to the approved organizational format.
- **FR-30** The system shall reduce stock only when the issue transaction is validly finalized.

### Assets, Returns and Transfers

- **FR-31** The system shall register fixed assets associated with accepted materials when applicable.
- **FR-32** The system shall create material return requests / Store Return Notes (SRN).
- **FR-33** The system shall support technical evaluation of returned materials where required.
- **FR-34** The system shall support approval/rejection of material returns and update stock according to the approved disposition.
- **FR-35** The system shall create material transfer requests between stores/locations/organizational units.
- **FR-36** The system shall support transfer approval/rejection and execution.

### Shelf Life, Disposal and Control

- **FR-37** The system shall monitor shelf life and material status using configurable dates/status rules.
- **FR-38** The system shall flag materials eligible for disposal based on approved criteria.
- **FR-39** The system shall manage disposal requests, approvals, decisions and completion records.
- **FR-40** The system shall support stock taking, variance identification and authorized reconciliation.
- **FR-41** The system shall support minimum/maximum/reorder/safety stock controls where configured.

### Reporting, Notifications and Audit

- **FR-42** The system shall generate operational, stock, movement, valuation, asset, disposal and audit reports.
- **FR-43** The system shall send in-system notifications for approvals, evaluations, low stock, shelf-life and disposal events.
- **FR-44** The system shall maintain immutable/auditable transaction history for critical inventory operations.
- **FR-45** The system shall provide dashboards showing current inventory status, pending workflows and alerts.
- **FR-46** The system shall provide search, filtering, sorting and export functions for authorized records.

## 6. Detailed System Use Cases

The consolidated use-case model expands the original SRS's high-level use cases into operational workflows. The following list is the implementation baseline. Some use cases are intentionally separated so that permissions, approvals and audit events can be tested independently.

### UC-01 – Authenticate User

| Attribute | Specification |
|---|---|
| Primary actor | User |
| Precondition | Account exists and is active. |
| Main flow | Validate credentials; create secure session; record login event. |
| Postcondition | Authenticated session exists. |

### UC-02 – Manage Users and User Cards

| Attribute | Specification |
|---|---|
| Primary actor | Administrator |
| Precondition | Administrator permission exists. |
| Main flow | Create/update/deactivate user; assign role; maintain user-card information. |
| Postcondition | User record is updated and audited. |

### UC-03 – Manage Store Information

| Attribute | Specification |
|---|---|
| Primary actor | Administrator / PAO |
| Precondition | Authorized user. |
| Main flow | Create/update stores, departments/stores, responsible officers and status. |
| Postcondition | Store master is current. |

### UC-04 – Maintain Item Categories

| Attribute | Specification |
|---|---|
| Primary actor | Administrator / PAO |
| Precondition | Store/category permissions exist. |
| Main flow | Create/update category; associate category with relevant store/type. |
| Postcondition | Category is available for item classification. |

### UC-05 – Manage Item Master

| Attribute | Specification |
|---|---|
| Primary actor | Authorized master-data user |
| Precondition | Item master permission exists. |
| Main flow | Create unique item; set unit, category, control parameters and status. |
| Postcondition | Item can participate in inventory workflows. |

### UC-06 – Manage Suppliers/Donors

| Attribute | Specification |
|---|---|
| Primary actor | Authorized user |
| Precondition | Supplier module available. |
| Main flow | Create/update supplier/donor and supporting information. |
| Postcondition | Supplier record is available for receiving. |

### UC-07 – Maintain Item Locations

| Attribute | Specification |
|---|---|
| Primary actor | Storekeeper / Stock Clerk |
| Precondition | Store and location hierarchy exists. |
| Main flow | Create/update location hierarchy and assign materials to bins/locations. |
| Postcondition | Physical location is traceable. |

### UC-08 – Goods Receipt Record

| Attribute | Specification |
|---|---|
| Primary actor | Storekeeper / Store Head |
| Precondition | Goods and supporting document received. |
| Main flow | Capture supplier/donor, document references, items, quantities and temporary receipt status. |
| Postcondition | Receipt record awaits required evaluation/acceptance. |

### UC-09 – Evaluate Materials for Acceptance

| Attribute | Specification |
|---|---|
| Primary actor | TEC |
| Precondition | Receipt requires technical evaluation. |
| Main flow | Review material; record approve/reject, remarks and evidence. |
| Postcondition | Receipt status is updated and next actor notified. |

### UC-10 – Generate GRN Information

| Attribute | Specification |
|---|---|
| Primary actor | Storekeeper / Authorized Officer |
| Precondition | Material accepted by required bodies. |
| Main flow | Generate/record GRN / Model 19 information. |
| Postcondition | Accepted receipt has official receiving record. |

### UC-11 – Auto-Update Stock Card

| Attribute | Specification |
|---|---|
| Primary actor | System |
| Precondition | Accepted receipt or valid inventory transaction exists. |
| Main flow | Create/update SRC automatically from validated transaction. |
| Postcondition | SRC reflects current perpetual balance. |

### UC-12 – View Stock Card

| Attribute | Specification |
|---|---|
| Primary actor | Authorized user |
| Precondition | Stock record exists. |
| Main flow | Search item and view balance/history/transactions. |
| Postcondition | User sees authorized stock history. |

### UC-13 – Manage Bin Card

| Attribute | Specification |
|---|---|
| Primary actor | Storekeeper / Stock Clerk |
| Precondition | Item assigned to location/bin. |
| Main flow | Create/update bin card and record movements. |
| Postcondition | Bin-level balance remains current. |

### UC-14 – Transfer Stock Between Bins

| Attribute | Specification |
|---|---|
| Primary actor | Storekeeper |
| Precondition | Source stock available; transfer authorized. |
| Main flow | Create transfer, validate quantity, post source decrease and destination increase. |
| Postcondition | Both bin records reconcile. |

### UC-15 – Manage Store Requisition

| Attribute | Specification |
|---|---|
| Primary actor | Requester / Department User |
| Precondition | User has request permission. |
| Main flow | Create requisition, select items/quantities, submit and track status. |
| Postcondition | Requisition enters approval workflow. |

### UC-16 – Approve/Reject Store Requisition

| Attribute | Specification |
|---|---|
| Primary actor | Department Head / PAO |
| Precondition | Requisition submitted. |
| Main flow | Review request; approve or reject with remarks. |
| Postcondition | Approved request can proceed to issue. |

### UC-17 – Create Preliminary SIV/ISIV

| Attribute | Specification |
|---|---|
| Primary actor | Storekeeper / Stock Clerk |
| Precondition | Approved requisition exists. |
| Main flow | Prepare SIV/ISIV lines and verify stock availability. |
| Postcondition | Draft issue document exists. |

### UC-18 – Approve and Amend SIV/ISIV

| Attribute | Specification |
|---|---|
| Primary actor | Authorized Approver |
| Precondition | Draft SIV/ISIV exists. |
| Main flow | Review, amend where permitted, approve or return for correction. |
| Postcondition | Approved document is ready for finalization. |

### UC-19 – Generate Final SIV/ISIV

| Attribute | Specification |
|---|---|
| Primary actor | Authorized Store Officer |
| Precondition | SIV/ISIV approved. |
| Main flow | Generate required final issue document/model and record issue reference. |
| Postcondition | Final issue document is recorded. |

### UC-20 – Manage Fixed Assets Registration

| Attribute | Specification |
|---|---|
| Primary actor | Property Registration Officer |
| Precondition | Accepted material is asset-eligible. |
| Main flow | Capture asset identity, acquisition/receipt reference, custodian/location and status. |
| Postcondition | Asset is registered and traceable. |

### UC-21 – Create Material Return Request / SRN

| Attribute | Specification |
|---|---|
| Primary actor | Requester / Storekeeper |
| Precondition | Material is eligible for return. |
| Main flow | Create return request, reason and quantities. |
| Postcondition | Return request enters review. |

### UC-22 – Record Technical Evaluation Result for Return

| Attribute | Specification |
|---|---|
| Primary actor | TEC / Authorized Evaluator |
| Precondition | Return requires technical assessment. |
| Main flow | Inspect returned material and record result. |
| Postcondition | Return receives technical disposition. |

### UC-23 – Approve/Reject Store Return

| Attribute | Specification |
|---|---|
| Primary actor | Authorized Officer |
| Precondition | Return evaluation completed where required. |
| Main flow | Approve/reject return; determine accepted quantity/disposition. |
| Postcondition | Approved return can update inventory. |

### UC-24 – Initiate Material Transfer Request

| Attribute | Specification |
|---|---|
| Primary actor | Requester / Storekeeper |
| Precondition | Transfer need exists. |
| Main flow | Select source, destination, item and quantity; submit request. |
| Postcondition | Transfer awaits approval. |

### UC-25 – Approve/Reject Material Transfer

| Attribute | Specification |
|---|---|
| Primary actor | PAO / Authorized Officer |
| Precondition | Transfer request submitted. |
| Main flow | Review and approve/reject with remarks. |
| Postcondition | Approved transfer can be executed. |

### UC-26 – Execute Material Transfer

| Attribute | Specification |
|---|---|
| Primary actor | Storekeeper |
| Precondition | Transfer approved and stock available. |
| Main flow | Issue from source and receive at destination; record supporting document. |
| Postcondition | Source and destination balances are updated. |

### UC-27 – Auto-Monitor Shelf Life and Status

| Attribute | Specification |
|---|---|
| Primary actor | System |
| Precondition | Item has relevant shelf-life/status data. |
| Main flow | Calculate/monitor thresholds; create alerts. |
| Postcondition | Users receive status alerts. |

### UC-28 – Flag Items for Disposal

| Attribute | Specification |
|---|---|
| Primary actor | System / Authorized Officer |
| Precondition | Item meets disposal criteria. |
| Main flow | Flag item and create disposal candidate record. |
| Postcondition | Item is blocked/restricted according to policy. |

### UC-29 – Manage Disposal Request

| Attribute | Specification |
|---|---|
| Primary actor | Authorized Officer |
| Precondition | Disposal candidate exists. |
| Main flow | Create request with reason, evidence and proposed disposition. |
| Postcondition | Request enters disposal workflow. |

### UC-30 – Manage Disposal Workflow

| Attribute | Specification |
|---|---|
| Primary actor | PAO / Committee / Authorized Officer |
| Precondition | Disposal request submitted. |
| Main flow | Review, approve/reject, execute and record disposal evidence. |
| Postcondition | Item reaches final disposal state. |

### UC-31 – Perform Stock Taking

| Attribute | Specification |
|---|---|
| Primary actor | Storekeeper / Stock Clerk |
| Precondition | Counting session authorized. |
| Main flow | Open count, record physical quantities and submit count. |
| Postcondition | Physical count is stored. |

### UC-32 – Reconcile Stock

| Attribute | Specification |
|---|---|
| Primary actor | PAO / Authorized Officer |
| Precondition | Count completed. |
| Main flow | Compare physical and system balances; investigate variance; approve adjustment if authorized. |
| Postcondition | Reconciled stock is auditable. |

### UC-33 – Manage Stock Control Levels

| Attribute | Specification |
|---|---|
| Primary actor | Authorized Master Data User |
| Precondition | Item exists. |
| Main flow | Set min/max/reorder/safety stock thresholds. |
| Postcondition | Alerts and reports use configured thresholds. |

### UC-34 – Inventory Valuation

| Attribute | Specification |
|---|---|
| Primary actor | Accountant / Authorized Officer |
| Precondition | Valuation data exists. |
| Main flow | Calculate/report inventory value using configured method, baseline FIFO. |
| Postcondition | Valuation report is available. |

### UC-35 – Manage Damaged/Obsolete Materials

| Attribute | Specification |
|---|---|
| Primary actor | Storekeeper / PAO |
| Precondition | Material status changes or inspection identifies damage. |
| Main flow | Record condition, isolate/restrict item and route for disposition. |
| Postcondition | Condition/status is traceable. |

### UC-36 – Manage Gate/Dispatch Authorization

| Attribute | Specification |
|---|---|
| Primary actor | Security Officer / Authorized Officer |
| Precondition | Issue/transfer is authorized. |
| Main flow | Verify document, quantity and destination before exit. |
| Postcondition | Gate movement is logged. |

### UC-37 – Generate Operational Reports

| Attribute | Specification |
|---|---|
| Primary actor | Authorized User |
| Precondition | Report permission exists. |
| Main flow | Filter report, generate, export/print. |
| Postcondition | Report reflects authorized data. |

### UC-38 – Manage Notifications

| Attribute | Specification |
|---|---|
| Primary actor | System / Users |
| Precondition | Workflow event occurs. |
| Main flow | Create notification, mark read/unread, maintain event reference. |
| Postcondition | Relevant users are informed. |

### UC-39 – Maintain Audit Logs

| Attribute | Specification |
|---|---|
| Primary actor | System / Auditor |
| Precondition | Auditable event occurs. |
| Main flow | Record actor, time, action, entity, old/new state where appropriate and correlation reference. |
| Postcondition | Audit trail is available. |

### UC-40 – View Management Dashboard

| Attribute | Specification |
|---|---|
| Primary actor | Management / Authorized Users |
| Precondition | Dashboard permission exists. |
| Main flow | Show stock, pending approvals, alerts, movements and key indicators. |
| Postcondition | User sees current authorized metrics. |

### UC-41 – Global Search and Record Retrieval

| Attribute | Specification |
|---|---|
| Primary actor | Authorized User |
| Precondition | Search permission exists. |
| Main flow | Search/filter items, documents, stores, locations and transactions. |
| Postcondition | Matching records are displayed with access control. |

### UC-42 – Backup, Recovery and Data Administration

| Attribute | Specification |
|---|---|
| Primary actor | Administrator |
| Precondition | Administrative permission exists. |
| Main flow | Run/verify backups, restore in controlled environment and monitor data health. |
| Postcondition | Recovery capability is maintained. |

## 7. Business Rules and Workflow Rules

- **BR-01** Every item shall have a unique item code.
- **BR-02** A material receipt shall reference the relevant supporting purchase, donation or other authorized source document when applicable.
- **BR-03** A receipt that requires technical evaluation shall not become available stock until the required acceptance workflow is completed.
- **BR-04** Technical evaluation decisions shall identify the evaluator, date/time, decision and remarks.
- **BR-05** GRN creation shall be restricted to accepted/authorized receipt records.
- **BR-06** Stock ledger transactions shall be created only by validated business operations; users shall not directly edit historical balances.
- **BR-07** Every stock movement shall identify direction, quantity, item, store/location and supporting transaction/document reference.
- **BR-08** Bin balances shall reconcile with the underlying validated bin transactions.
- **BR-09** SRC balances shall reconcile with accepted inventory ledger transactions.
- **BR-10** An issue shall require an approved requisition or another explicitly authorized issue basis.
- **BR-11** A finalized issue transaction shall reduce stock exactly once; duplicate posting shall be prevented.
- **BR-12** Amendments to approved/finalized documents shall preserve the original audit trail and require appropriate authority.
- **BR-13** Returns shall not increase stock until the return is approved and the disposition is known.
- **BR-14** Transfers shall not change ownership/location balances until the transfer is executed according to the configured workflow.
- **BR-15** Source and destination balances for transfers shall be posted atomically or recoverably so partial transfers cannot silently corrupt stock.
- **BR-16** Fixed assets shall reference their source receipt/GRN and, where relevant, issue/assignment information.
- **BR-17** Shelf-life alerts shall be generated using configurable thresholds and item-specific dates.
- **BR-18** Disposal shall require an auditable request, approval and completion record according to organizational policy.
- **BR-19** Physical stock discrepancies shall be investigated and any adjustment shall be authorized and audited.
- **BR-20** Role permissions shall enforce segregation of duties where required by the organization.
- **BR-21** Critical records shall not be hard-deleted after becoming part of an auditable transaction; use status/inactivation or controlled correction instead.
- **BR-22** All timestamps shall use a consistent server-side time standard and display the organization's local time.
- **BR-23** The system shall preserve supporting document references for every major inventory lifecycle event.
- **BR-24** The system shall prevent unauthorized access to stores, departments, locations and documents outside a user's scope.
- **BR-25** FIFO shall be treated as the baseline valuation method from the original SRS, subject to confirmation by the responsible financial authority.

### 7.1 Core State Models

| Entity | Suggested states |
|---|---|
| Goods Receipt | Draft → Submitted → Under Evaluation → Accepted / Rejected / Partially Accepted → GRN Recorded → Closed |
| Store Requisition | Draft → Submitted → Approved / Rejected → Fulfillment → Partially Issued / Fully Issued → Closed / Cancelled |
| SIV/ISIV | Draft → Submitted → Approved / Returned for Amendment → Finalized → Posted / Cancelled |
| Material Return | Draft → Submitted → Under Evaluation → Approved / Rejected → Received → Dispositioned → Closed |
| Transfer | Draft → Submitted → Approved / Rejected → In Transit / Executing → Completed / Cancelled |
| Disposal | Flagged → Request Created → Under Review → Approved / Rejected → Executed → Closed |
| Item | Created → Available → Reserved → Issued → Damaged / Obsolete / Expired → Disposal Pending → Disposed |

> **Important clarification:** The exact organization-approved names of states and the authorities allowed to move between states must be confirmed before the workflow is frozen. The state model above is a design baseline, not a substitute for an approved policy document.

## 8. Non-Functional Requirements

| ID / Category | Requirement |
|---|---|
| NFR-01 Performance | Normal user operations should respond within approximately 3 seconds under the agreed workload, excluding large report generation and network-dependent operations. |
| NFR-02 Concurrency | The system shall support multiple authenticated users performing concurrent operations without inconsistent stock balances. |
| NFR-03 Availability | The deployed system should be available continuously during operational hours, with planned maintenance communicated in advance. |
| NFR-04 Reliability | Inventory transactions shall use database transactions and integrity constraints to prevent partial updates. |
| NFR-05 Security | Protected resources shall require authentication and authorization; sensitive operations shall be audited. |
| NFR-06 Usability | Interfaces shall use clear workflows, validation messages, searchable tables and consistent document terminology. |
| NFR-07 Accessibility | The web UI should follow accessible semantic HTML, keyboard navigation, readable contrast and meaningful error feedback. |
| NFR-08 Maintainability | Code shall be modular, typed, documented and organized by domain/module with reusable services and components. |
| NFR-09 Scalability | The architecture shall allow additional stores, users, items, locations, reports and future integrations without redesigning the core ledger. |
| NFR-10 Data Integrity | Foreign keys, unique constraints, check constraints and transactional posting shall enforce critical relationships. |
| NFR-11 Auditability | Critical changes shall retain actor, timestamp, action, entity and supporting reference information. |
| NFR-12 Backup | Database backup and restoration procedures shall be defined, tested and monitored. |
| NFR-13 Portability | The application should run in standard modern browsers and on the agreed server environment. |
| NFR-14 Localization | Dates, numbers, document formats and terminology shall be configurable where organizational policy requires it. |

## 9. System Architecture and Technical Design

### 9.1 Three-Tier Architecture

The original SRS uses a three-tier architecture consisting of presentation, application/business logic and data layers. The consolidated design retains this model.

| Layer | Proposed responsibility | Technology baseline |
|---|---|---|
| Presentation | Web UI, forms, dashboards, workflow screens, document previews. | React / Next.js, TypeScript |
| Application | Authentication, authorization, workflows, business rules, transaction services, notifications and reports. | Node.js, Express.js, REST API |
| Data | Transactional records, master data, audit trail, reporting views and constraints. | PostgreSQL |
| Infrastructure | Hosting, reverse proxy, backups, logging, monitoring and CI/CD. | Linux/containerized deployment; GitHub Actions; hosting selected during deployment |

### 9.2 Architecture Diagram

```
Users
Admin • PAO • Storekeeper • TEC • Accountant • Department • Security
    ↓ HTTPS
Web Application
React / Next.js • Forms • Dashboards • Documents
    ↓ REST API
Application Services
Auth • RBAC • Receiving • Evaluation • Stock Ledger • Requisition • Issue • Return • Transfer • Asset • Disposal • Reports • Notifications
    ↓ Transactional SQL
PostgreSQL
Master Data • Documents • Inventory Ledger • Bin Balances • Assets • Audit Logs
```

*Figure 1. Logical three-tier architecture*

### 9.3 Domain Services

- Identity and Access Service
- Master Data Service
- Store and Location Service
- Receiving and Evaluation Service
- Inventory Ledger Service
- Stock Card / Bin Card Service
- Requisition and Issue Service
- Return and Transfer Service
- Asset Service
- Shelf-Life and Disposal Service
- Reporting and Export Service
- Notification Service
- Audit Service

### 9.4 Transaction Integrity

Stock-affecting operations shall be posted through a transactional service. For example, executing a bin transfer should validate source availability, create the outbound transaction, create the inbound transaction, update derived balances where used, and commit as one logical operation. If any critical step fails, the transaction should roll back or enter a controlled recovery state.

## 10. Data Model and Data Dictionary

### 10.1 Core Entities

| Entity | Purpose |
|---|---|
| users | Authentication identity and profile. |
| roles | Named roles used by RBAC. |
| permissions | Atomic permissions assigned to roles. |
| user_roles | Relationship between users and roles. |
| stores | Main stores, department stores and other authorized store entities. |
| store_departments | Organizational units/departments associated with stores or requests. |
| categories | Item categories and store classification. |
| items | Item master and inventory control attributes. |
| units_of_measure | Units such as piece, box, liter, kilogram, etc. |
| suppliers | Supplier/donor records. |
| locations | Hierarchical physical locations and bins. |
| goods_receipts | Temporary/final receipt headers. |
| goods_receipt_lines | Received material lines and quantities. |
| technical_evaluations | TEC decisions and evaluation evidence. |
| grns | GRN / Model 19 records. |
| stock_cards | Per-item perpetual stock record. |
| stock_card_transactions | SRC transaction history. |
| bin_cards | Per-item/bin stock record. |
| bin_transactions | Bin-level movement history. |
| requisitions | Store requisition headers. |
| requisition_lines | Requested items and quantities. |
| siv_isiv | Issue voucher records. |
| siv_isiv_lines | Issue voucher item lines. |
| fixed_assets | Registered fixed asset records. |
| returns | Store Return Note / return request. |
| return_lines | Returned items and quantities. |
| transfer_requests | Transfer request headers. |
| transfer_lines | Transferred items and quantities. |
| shelf_life_records | Expiry/inspection dates and alerts. |
| disposal_requests | Disposal workflow records. |
| stock_takes | Stock-taking sessions. |
| stock_take_lines | Physical count and variance lines. |
| inventory_adjustments | Authorized reconciliation adjustments. |
| notifications | User/system notifications. |
| audit_logs | Security and business audit trail. |
| attachments | Supporting document metadata and secure file references. |

### 10.2 Key Relationships

- One store has many physical locations; each location can contain many item/bin records.
- One category can contain many items; an item belongs to one primary category unless policy permits multiple classifications.
- One item can have many stock-card and bin transactions.
- One goods receipt has many receipt lines; accepted lines may generate GRN and stock transactions.
- One receipt can have one or more technical evaluations depending on the configured workflow.
- One requisition has many lines and may generate one or more issue documents according to the approved partial-issue policy.
- One issue document has many lines and creates stock-out transactions when finalized.
- One return has many lines and creates stock-in or quarantine/disposition transactions only after approval.
- One transfer has source and destination stores/locations and one or more item lines.
- One fixed asset references its originating accepted receipt/GRN where applicable.
- One disposal request can contain multiple item/asset candidates and multiple approval/audit events.

### 10.3 Database Integrity Constraints

- Unique item code and document/reference numbers.
- Foreign keys for all critical master-detail relationships.
- Non-negative quantities where the business rule requires it.
- Valid status transitions enforced by application logic and, where practical, database constraints.
- Transaction timestamps and actor IDs required for posted inventory movements.
- Immutable posted transaction records; corrections use controlled reversal/adjustment records.

## 11. User Interface Requirements

### 11.1 General UI Principles

- Responsive web interface for desktop and tablet-sized operational screens.
- Consistent navigation by functional module.
- Dashboard-first design with pending approvals and alerts.
- Data tables with search, filtering, sorting, pagination and export.
- Forms grouped into logical sections with inline validation.
- Clear distinction between Draft, Submitted, Approved, Rejected, Posted and Closed states.
- Confirmation dialogs for destructive or stock-affecting actions.
- Document preview before finalization where appropriate.
- Audit/history panel on critical records.

### 11.2 Required Screens

| Screen / Module | Key functions |
|---|---|
| Login | Username/email, password, validation, session and recovery. |
| Dashboard | Stock totals, low-stock items, pending approvals, receipts, issues, returns, transfers, shelf-life and disposal alerts. |
| Store Management | Stores, departments/stores, responsible officers, status. |
| Category & Item Master | Categories, item codes, units, thresholds, status. |
| Location Management | Store/area/shelf/rack/bin hierarchy. |
| Goods Receipt | Receipt header, supporting documents, lines, temporary status and evaluation routing. |
| Technical Evaluation | Receipt details, inspection checklist/evidence, decision and remarks. |
| GRN | Accepted receipt details, document number, Model 19 preview/print. |
| Stock Card | Current balance, transaction history, filters and export. |
| Bin Card | Bin balance, movement history, supporting references. |
| Requisition | Create, submit, approval status and history. |
| SIV/ISIV | Draft, review, amendment, approval, final document and posting. |
| Returns | SRN/return request, evaluation, approval and disposition. |
| Transfers | Request, approval, source/destination, execution and history. |
| Fixed Assets | Registration, custodian/location, status and lifecycle. |
| Shelf Life | Expiring/expired materials and configurable alert windows. |
| Disposal | Candidates, requests, approvals, evidence and completion. |
| Stock Taking | Count sessions, physical counts, variance and reconciliation. |
| Reports | Filters, preview, export and print. |
| Audit Logs | Searchable actor/action/entity/time history. |
| Administration | Users, roles, permissions, master configurations and backups/health. |

## 12. Reports, Notifications and Audit

### 12.1 Reports

- Current stock by store, category, item and location.
- Stock card / SRC report.
- Bin card report.
- Goods receipt report.
- GRN / Model 19 report.
- Requisition status report.
- SIV/ISIV issue report.
- Stock movement report.
- Stock transfer report.
- Return/SRN report.
- Fixed asset register.
- Shelf-life and expiry report.
- Damaged/obsolete material report.
- Disposal candidate/request/completion report.
- Stock-taking and reconciliation report.
- Inventory valuation report using the approved valuation method.
- User activity and audit report.

### 12.2 Notifications

| Event | Recipient(s) | Priority |
|---|---|---|
| Receipt awaiting TEC evaluation | TEC / assigned evaluator | High |
| Material accepted / rejected | Store Head, Storekeeper, PAO, relevant officer | High |
| GRN ready/created | Relevant store/property officers | Medium |
| Requisition awaiting approval | Department Head / PAO | High |
| SIV/ISIV awaiting approval | Authorized approver | High |
| Return awaiting evaluation/approval | TEC / authorized officer | High |
| Transfer awaiting approval | PAO / authorized officer | High |
| Low stock/reorder threshold | Storekeeper / PAO | Medium |
| Shelf-life warning | Storekeeper / PAO | Medium |
| Disposal candidate | PAO / authorized committee | High |
| Security-sensitive event | Administrator / Auditor | High |

### 12.3 Audit Requirements

Audit logs should capture, at minimum: actor/user ID, timestamp, action, module, entity type, entity ID, result, originating request/session reference and relevant before/after values for sensitive changes. Posted stock transactions must never disappear merely because a master record is edited or deactivated.

## 13. Security Requirements

- Authentication for all protected operations.
- RBAC with explicit permissions rather than relying only on UI hiding.
- Password hashing using a modern password hashing algorithm such as Argon2id or an approved equivalent.
- Secure, HttpOnly and appropriately SameSite-configured cookies when cookie-based sessions are used.
- TLS/HTTPS in production.
- Server-side input validation for all API requests.
- Parameterized database access through ORM/query mechanisms.
- Rate limiting and brute-force protection on authentication and sensitive endpoints.
- Security headers and a strict Content Security Policy where compatible with the application.
- CSRF protection when browser cookies are used for authentication.
- File upload restrictions: allowlisted types, size limits, content validation and safe storage.
- Secrets stored in environment/secret management systems, never committed to source control.
- Audit logs protected from ordinary user modification.
- Least privilege for database and deployment credentials.
- Backup access restricted and encrypted where appropriate.
- Error messages shall not expose passwords, tokens, internal stack traces or sensitive database details.

## 14. Integration and External Services

The core inventory ledger shall remain independent of optional external services. Integrations may be added behind service interfaces so that the core system remains testable.

| Integration | Purpose | Baseline |
|---|---|---|
| Email | Approval and workflow notifications. | SMTP/provider selected during deployment. |
| File Storage | Supporting documents and evidence. | Secure local/object storage depending deployment. |
| Reporting/Export | PDF, spreadsheet and printable documents. | Server-side report generation. |
| Authentication Provider | Optional OAuth/enterprise identity. | Deferred unless approved. |
| Barcode/RFID | Future item identification. | Explicitly deferred in original scope. |
| Banking/Payment | Not required for core inventory. | Out of scope for first release. |
| Mobile App | Future client. | Out of scope for first release. |

## 15. Testing and Acceptance Requirements

### 15.1 Testing Levels

- Unit testing for business rules, calculations, validators and services.
- Integration testing for API/database/workflow interactions.
- System testing across complete receiving-to-disposal lifecycle scenarios.
- Role/permission testing for every critical action.
- Concurrency testing for simultaneous stock-affecting transactions.
- Security testing for authentication, authorization, input validation and session behavior.
- Performance testing for normal dashboards, search, transaction posting and agreed report workloads.
- User Acceptance Testing (UAT) with representative store, PAO, TEC, department, accounting and security users.

### 15.2 Critical Acceptance Scenarios

| ID | Scenario | Acceptance criterion |
|---|---|---|
| AT-01 | Receive and accept material | Receipt → TEC evaluation → GRN → SRC/bin update; balances correct. |
| AT-02 | Reject material | TEC rejects receipt; no accepted-stock balance is created. |
| AT-03 | Issue material | Approved requisition → SIV/ISIV → final posting; stock decreases exactly once. |
| AT-04 | Partial issue | Only issued quantity is deducted; remaining approved quantity remains available. |
| AT-05 | Bin transfer | Source decreases and destination increases; transaction trail is complete. |
| AT-06 | Return | Return request → evaluation/approval → correct stock/disposition effect. |
| AT-07 | Stock taking | Physical count produces variance; reconciliation requires authorization and audit. |
| AT-08 | Shelf life | Configured threshold creates alert; expired material follows restricted status. |
| AT-09 | Disposal | Candidate → request → approval → execution; disposal evidence is retained. |
| AT-10 | Authorization | Unauthorized actor cannot approve, post, amend or dispose outside assigned permissions. |

## 16. Implementation Plan and Batching Strategy

Implementation should proceed in controlled batches. Each batch should be independently testable and should not start dependent workflows before the underlying data model and authorization rules are stable.

| Batch | Scope | Exit criterion |
|---|---|---|
| Batch 0 – Clarification & Baseline | Validate document models, authorities, status transitions, store hierarchy, numbering, valuation, partial issues, return/disposal policy. | Approved decision log; requirements frozen for Batch 1. |
| Batch 1 – Foundation | Project setup, database, authentication, RBAC, users, permissions, audit framework. | Users can securely access authorized modules. |
| Batch 2 – Master Data | Stores, departments, categories, items, units, suppliers, locations/bins. | Master data can be created and maintained. |
| Batch 3 – Receiving | Goods Receipt Record, supporting documents, temporary status, evaluation routing. | Receipt workflow works end-to-end. |
| Batch 4 – Technical Evaluation & GRN | TEC evaluation, acceptance/rejection, notifications, GRN / Model 19. | Accepted materials can become stock through approved workflow. |
| Batch 5 – SRC & Bin Ledger | Automatic stock card, bin card, stock transactions, balances and bin transfers. | Perpetual stock balances are reliable. |
| Batch 6 – Requisition & Issue | Store requisitions, approvals, preliminary SIV/ISIV, amendment/approval and final posting. | Issue lifecycle works without balance corruption. |
| Batch 7 – Returns & Transfers | SRN/returns, evaluation, approval, transfer request, approval and execution. | Return/transfer lifecycle works. |
| Batch 8 – Assets, Shelf Life & Disposal | Fixed assets, shelf-life alerts, damage/obsolete, disposal workflow. | Full lifecycle beyond normal stock is covered. |
| Batch 9 – Stock Taking & Reporting | Physical count, reconciliation, valuation, reports and exports. | Management and audit reporting is operational. |
| Batch 10 – Hardening & UAT | Security, performance, backup, usability, accessibility, UAT and deployment. | Release candidate accepted. |

### 16.1 Implementation Rule

> **Do not code through ambiguity:** During implementation, any unclear requirement should be isolated as a clarification item. The developer may implement the unaffected parts of the batch, but the ambiguous workflow must not be finalized until the stakeholder decision is recorded. This prevents hidden assumptions from becoming database constraints or irreversible business logic.

## 17. Risks, Assumptions and Clarification Register

### 17.1 Key Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Unclear organizational approval authority | High | Confirm role-to-action matrix before implementing workflow guards. |
| Inconsistent document names/models | High | Collect approved copies/templates of GRN, SIV/ISIV, SRN and related forms. |
| Different store structures | High | Validate store/department/location hierarchy and whether department stores are independent stock locations. |
| Incorrect stock-posting logic | Critical | Centralize ledger posting and test all receipt/issue/return/transfer scenarios. |
| Scope growth | High | Use change control and prioritize core lifecycle. |
| Late stakeholder feedback | Medium | Use weekly demonstrations and a decision log. |
| Data migration quality | High | Define migration templates, validation and reconciliation before import. |
| Security misconfiguration | High | Security checklist, code review and deployment hardening. |

### 17.2 Clarification Register – Must Be Resolved

| ID | Clarification question | Required evidence |
|---|---|---|
| C-01 | Which exact organizational roles can approve store requisitions? | Role/permission matrix |
| C-02 | Who can approve/reject technical evaluation results? | TEC governance |
| C-03 | Is TEC evaluation mandatory for all received goods or only selected classes? | Receiving policy |
| C-04 | What exact fields and numbering format are required on GRN / Model 19? | Official form/template |
| C-05 | The supplied description mentions preliminary SIV/ISIV and also Model 20/Model 22. Which model belongs to which stage? | Official SIV/ISIV forms |
| C-06 | Can a requisition be partially issued? If yes, how many partial issues are allowed? | Issue policy |
| C-07 | Can an approved/finalized SIV/ISIV be amended? If yes, who can amend and how is the original preserved? | Document control policy |
| C-08 | What exactly constitutes 'accepted stock' for accounting and inventory posting? | Finance/store policy |
| C-09 | What are the rules for returns: restock, quarantine, repair, disposal or replacement? | Return policy |
| C-10 | What transfer types exist: bin-to-bin, store-to-store, department-to-store, or all? | Transfer policy |
| C-11 | What shelf-life thresholds and date fields apply to each material category? | Shelf-life policy |
| C-12 | What committee/authority approves disposal and what evidence is required? | Disposal policy |
| C-13 | Is FIFO required for quantity issue selection as well as financial valuation, or only valuation? | Accounting/store policy |
| C-14 | Are negative balances ever allowed as an exception? | Stock control policy |
| C-15 | What document numbering/sequence rules must the system enforce? | Document control policy |
| C-16 | Which reports are legally/administratively required and what exact layouts are expected? | Reporting requirements |
| C-17 | Which data must be migrated from existing paper/spreadsheets, and from what date? | Migration scope |

### 17.3 Assumptions Used in This SRS

- PostgreSQL is selected as the primary database because the consolidated architecture benefits from strong transactional integrity.
- The web application is the first-release client.
- The system is designed for a single organization in the first release.
- Stock balances are derived from controlled transactions rather than direct user edits.
- Document templates and approval authorities will be validated with stakeholders before final workflow implementation.
- The original FIFO requirement remains the baseline until the responsible authority confirms or changes it.

## 18. Feasibility, Schedule and Cost

### 18.1 Technical Feasibility

The system is technically feasible using a modern web stack. The original SRS identified React/Next.js, Node.js/Express.js, PostgreSQL/MySQL, REST APIs, Postman, Figma, Visual Studio Code and Git/GitHub. This consolidated version selects PostgreSQL as the preferred transactional database while retaining the architectural principles.

### 18.2 Operational Feasibility

The system is intended to support the existing workflow rather than replace organizational authority. Storekeepers, stock clerks, PAO, accountants, department heads, TEC members, property registration officers and security personnel receive role-specific interfaces. Training and gradual migration should reduce resistance to change.

### 18.3 Original Schedule Baseline

| Activity | Original duration |
|---|---|
| Requirement gathering | 1 week |
| System analysis | 1 week |
| System design | 2 weeks |
| Database design | 1 week |
| Implementation | 4 weeks |
| Testing | 2 weeks |
| Deployment | 1 week |
| Documentation | 1 week |
| **Total** | **Approximately 13 weeks** |

### 18.4 Original Cost Baseline

| Item | Estimated cost (ETB) |
|---|---|
| Internet and communication | 2,000 |
| Transportation | 1,500 |
| Documentation and printing | 2,500 |
| Software tools | 1,000 |
| Hosting and deployment | 3,000 |
| Miscellaneous expenses | 2,000 |
| **Total** | **12,000** |

The cost and schedule above are retained from the original SRS as baseline estimates. They should be revised if the expanded workflow scope materially changes implementation effort or deployment requirements.

## 19. Requirements Traceability Matrix

| Capability | Functional requirements | Use cases | Acceptance coverage |
|---|---|---|---|
| Receiving | FR-10–FR-16 | UC-08–UC-10 | AT-01, AT-02 |
| Stock cards | FR-17–FR-19 | UC-11–UC-12 | AT-01, AT-03 |
| Bin cards | FR-20–FR-23 | UC-13–UC-14 | AT-05 |
| Requisition | FR-24–FR-26 | UC-15–UC-16 | AT-03, AT-04 |
| SIV/ISIV | FR-27–FR-30 | UC-17–UC-19 | AT-03, AT-04 |
| Returns | FR-32–FR-34 | UC-21–UC-23 | AT-06 |
| Transfers | FR-35–FR-36 | UC-24–UC-26 | AT-05 |
| Shelf life | FR-37 | UC-27 | AT-08 |
| Disposal | FR-38–FR-39 | UC-28–UC-30 | AT-09 |
| Stock taking | FR-40 | UC-31–UC-32 | AT-07 |
| Security/RBAC | FR-01–FR-04 | UC-01–UC-02 | AT-10 |
| Reports/Audit | FR-42–FR-46 | UC-37–UC-42 | Report/UAT suites |

## 20. References

1. Ministry of Finance and Economic Development (MoFED), Stock Management Manual, Addis Ababa, Ethiopia, 2010.
2. IEEE Computer Society, IEEE Recommended Practice for Software Requirements Specifications (IEEE 830-1998).
3. Ian Sommerville, Software Engineering, 10th Edition, Pearson Education, 2015.
4. Roger S. Pressman, Software Engineering: A Practitioner's Approach, 8th Edition, McGraw-Hill, 2014.
5. Abraham Silberschatz, Henry Korth and S. Sudarshan, Database System Concepts, 7th Edition.
6. Official documentation for the selected React/Next.js, Node.js/Express.js and PostgreSQL technologies.

## Appendix A – Glossary

| Term | Meaning |
|---|---|
| API | Application Programming Interface. |
| Audit Log | Record of user/system activity for accountability and traceability. |
| Bin Card | Record of material movement and balance for a specific storage bin/location. |
| FIFO | First-In, First-Out; valuation method retained from the original SRS. |
| GRN | Goods Receiving Note; receiving document, referred to in the supplied requirements as Model 19. |
| ISIV | Inter-Store Issue Voucher. |
| PAO | Property Administration Officer. |
| RBAC | Role-Based Access Control. |
| SIV | Store Issue Voucher. |
| SRC | Stock Record Card / Stock Card. |
| SRN | Store Return Note. |
| TEC | Technical Evaluation Committee. |
| UAT | User Acceptance Testing. |

## Appendix B – Sample Electronic Forms

### B.1 Goods Receipt Record

- Receipt number and date.
- Supplier/donor and source reference.
- Purchase order/donation/supporting document references.
- Store and receiving officer.
- Item code, description, unit, quantity, condition and remarks.
- Temporary receipt status.
- TEC evaluation requirement and routing.
- Attachment/evidence references.

### B.2 GRN / Model 19

- GRN number/date.
- Receipt/source reference.
- Supplier/donor.
- Accepted item lines and quantities.
- Acceptance/evaluation references.
- Store/location.
- Authorized signatures/approvals as required.
- Generated document metadata.

### B.3 Store Requisition

- Requisition number/date.
- Requesting department/user.
- Requested items and quantities.
- Purpose/justification.
- Approval status and remarks.
- Issue status and outstanding quantities.

### B.4 SIV / ISIV

- Issue document number/date.
- Source store and destination department/store.
- Approved requisition reference.
- Item lines, requested quantity, issued quantity and unit.
- Approvals/amendments.
- Final posting status.
- Gate/dispatch reference where applicable.

### B.5 Store Return Note

- Return number/date.
- Original issue/SIV reference.
- Returned item and quantity.
- Reason and condition.
- Technical evaluation result where required.
- Approval/disposition.
- Resulting stock transaction.

### B.6 Disposal Request

- Disposal request number/date.
- Item/asset references.
- Reason and condition.
- Supporting evidence.
- Committee/authority decision.
- Disposal method and completion date.
- Final inventory/asset status.

## Appendix C – Initial Permission Matrix

| Permission | Admin | PAO | Store | TEC | Acct | Other |
|---|---|---|---|---|---|---|
| Manage users | Admin | — | — | — | — | — |
| Manage stores/categories/items | Admin | PAO | Store | — | — | — |
| Create receipt | Admin | PAO | Store | — | — | — |
| Evaluate receipt | Admin | PAO | — | TEC | — | — |
| Generate GRN | Admin | PAO | Store | — | — | — |
| View stock cards | Admin | PAO | Store | Stock | Acct | Dept |
| Create requisition | Admin | PAO | — | — | — | Dept |
| Approve requisition | Admin | PAO | — | — | — | Dept Head |
| Prepare SIV/ISIV | Admin | PAO | Store | — | — | — |
| Approve SIV/ISIV | Admin | PAO | — | — | — | Authorized |
| Register fixed asset | Admin | PAO | — | — | Acct | Property Reg. |
| Approve return | Admin | PAO | Store | TEC | — | — |
| Approve transfer | Admin | PAO | Store | — | — | — |
| Disposal workflow | Admin | PAO | — | Committee | Acct | — |
| Audit logs | Admin | PAO | — | — | — | — |

This is an initial RBAC baseline. The organization must approve the final permission matrix, especially where the same person may hold multiple operational responsibilities.

## Approval and Baseline Statement

This consolidated SRS is intended to serve as the requirements baseline for implementation of the Stock Management System. It combines the original SRS's objectives, existing-system analysis, feasibility information, architecture, RBAC, reporting, audit and core inventory functions with the detailed operational use cases supplied for store, receiving, technical evaluation, GRN, stock-card, bin-card, requisition, SIV/ISIV, asset, return, transfer, shelf-life and disposal management.

Before a production release, stakeholders should approve the clarification register and the final document templates, authority matrix, status transitions, valuation rules, numbering rules and exception policies. Approved clarifications should be versioned and traced to the affected functional requirement, use case, database rule and test case.

> **Baseline principle:** The system should automate approved organizational processes—not invent new policy. Where requirements are unclear, clarification is part of implementation and must be documented before the affected business rule is finalized.
