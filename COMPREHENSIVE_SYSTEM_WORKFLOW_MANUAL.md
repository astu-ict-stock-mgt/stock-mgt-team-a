# Stock Management System (SMS) — Comprehensive Operational & Workflow Manual

> **Document Type:** System Operations Blueprint & RAG Knowledge Manual  
> **Version:** 2.0 Enterprise  
> **Standard Format:** Structured Step-by-Step (`Who` $\to$ `Action` $\to$ `Result`) for all workflows.  
> **Compliance & Architecture Traceability:** SRS Appendix C (Role & Permission Matrix), FIFO Valuation Engine, Strict Segregation of Duties (SoD), Immutable Audit Trail.

---

## Quick Reference: Default System Credentials

| Role Code | Role Name | Default Email | Password |
| :--- | :--- | :--- | :--- |
| **`ADMIN`** | System Administrator | `admin@stockmgt.gov.et` | `password` |
| **`PAO`** | Property Administration Officer | `pao@stockmgt.gov.et` | `password` |
| **`STOREKEEPER`** | Storekeeper / Store Head | `storekeeper@stockmgt.gov.et` | `password` |
| **`TEC`** | Technical Evaluation Committee Lead | `tec@stockmgt.gov.et` | `password` |
| **`ACCOUNTANT`** | Chief Financial Accountant | `accountant@stockmgt.gov.et` | `password` |
| **`PROPERTY_REGISTRATION_OFFICER`** | Property Registration Officer (PRO) | `pro@stockmgt.gov.et` | `password` |
| **`DEPARTMENT_HEAD`** | Department Head | `depthead@stockmgt.gov.et` | `password` |
| **`SECURITY_OFFICER`** | Security Officer | `security@stockmgt.gov.et` | `password` |
| **`REQUESTER`** | Department Requester | `requester@stockmgt.gov.et` | `password` |

---

# Table of Contents
1. [Workflow 1: Goods Receiving & Inspection (GRN Lifecycle)](#workflow-1-goods-receiving--inspection-grn-lifecycle)
2. [Workflow 2: Fixed Asset Registration & Tagging Lifecycle](#workflow-2-fixed-asset-registration--tagging-lifecycle)
3. [Workflow 3: Material Requisition & Departmental Approval](#workflow-3-material-requisition--departmental-approval)
4. [Workflow 4: Store Issue Voucher (SIV), Allocation & FIFO Dispatch](#workflow-4-store-issue-voucher-siv-allocation--fifo-dispatch)
5. [Workflow 5: Gate Pass & Checkpoint Security Verification](#workflow-5-gate-pass--checkpoint-security-verification)
6. [Workflow 6: Inter-Store Stock Transfer Lifecycle](#workflow-6-inter-store-stock-transfer-lifecycle)
7. [Workflow 7: Stock Taking & Physical Reconciliation](#workflow-7-stock-taking--physical-reconciliation)
8. [Workflow 8: Material Disposal Lifecycle](#workflow-8-material-disposal-lifecycle)
9. [Workflow 9: Stock Returns & Restocking (SIV-Linked Returns)](#workflow-9-stock-returns--restocking-siv-linked-returns)
10. [Workflow 10: Master Data & User Administration](#workflow-10-master-data--user-administration)
11. [Workflow 11: Real-Time Auditing, Ledger Tracking & Financial Reporting](#workflow-11-real-time-auditing-ledger-tracking--financial-reporting)

---

# Workflow 1: Goods Receiving & Inspection (GRN Lifecycle)

### Step 1: Receiving Note Creation (Storekeeper)
* **Who:** Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Navigate to the **Receiving** tab (`/stock-receiving`) in the sidebar and click **"+ New Goods Receipt"**.
  2. Select the **Supplier** and the target **Receiving Store**.
  3. Enter the vendor's **Purchase Order (PO) / Delivery Note Number** and arrival date.
  4. Add delivered item lines: select the item, enter purchase unit cost, quantity delivered, physical batch/lot number, and expiry date (if perishable).
  5. Click **"Submit for Inspection"**.
* **Result:**
  * A `GoodsReceipt` record is created in **`UNDER_INSPECTION`** status.
  * An automated notification is sent to the Technical Evaluation Committee (`TEC`).

---

### Step 2: Technical Quality & Specification Inspection (TEC Committee)
* **Who:** Technical Evaluation Committee Member (`tec@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Navigate to the **Material Evaluation** tab (`/material-evaluation`) in the sidebar.
  2. Select the newly submitted receiving note under the **Pending Inspection** list.
  3. Physically verify items against procurement standards and specifications.
  4. For each line item, specify:
     * **Accepted Quantity**
     * **Rejected Quantity**
     * **Defect Reason** (e.g. *Damaged in transit*, *Specification mismatch*, *Quality failure*)
     * Technical assessment notes and test evidence remarks.
  5. Click **"Submit Evaluation Decision"** (`ACCEPTED`, `PARTIALLY_ACCEPTED`, or `REJECTED`).
* **Result:**
  * The receipt status advances to **`EVALUATED`**.
  * The accepted vs. rejected quantities are recorded and locked against tampering.
  * Storekeeper receives an alert that technical evaluation is complete.

---

### Step 3: Goods Receiving Note (GRN) Generation (Storekeeper)
* **Who:** Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the **Receiving** tab (`/stock-receiving`) and click on the evaluated receipt.
  2. Review the accepted quantities and evaluation notes registered by the TEC.
  3. Click **"Generate GRN"**.
* **Result:**
  * The system issues an official sequential Goods Receiving Note (e.g. `GRN-202608-00002`).
  * The receipt status transitions to **`GRN_GENERATED`**.
  * The GRN document is rendered with full supplier, batch, and inspection traceability.

---

### Step 4: Stock Card Posting & FIFO Layer Entry (Storekeeper)
* **Who:** Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. In the GRN view, click **"Post to Stock Cards"**.
* **Result:**
  * The physical store ledger updates instantly in the database.
  * The accepted quantities are credited to each item's **Stock Card** (`RECEIPT` transaction).
  * A new **FIFO cost layer** is created with the exact unit purchase cost and batch reference.
  * The receipt status changes to **`POSTED`**.
  * If items belong to fixed asset categories, a notification is dispatched to the Property Registration Officer (`PRO`) for tagging.

---

# Workflow 2: Fixed Asset Registration & Tagging Lifecycle

### Step 1: Identification of Capital Receipts (PRO)
* **Who:** Property Registration Officer (`pro@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Navigate to the **Asset Register** tab (`/asset-register`) in the sidebar.
  2. Click on the **"Pending Registration"** tab.
  3. Review incoming Goods Receipts (`GRN`) containing non-consumable, capital items (e.g. Workstation Laptops, Vehicles, Office Equipment) that have remaining unregistered units.
* **Result:**
  * The system displays the pending quantity count (e.g. *Pending: 9 of 12 items*).

---

### Step 2: Asset Tagging & Custodian Assignment (PRO)
* **Who:** Property Registration Officer (`pro@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Click **"Register Asset"** next to the eligible receipt item line.
  2. In the registration modal, provide:
     * **Asset Name**
     * **Asset Tag Number** (Unique organizational barcode/tag e.g. `AST-2026-0089`)
     * **Manufacturer Serial Number**
     * **Physical Location** (Building / Room)
     * **Assigned Department / Custodian**
     * Initial operational condition (e.g. `IN_SERVICE`).
  3. Click **"Confirm Registration"**.
* **Result:**
  * A new `FixedAsset` master record is saved to the database.
  * The pending count on the source Goods Receipt line decrements automatically.
  * The asset appears in the active **Fixed Asset Register** list with its historical GRN purchase cost.

---

### Step 3: Asset Lifecycle Maintenance (PRO)
* **Who:** Property Registration Officer (`pro@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Under the **"Asset Register"** tab, locate any registered asset.
  2. Update asset tracking details over its lifecycle: change operational status (`IN_SERVICE`, `UNDER_MAINTENANCE`, `TRANSFERRED`, `DISPOSED`), reassign room locations, or record custodian transfers.
* **Result:**
  * The asset ledger updates with real-time audit logs of the change.

---

### Step 4: Financial & Capitalization Verification (Accountant - Read-Only)
* **Who:** Chief Financial Accountant (`accountant@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Navigate to the **Asset Register** tab (`/asset-register`).
  2. Review total asset valuation, capitalized acquisition costs, and registered asset lists.
* **Result:**
  * Complete financial oversight without conflicting with the PRO's physical registration authority (the "Register Asset" action buttons are completely hidden from the Accountant).

---

# Workflow 3: Material Requisition & Departmental Approval

### Step 1: Requisition Creation (Department Requester)
* **Who:** Department Requester (`requester@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Navigate to the **Issuing** tab (`/stock-issuing`) in the sidebar.
  2. Click **"+ New Requisition"**.
  3. Select your **Department**, the target **Issuing Store**, and the **Urgency Level** (`LOW`, `MEDIUM`, `HIGH`).
  4. Add required item lines, specifying item name, quantity needed, and operational justification.
  5. Click **"Submit Requisition"**.
* **Result:**
  * A `Requisition` record is created in **`SUBMITTED`** status.
  * An automated notification is sent to the Department Head.

---

### Step 2: Departmental Review & Authorization (Department Head)
* **Who:** Department Head (`depthead@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the **Issuing** tab (`/stock-issuing`) and view the **"Requisitions"** list.
  2. Open the pending requisition submitted by their departmental staff.
  3. Review requested items against department priorities and material necessity.
  4. Click **"Approve Requisition"** (or enter a rejection reason and click **"Reject Requisition"**).
* **Result:**
  * If approved: The status updates to **`APPROVED`**, notifying the Storekeeper to prepare goods.
  * If rejected: The status updates to **`REJECTED`**, notifying the Requester of the refusal reason.

---

# Workflow 4: Store Issue Voucher (SIV), Allocation & FIFO Dispatch

### Step 1: SIV Preparation & FIFO Batch Allocation (Storekeeper)
* **Who:** Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the **Issuing** tab (`/stock-issuing`) and locate the approved requisition (`APPROVED`).
  2. Click **"Prepare SIV"**.
  3. The system's FIFO engine automatically allocates required quantities from the oldest available stock batches and displays calculated unit issue costs.
  4. Verify storage bin numbers and add issue notes.
  5. Click **"Submit SIV for Authorization"**.
* **Result:**
  * A Store Issue Voucher (`SIV`) is generated in **`PENDING_APPROVAL`** status.
  * An alert is routed to the Property Administration Officer (`PAO`).

---

### Step 2: Administrative Property Release Authorization (PAO)
* **Who:** Property Administration Officer (`pao@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the **Issuing** tab (`/stock-issuing`) and locate the SIV under the **SIV Management** section.
  2. Inspect the allocated item lines, FIFO unit valuations, and requisition purpose.
  3. Click **"Approve SIV"** (or click **"Reject SIV"** if unauthorized).
* **Result:**
  * The SIV status transitions to **`APPROVED`**.
  * The Storekeeper is authorized to execute physical material dispatch.

---

### Step 3: Physical Material Issue & Stock Card Deduction (Storekeeper)
* **Who:** Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the approved SIV in the **Issuing** tab.
  2. Physically retrieve and package the materials from store bins.
  3. Click **"Issue Materials & Post to Stock Cards"**.
* **Result:**
  * The SIV status changes to **`FINALIZED` / `ISSUED`**.
  * The item quantities are permanently deducted from the warehouse **Stock Card** (`ISSUE` transaction).
  * The original Requisition is updated to **`FULFILLED`**.
  * The requester is notified that items are ready for pickup/dispatch.

---

# Workflow 5: Gate Pass & Checkpoint Security Verification

### Step 1: Gate Pass Generation (Storekeeper)
* **Who:** Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the finalized SIV in the **Issuing** tab (`/stock-issuing`).
  2. Click **"Generate Gate Pass"**.
  3. Enter Driver Full Name, Vehicle Plate Number, and Exit Gate location.
  4. Print / dispatch the digital Gate Pass.
* **Result:**
  * An active `GatePass` record is created in **`PENDING_EXIT`** status.

---

### Step 2: Security Checkpoint Verification (Security Officer)
* **Who:** Security Officer (`security@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Navigate to the **Gate Control** tab (`/gate-control`) in the sidebar.
  2. Search the Gate Pass Number or scan the SIV Reference.
  3. Physically inspect the vehicle/goods to ensure materials loaded strictly match the authorized voucher lines.
  4. Click **"Verify & Authorize Exit"**.
* **Result:**
  * The Gate Pass status is marked as **`CLEARED` / `EXITED`**.
  * The verification timestamp and Security Officer ID are permanently recorded in the security audit log.

---

# Workflow 6: Inter-Store Stock Transfer Lifecycle

### Step 1: Transfer Requisition Initiation (Source Storekeeper)
* **Who:** Source Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Navigate to the **Transfer** tab (`/stock-transfer`) in the sidebar.
  2. Click **"+ New Transfer Request"**.
  3. Select **Source Store**, **Destination Store**, transfer reason, and items with transfer quantities.
  4. Click **"Submit Transfer Request"**.
* **Result:**
  * A `Transfer` record is created in **`PENDING_APPROVAL`** status.
  * A notification is dispatched to the PAO.

---

### Step 2: Transfer Authorization (PAO)
* **Who:** Property Administration Officer (`pao@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the **Transfer** tab (`/stock-transfer`).
  2. Select the pending transfer request and verify stock balance feasibility.
  3. Click **"Approve Transfer"**.
* **Result:**
  * The transfer status transitions to **`APPROVED`**.

---

### Step 3: Physical Dispatch & In-Transit Deduction (Source Storekeeper)
* **Who:** Source Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the approved transfer in the **Transfer** tab.
  2. Prepare physical materials and click **"Dispatch Stock"**.
* **Result:**
  * The transfer status changes to **`IN_TRANSIT`**.
  * Quantities are deducted from the Source Store Stock Cards (`TRANSFER_OUT`).

---

### Step 4: Destination Verification & Re-shelving (Destination Storekeeper)
* **Who:** Destination Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the **Transfer** tab (`/stock-transfer`) and locate the incoming `IN_TRANSIT` shipment.
  2. Count and verify arriving items.
  3. Click **"Confirm Receipt & Re-shelve"**.
* **Result:**
  * The transfer status becomes **`COMPLETED`**.
  * Quantities are credited to the Destination Store Stock Cards (`TRANSFER_IN`).

---

# Workflow 7: Stock Taking & Physical Reconciliation

### Step 1: Stocktake Session Initiation (Storekeeper / PAO)
* **Who:** Storekeeper or PAO
* **Action:**
  1. Navigate to the **Stock Taking** tab (`/stock-taking`) in the sidebar.
  2. Click **"Start New Stocktake"**.
  3. Select the target **Store** and **Item Category**.
  4. Click **"Initiate Count Snapshot"**.
* **Result:**
  * A new `StockTaking` session is initiated.
  * System freezes a snapshot of current system ledger balances for comparison.

---

### Step 2: Physical Count Entry & Variance Calculation (Storekeeper)
* **Who:** Storekeeper / Physical Counting Team
* **Action:**
  1. Count the physical items across warehouse shelves and bins.
  2. Enter the actual counted quantities into the stocktaking grid.
  3. The system automatically computes discrepancies: $\text{Variance} = \text{Physical Count} - \text{System Balance}$.
  4. Enter justification notes for any detected variance (e.g. *Found unrecorded damaged unit*, *Counting discrepancy*).
  5. Click **"Submit for PAO Reconciliation"**.
* **Result:**
  * The stocktake status moves to **`SUBMITTED_FOR_REVIEW`**.

---

### Step 3: Discrepancy Reconciliation & Ledger Adjustment (PAO)
* **Who:** Property Administration Officer (`pao@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the submitted stocktake session in the **Stock Taking** tab.
  2. Review variance amounts and financial impact with the Accountant.
  3. Click **"Approve & Post Reconciliation Adjustments"**.
* **Result:**
  * The session status is marked as **`COMPLETED`**.
  * Store Stock Cards are adjusted automatically to match physical inventory (`ADJUSTMENT` transaction).
  * An immutable reconciliation record is logged in the audit trail.

---

# Workflow 8: Material Disposal Lifecycle

### Step 1: Disposal Request Initiation (Storekeeper)
* **Who:** Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Navigate to the **Disposal** tab (`/disposal-requests`) in the sidebar.
  2. Click **"+ New Disposal Request"**.
  3. Select the **Store**, **Item**, **Quantity**, and **Disposal Reason** (`DAMAGED`, `EXPIRED`, `OBSOLETE`, `SCRAP`).
  4. Enter details describing the condition and click **"Submit for Evaluation"**.
* **Result:**
  * A `Disposal` request is created in **`SUBMITTED`** status.
  * Notification is sent to the Technical Evaluation Committee (`TEC`).

---

### Step 2: Technical Condition Assessment (TEC Committee)
* **Who:** Technical Evaluation Committee Member (`tec@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the **Disposal** tab (`/disposal-requests`) and select the submitted disposal item.
  2. Physically inspect the item to verify that it is unserviceable or beyond economic repair.
  3. Enter detailed technical evaluation notes and click **"Submit Evaluation Remarks"**.
* **Result:**
  * The disposal request status advances to **`UNDER_EVALUATION`**.
  * The PAO is notified that the request is ready for final decision.

---

### Step 3: Disposal Method Authorization (PAO)
* **Who:** Property Administration Officer (`pao@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the evaluated disposal request in the **Disposal** tab.
  2. Review the TEC assessment.
  3. Select the authorized **Disposal Method** (`AUCTION`, `DESTRUCTION`, `RECYCLING`, `DONATION`).
  4. Enter approval remarks and click **"Approve Disposal"** (or **"Reject Disposal"**).
* **Result:**
  * The disposal request status updates to **`APPROVED`**.

---

### Step 4: Physical Scrapping Execution & Ledger Removal (Storekeeper)
* **Who:** Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the approved disposal order in the **Disposal** tab.
  2. Carry out the physical destruction/auction of the items.
  3. Click **"Execute Physical Disposal & Deduct Stock"**.
* **Result:**
  * The disposal status becomes **`EXECUTED`**.
  * Quantities are permanently written off store **Stock Cards** (`DISPOSAL` transaction).

---

# Workflow 9: Stock Returns & Restocking (SIV-Linked Returns)

### Step 1: Return Request Initiation (Storekeeper or Requester)
* **Who:** Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`) or Department Requester (`requester@stockmgt.gov.et`)
* **Action:**
  1. Navigate to the **Returns** tab (`/returns`) in the sidebar and click **"+ New Return Request"**.
  2. Select a reference finalized **SIV (Store Issue Voucher)** from the dropdown.
  3. The system dynamically pulls SIV context: the original store, issued item lines, and max quantities issued.
  4. Specify returned quantities (validated $\le$ issued quantity) and select the reason (e.g. *Unused*, *Defective*, *Expired*, *Wrong Spec*).
  5. Click **"Submit Return Note"**.
* **Result:**
  * The return request is created in **`SUBMITTED`** status.
  * Notification is sent to the Technical Evaluation Committee (`TEC`).

---

### Step 2: Technical Evaluation (TEC Committee)
* **Who:** Technical Evaluation Committee Member (`tec@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the returns list and click on the newly submitted return request to view details.
  2. Under the **Workflow Authorization Panel**, enter **Technical Assessment Remarks** detailing the physical state of the returned materials.
  3. Click **"Submit Evaluation Notes"**.
* **Result:**
  * The return request status advances to **`UNDER_EVALUATION`**.
  * The PAO is notified that technical assessment is complete.

---

### Step 3: Approval & Disposition Selection (PAO)
* **Who:** Property Administration Officer (`pao@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open the request in the **Returns** tab to review SIV data and TEC evaluation notes.
     *(Note: If still `SUBMITTED`, the UI displays a helpful banner: "⏳ Awaiting Technical Evaluation", preventing premature approvals).*
  2. Select the final **Stock Disposition Action**:
     * **Restock / Re-shelve:** Items are in perfect condition and should go back to active inventory.
     * **Quarantine / Send to Repair / Flag for Disposal / Awaiting Replacement:** Items are damaged/defective and cannot be returned to active shelves.
  3. Enter disposition remarks.
  4. Click **"Approve Request"** (or **"Reject Request"**).
  5. *Optional Decision Override:* If a choice was made by mistake, the PAO can click **"Modify Decision"** at any time before restocking to change the disposition or approval state.
* **Result:**
  * The return request status becomes **`APPROVED`** (or **`REJECTED`**).

---

### Step 4: Restocking Execution & Ledger Posting (Storekeeper)
* **Who:** Storekeeper (`storekeeper@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. If the return request is approved with a **Restock** disposition, the Storekeeper opens the request details.
  2. Under the workflow panel, click **"Confirm Restock & Post"**.
* **Result:**
  * The ledger entry writes to the database.
  * Dynamically increments the item's balance back onto its corresponding store **Stock Card**.
  * Logs a ledger transaction record of type `RETURN` visible in the **Tracking** history tab.
  * The request is marked as **`POSTED / RESTOCKED`** (Closed).

---

# Workflow 10: Master Data & User Administration

### Step 1: Warehouse & Store Management (PAO)
* **Who:** Property Administration Officer (`pao@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Navigate to **Stores** (`/stores`) → Click **"+ Add Store"**.
  2. Enter Store Name, Facility Code, Location Address, Assigned Storekeeper, and Linked Departments.
  3. Click **"Save Store"**.
* **Result:**
  * Store facility is registered for receiving, storage, and transfers.

---

### Step 2: Item Catalog, Categories & Units Setup (PAO)
* **Who:** Property Administration Officer (`pao@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Open **Categories** (`/categories`) and **Units** (`/units`) to define measurement units (e.g. *Pieces*, *Boxes*, *Kg*) and taxonomies.
  2. Open **Inventory** (`/inventory`) → Click **"+ Add Item"**.
  3. Specify Item Code, Item Name, Category, Unit of Measurement, Reorder Threshold, and flag whether it is a **Fixed Asset**.
  4. Click **"Save Item"**.
* **Result:**
  * The item is active in the enterprise material catalog.

---

### Step 3: User Provisioning & Access Control (Administrator)
* **Who:** System Administrator (`admin@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Navigate to **Users** (`/users`) in the sidebar.
  2. Click **"+ Add User"**.
  3. Provide User Full Name, Official Email Address, Department, and assign the appropriate **System Role** (`ADMIN`, `PAO`, `STOREKEEPER`, `TEC`, `ACCOUNTANT`, `PROPERTY_REGISTRATION_OFFICER`, `DEPARTMENT_HEAD`, `SECURITY_OFFICER`, `REQUESTER`).
  4. Set initial password and click **"Create User"**.
* **Result:**
  * Account is provisioned with role-based permission boundaries strictly enforced.

---

# Workflow 11: Real-Time Auditing, Ledger Tracking & Financial Reporting

### Step 1: Real-Time Stock Card & Bin Card Ledger Tracking (All Roles)
* **Who:** Storekeeper, PAO, Accountant, Admin
* **Action:**
  1. Navigate to **Tracking** (`/stock-tracking`) in the sidebar.
  2. Select any warehouse store and item.
  3. View running Stock Cards, current balances, minimum stock alerts, bin card locations, and transaction records (`RECEIPT`, `ISSUE`, `TRANSFER_IN`, `TRANSFER_OUT`, `RETURN`, `ADJUSTMENT`, `DISPOSAL`).
* **Result:**
  * Full real-time ledger transparency with audit references.

---

### Step 2: Inventory Valuation & FIFO Accounting Reports (Accountant & PAO)
* **Who:** Chief Financial Accountant (`accountant@stockmgt.gov.et`) & PAO
* **Action:**
  1. Navigate to **Reports** (`/reports`) in the sidebar.
  2. Select report type: **FIFO Inventory Valuation**, **Category Value Distribution**, **Stock Movement Summary**, or **Aging & Slow-Moving Stock**.
  3. Export or review live financial summaries.
* **Result:**
  * Generates balance sheet inventory assets valuations based on historical purchase costs.

---

### Step 3: Security & Compliance Audit Log Review (Administrator)
* **Who:** System Administrator (`admin@stockmgt.gov.et` / `password: password`)
* **Action:**
  1. Navigate to **Audit Log** (`/audit`) in the sidebar.
  2. Filter audit events by User, Action Type, Entity, or Date Range.
  3. Inspect details including IP address, user agent, action verb, and before/after database changes.
* **Result:**
  * Full audit trail verification meeting regulatory and compliance standards.

---
*End of Operational & Workflow Manual.*
