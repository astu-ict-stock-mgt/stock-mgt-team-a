const path = require('path');
const pptxgen = require('pptxgenjs');

async function buildComprehensiveDeck() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 16:9 (13.33 x 7.5 inches)

  // Color Palette
  const NAVY = '102C57';        // Deep ASTU Navy
  const GOLD = 'C59B27';        // Warm Gold / Mustard
  const WHITE = 'FFFFFF';
  const DARK = '1E293B';        // Slate 800
  const LIGHT_BG = 'F8FAFC';    // Clean Off-White
  const CARD_BG = 'FFFFFF';
  const TEAL = '0D746C';        // Deep Teal
  const BLUE = '1D4ED8';        // Vibrant Blue
  const CRIMSON = '991B1B';     // Warning/Problem
  const GREEN = '166534';       // Success/Approved
  const MUTED = '475569';       // Slate 600

  // Helper for slide headers with large fonts
  function addHeader(slide, title, category = "ASTU STOCK & PROPERTY MANAGEMENT SYSTEM") {
    // Category pill / tracker
    slide.addText(category.toUpperCase(), {
      x: 0.8, y: 0.4, w: 11.7, h: 0.35,
      fontSize: 12, bold: true, color: GOLD
    });
    // Main Title - Big and clear
    slide.addText(title, {
      x: 0.8, y: 0.75, w: 11.7, h: 0.75,
      fontSize: 26, bold: true, color: NAVY
    });
    // Sleek divider line
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: 1.55, w: 11.7, h: 0.025,
      fill: { color: 'CBD5E1' }, line: { color: 'CBD5E1' }
    });
  }

  // Helper for 2 large visual cards (Left vs Right)
  function addTwoColumnCards(slide, leftTitle, leftItems, leftColor, rightTitle, rightItems, rightColor) {
    // Left card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.8, w: 5.65, h: 5.1,
      fill: { color: WHITE }, line: { color: leftColor, width: 2.5 }
    });
    slide.addText(leftTitle, {
      x: 1.1, y: 2.05, w: 5.05, h: 0.5,
      fontSize: 20, bold: true, color: leftColor
    });
    let yL = 2.7;
    leftItems.forEach(item => {
      slide.addText("•  " + item, {
        x: 1.1, y: yL, w: 5.05, h: 0.75,
        fontSize: 15, color: DARK, lineSpacing: 20
      });
      yL += 0.8;
    });

    // Right card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 6.85, y: 1.8, w: 5.65, h: 5.1,
      fill: { color: WHITE }, line: { color: rightColor, width: 2.5 }
    });
    slide.addText(rightTitle, {
      x: 7.15, y: 2.05, w: 5.05, h: 0.5,
      fontSize: 20, bold: true, color: rightColor
    });
    let yR = 2.7;
    rightItems.forEach(item => {
      slide.addText("✓  " + item, {
        x: 7.15, y: yR, w: 5.05, h: 0.75,
        fontSize: 15, color: DARK, lineSpacing: 20
      });
      yR += 0.8;
    });
  }

  // Helper for 3 large step cards vertically
  function addThreeStepCards(slide, steps) {
    steps.forEach((st, i) => {
      const top = 1.85 + i * 1.7;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: top, w: 11.7, h: 1.45,
        fill: { color: WHITE }, line: { color: st.color || NAVY, width: 2 }
      });
      // Step badge
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: top, w: 0.25, h: 1.45,
        fill: { color: st.color || NAVY }, line: { color: st.color || NAVY }
      });
      slide.addText(st.step, {
        x: 1.25, y: top + 0.15, w: 11.0, h: 0.4,
        fontSize: 18, bold: true, color: st.color || NAVY
      });
      slide.addText(st.desc, {
        x: 1.25, y: top + 0.6, w: 11.0, h: 0.75,
        fontSize: 15, color: DARK, lineSpacing: 20
      });
    });
  }

  // Helper for 4 steps vertically (clean, large text)
  function addFourStepCards(slide, steps) {
    steps.forEach((st, i) => {
      const top = 1.8 + i * 1.28;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: top, w: 11.7, h: 1.12,
        fill: { color: WHITE }, line: { color: st.color || NAVY, width: 2 }
      });
      // Left border accent
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: top, w: 0.2, h: 1.12,
        fill: { color: st.color || NAVY }, line: { color: st.color || NAVY }
      });
      slide.addText(st.step, {
        x: 1.2, y: top + 0.12, w: 11.1, h: 0.35,
        fontSize: 17, bold: true, color: st.color || NAVY
      });
      slide.addText(st.desc, {
        x: 1.2, y: top + 0.5, w: 11.1, h: 0.55,
        fontSize: 14.5, color: DARK
      });
    });
  }

  // =========================================================================
  // SECTION 1: TITLE & PROJECT BACKGROUND
  // =========================================================================

  // SLIDE 1: Title
  {
    const s = pptx.addSlide();
    s.background = { color: NAVY };
    s.addText("ADAMA SCIENCE & TECHNOLOGY UNIVERSITY (ASTU)", {
      x: 1.0, y: 1.5, w: 11.3, h: 0.4,
      fontSize: 16, bold: true, color: GOLD
    });
    s.addText("Automated Institutional Stock & Property Management System", {
      x: 1.0, y: 2.1, w: 11.3, h: 1.5,
      fontSize: 36, bold: true, color: WHITE
    });
    s.addText("Comprehensive Operational Workflows, Technical Architecture, Role Matrix\n& Internship Implementation Report (Directive No. 1095/2017)", {
      x: 1.0, y: 3.8, w: 11.3, h: 1.1,
      fontSize: 18, color: 'CBD5E1', lineSpacing: 24
    });
    s.addText("Presenter: ICT & Software Engineering Intern  |  Host Directorate: ICT & Property Administration", {
      x: 1.0, y: 5.6, w: 11.3, h: 0.5,
      fontSize: 14, bold: true, color: GOLD
    });
  }

  // SLIDE 2: Presentation Objectives
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Presentation Scope & Roadmap", "EXECUTIVE OVERVIEW");

    const steps = [
      { step: "1. The Statutory Mandate & ASTU Background", desc: "Understanding university property management challenges and the legal requirements of Federal Directive No. 1095/2017.", color: NAVY },
      { step: "2. How the System Was Built (Technical Architecture)", desc: "In-depth look at the technology stack: React 18, TypeScript, Node.js, Express, Prisma ORM, and PostgreSQL database.", color: TEAL },
      { step: "3. My Duties & Engineering Contributions as an Intern", desc: "Key modules built: 4-Copy Model 19 GRN engine, Multi-Member TEC committee workflow, Provisional Voucher (RCV), and bug elimination.", color: BLUE },
      { step: "4. Step-by-Step Operations & User Role Matrix", desc: "Granular walkthrough of all 8 stock operations and how each of the 9 user roles interacts with the system.", color: GOLD }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 3: Problem Statement
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "The Traditional Property Management Crisis in Universities", "ASTU PROBLEM STATEMENT");

    addTwoColumnCards(
      s,
      "Operational & Control Breakdown",
      [
        "Uninspected Inventory Entry: Goods unloaded by suppliers were shelved or used before formal technical verification.",
        "Separation of Duties Breaches: Property administrators were conducting inspections themselves without qualified engineers.",
        "Lost Carbon Paper Trail: Multi-copy paper forms (Model 19, 20) were misplaced, delaying supplier payments and audits.",
        "Zero Real-Time Visibility: Management had no instant data on warehouse stock levels or asset custodians."
      ],
      CRIMSON,
      "Severe Institutional Consequences",
      [
        "OFAG Audit Findings: Regular audit citations from the Federal Auditor General regarding untracked university assets.",
        "Financial Discrepancies: Valuation gaps between physical warehouse stock and the University Finance General Ledger.",
        "Asset Shrinkage & Loss: Laptops, lab equipment, and chemicals leaving campus without verified gate clearance.",
        "Supplier Friction: Delayed payments due to lost receiving vouchers and manual signature bottlenecks."
      ],
      NAVY
    );
  }

  // SLIDE 4: Legal Framework
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Statutory Legal Foundation: Federal Directive No. 1095/2017", "REGULATORY COMPLIANCE");

    const steps = [
      { step: "Federal Directive No. 1095/2017 (የፌዴራል መንግሥት የንብረት አስተዳደር መመሪያ)", desc: "Issued by the FDRE Ministry of Finance to standardize public property acquisition, receipt, storage, issuance, transfer, and disposal across all federal budgetary institutions.", color: NAVY },
      { step: "Mandatory Separation of Functional Duties (የሥራ ድርሻ ክፍፍል)", desc: "Statutory mandate strictly forbidding the Property Administration Officer (PAO) or Storekeeper from acting as technical inspectors. Inspections MUST be conducted by an independent committee.", color: CRIMSON },
      { step: "Strict Prohibition of Uninspected Stock Posting", desc: "No goods can be written to the stock ledger, given a Model 19, or mixed with active inventory before passing formal technical inspection and PAO authorization.", color: TEAL },
      { step: "Official Federal Standardized Model Forms (ሞዴሎች)", desc: "Prescribes the exact structure, distribution, and archival sequence for Models 19, 20, 21, 22, 23, 24, 25, 26, and 27.", color: GOLD }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 5: The Digital Transformation Vision
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "The Automated Solution: Core Institutional Pillars", "SYSTEM OBJECTIVES");

    addTwoColumnCards(
      s,
      "Core Functional Pillars",
      [
        "100% Federal Directive Compliance: Encoding statutory procedural rules directly into software workflow guards.",
        "End-to-End Asset Lifecycle: Tracking goods from supplier truck delivery to employee custody and final asset disposal.",
        "4-Copy Carbonless Digital Paperwork: Role-tinted printouts mimicking official Ministry of Finance pads.",
        "Automated Separation of Duties: Enforcing role boundaries through cryptographically verified JWT RBAC."
      ],
      TEAL,
      "Measurable Benefits for ASTU",
      [
        "Instant Audit Readiness: Fully traceable digital audit log for every transaction, receipt, and approval.",
        "Perpetual FIFO Stock Valuation: Live balance synchronization with university accounting ledgers.",
        "Paperless Efficiency: Faster requisition approvals, automated notifications, and zero lost paperwork.",
        "Campus Security Integrity: Digital gate pass integration linking physical dispatch directly to vehicle numbers."
      ],
      GREEN
    );
  }

  // =========================================================================
  // SECTION 2: HOW THE SYSTEM IS BUILT (TECHNICAL ARCHITECTURE)
  // =========================================================================

  // SLIDE 6: Technical Architecture
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "High-Level System Architecture & Layered Design", "SYSTEM ARCHITECTURE");

    const layers = [
      { step: "Presentation Layer (React 18 + TypeScript + Vite)", desc: "Modern single-page application (SPA), modular Vanilla CSS design tokens, bilingual English/Amharic UI, role-tailored dashboards, and print-ready document engines.", color: BLUE },
      { step: "API Gateway & Security Layer (Express.js + JWT)", desc: "Stateless RESTful API gateway, JWT token verification, BCrypt password hashing, Helmet security headers, CORS allow-listing, rate limiting, and RBAC middleware.", color: TEAL },
      { step: "Business Domain Logic Layer (Node.js Service Modules)", desc: "Discrete transactional domain services: GRN processing, multi-member committee voting consensus, FIFO cost calculation, stock reservation, and audit event dispatchers.", color: NAVY },
      { step: "Data Persistence Layer (Prisma ORM 5 + PostgreSQL)", desc: "Type-safe database abstraction, ACID transactional boundaries ($transaction), 45 interconnected relational entity tables, and automated schema migration management.", color: GOLD }
    ];
    addFourStepCards(s, layers);
  }

  // SLIDE 7: Technology Stack Breakdown
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Technology Stack: Why These Tools Were Chosen", "TECH STACK");

    addTwoColumnCards(
      s,
      "Frontend Technology Stack",
      [
        "React 18: Component-driven architecture allowing reusable document viewers, modals, and tables.",
        "TypeScript: Strict compile-time type checking preventing null reference crashes and schema mismatches.",
        "Vite: Ultra-fast Hot Module Replacement (HMR) and optimized production bundle building.",
        "Vanilla CSS Design Tokens: Maximum flexibility for pixel-perfect federal print media layouts without Tailwind bloat."
      ],
      BLUE,
      "Backend & Database Stack",
      [
        "Node.js (v20+): Non-blocking asynchronous event loop ideal for high-concurrency university operations.",
        "Express.js: Lightweight, battle-tested REST API framework with modular route controllers.",
        "Prisma ORM 5: Type-safe database queries, schema-driven migrations, and atomic transaction guarantees.",
        "PostgreSQL: Enterprise-grade relational database with ACID guarantees, JSONB support, and strict constraints."
      ],
      NAVY
    );
  }

  // SLIDE 8: Database Design & Core Entities
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Database Design: 45 Relational Entities & ACID Safety", "DATABASE DESIGN");

    const steps = [
      { step: "GoodsReceipt & MaterialEvaluation Tables", desc: "Tracks deliveries from `PENDING_EVALUATION` to `EVALUATED` and `APPROVED`. Linked to Form TEC-01 inspection votes and committee consensus records.", color: NAVY },
      { step: "GoodsReceivedNote (Model 19 GRN) & StockLedger", desc: "Immutable official GRN records linked to perpetual Stock Cards (Model 21). Maintains running on-hand quantities and FIFO purchase batches.", color: TEAL },
      { step: "StoreRequisition (Model 23) & StoreIssueVoucher (Model 20)", desc: "Manages dual-stage approval workflows (Dept Head -> PAO) and locks stock allocations before physical picking and dispatch.", color: BLUE },
      { step: "FixedAsset (Model 25) & Custody Assignment", desc: "Maintains capitalized property master records with barcode serials, depreciation schedules, and employee custodian bindings.", color: GOLD }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 9: Security & RBAC Architecture
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Security & Role-Based Access Control (RBAC)", "SECURITY ARCHITECTURE");

    addTwoColumnCards(
      s,
      "Authentication & Security Controls",
      [
        "Stateless JWT Tokens: User identity, assigned roles, and permissions cryptographically signed into HTTP headers.",
        "BCrypt Salted Hashing: Enterprise-standard credential protection with work factor salt rounds.",
        "Helmet HTTP Headers: Hardening against Cross-Site Scripting (XSS), Clickjacking, and MIME-type sniffing.",
        "Rate Limiting & CORS: Restricting API traffic strictly to authorized campus subnets and clients."
      ],
      TEAL,
      "Fine-Grained RBAC Governance",
      [
        "Principle of Least Privilege: Every user account is strictly bound to authorized actions and forms.",
        "Context-Aware Authorization: Middleware verifies if a user has rights for a specific status transition (e.g. PAO approving GRN).",
        "Zero Role Overlap: Storekeepers cannot evaluate goods; TEC members cannot approve requisitions.",
        "Immutable Audit Logs: Every sensitive write operation logs the user ID, timestamp, IP address, and payload delta."
      ],
      NAVY
    );
  }

  // =========================================================================
  // SECTION 3: MY DUTIES & CONTRIBUTIONS AS AN INTERN
  // =========================================================================

  // SLIDE 10: Intern Scope & Overview
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "My Internship Role & Project Responsibilities", "INTERN DUTIES");

    const steps = [
      { step: "1. Federal Compliance & Statutory Business Logic", desc: "Analyzed Federal Directive No. 1095/2017 with university property officers and translated legal clauses into strict software state transitions.", color: NAVY },
      { step: "2. Front-to-Back Engineering of Federal Model Forms", desc: "Engineered authentic, print-ready digital models including the 4-Copy Model 19, Form TEC-01, Model 20 SIV, and Provisional RCV.", color: BLUE },
      { step: "3. Multi-Member Committee Inspection Engine", desc: "Re-architected the technical evaluation workflow to support independent voting and automated consensus calculation.", color: TEAL },
      { step: "4. Full-Stack Debugging & System Stabilization", desc: "Investigated and eliminated runtime crashes, optimized database transactional services, and enforced end-to-end type safety.", color: GOLD }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 11: Intern Contribution 1 - 4-Copy Model 19
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "My Engineering Contribution 1: 4-Copy Model 19 Engine", "INTERN CONTRIBUTIONS");

    addTwoColumnCards(
      s,
      "The Statutory 4-Color Architecture",
      [
        "Copy 1: White (ነጭ) - Automatically selected for Finance/Accounts to audit invoices and authorize bank payments.",
        "Copy 2: Canary Yellow (ቢጫ) - Automatically routed to the Storekeeper as statutory authority to shelve items.",
        "Copy 3: Light Blue (ሰማያዊ) - Bound into the PAO permanent register pad for institutional audit defense.",
        "Copy 4: Light Green (አረንጓዴ) - Transmitted to the Supplier as legal receipt of goods transfer."
      ],
      GOLD,
      "Technical Implementation Details",
      [
        "Role-Based Detection: The UI automatically detects the logged-in role and displays their statutory tinted copy.",
        "Bilingual Government Header: Official ASTU emblem, Ministry reference, and 3 bordered signature blocks.",
        "Currency Spelling Engine: Converts numerical amounts into English and Amharic words (e.g. 'One Thousand Birr').",
        "Dual Print Modes: Allows one-click printing of the active tinted copy or batch printing the full 4-page booklet."
      ],
      NAVY
    );
  }

  // SLIDE 12: Intern Contribution 2 - Multi-Member TEC Engine
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "My Engineering Contribution 2: Multi-Member TEC Engine", "INTERN CONTRIBUTIONS");

    const steps = [
      { step: "The Pre-Existing Flaw", desc: "Previously, the system only allowed a single user to click 'Approve/Reject' without recording technical inspection parameters, creating severe audit exposure.", color: CRIMSON },
      { step: "Multi-Specialist Designation by PAO", desc: "Built interface allowing the PAO to assign multiple committee members (e.g. 3 engineers) based on consignment specialization.", color: NAVY },
      { step: "Independent Member-by-Member Inspection", desc: "Each designated member logs into Material Evaluation, verifies technical specifications against the PO, and submits Form TEC-01.", color: TEAL },
      { step: "Automated Consensus Engine", desc: "System tracks voting progress (e.g. '2/3 Submitted'). When all members finish, if all accept -> EVALUATED; if any reject -> REJECTED with notes.", color: GREEN }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 13: Intern Contribution 3 - Provisional Inward Voucher (RCV)
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "My Engineering Contribution 3: Provisional Inward Voucher (RCV)", "INTERN CONTRIBUTIONS");

    addTwoColumnCards(
      s,
      "The Pre-Existing Workflow Breach",
      [
        "Previously, storekeepers generated a Model 19 GRN immediately upon carrier drop-off.",
        "This caused uninspected items to be immediately posted to active stock cards and university accounting books.",
        "If the items failed inspection days later, the accounting ledger was already corrupted.",
        "This violated Article 42 of Federal Directive No. 1095/2017."
      ],
      CRIMSON,
      "My Solution: The RCV Quarantine State",
      [
        "Introduced the Provisional Inward Receiving Voucher (ጊዜያዊ የዕቃ መቀበያ ሰነድ - RCV).",
        "When goods arrive, storekeeper generates RCV-YYYYMMDD-XXXX confirming physical receipt only.",
        "Watermarked: 'ምርመራ ያልተደረገለት ጊዜያዊ ሰነድ' (Provisional Receipt — Stock NOT posted).",
        "Stock cards remain completely untouched until PAO authorizes Model 19 post-inspection."
      ],
      GREEN
    );
  }

  // SLIDE 14: Intern Contribution 4 - Full-Stack Bug Fixing
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "My Engineering Contribution 4: Full-Stack Bug Fixing", "INTERN CONTRIBUTIONS");

    const steps = [
      { step: "Resolved Material Evaluation White-Screen Crash", desc: "Diagnosed runtime crashes when clicking 'View Detail'. Fixed Prisma Decimal serialization issues and undefined property accesses across nested relations.", color: NAVY },
      { step: "Transactional Backend Services", desc: "Refactored `evaluation.service.js` and `grn.service.js` to execute stock updates within Prisma `$transaction` blocks, eliminating partial writes.", color: TEAL },
      { step: "Strict Type Alignment Across Client & Server", desc: "Updated `types/index.ts` and API service wrappers to enforce consistent typing for committee votes, GRN copies, and stock balances.", color: BLUE },
      { step: "Zero TypeScript Compilation Errors", desc: "Executed `npx tsc --noEmit` clean compile validations across all frontend screens and components.", color: GREEN }
    ];
    addFourStepCards(s, steps);
  }

  // =========================================================================
  // SECTION 4: USER ROLES & SYSTEM RESPONSIBILITY MATRIX
  // =========================================================================

  // SLIDE 15: Role Matrix Overview
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "System User Roles: The 9 Authorized Actors", "USER ROLES");

    const steps = [
      { step: "1. Operational Demand Stakeholders", desc: "Requester (ጠያቂ - submits material needs) and Department Head (የክፍል ኃላፊ - reviews and endorses budget justification).", color: NAVY },
      { step: "2. Warehouse & Custody Stakeholders", desc: "Storekeeper (የመጋዘን ኃላፊ - unloads, manages quarantine, bin cards, and SIV dispatch).", color: TEAL },
      { step: "3. Inspection & Governance Stakeholders", desc: "Technical Evaluation Committee (ቴክኒክ ኮሚቴ - conducts technical testing) and PAO (የንብረት ኃላፊ - central authorization authority).", color: GOLD },
      { step: "4. Control & Administrative Stakeholders", desc: "Finance Accountant (audits invoices), Security Guard (gate pass verification), Asset Officer (capital tagging), and System Admin.", color: BLUE }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 16: Role 1 & 2 - Requester & Dept Head
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "User Roles: Requester (ጠያቂ) & Dept Head (የክፍል ኃላፊ)", "USER ROLES");

    addTwoColumnCards(
      s,
      "Requester (ጠያቂ - Department Staff)",
      [
        "Primary Task: Submits online Store Material Requisitions (ሞዴል 23) for operational supplies.",
        "System Actions: Browses approved catalog items, enters required quantities, attaches project justification.",
        "Tracking: Monitors live approval progress from Dept Head to PAO to Storekeeper dispatch.",
        "Legal Role: Signs custody acknowledgment on Model 20 SIV upon physical receipt of items."
      ],
      NAVY,
      "Department Head (የክፍል ኃላፊ)",
      [
        "Primary Task: First-level gatekeeper validating departmental resource consumption.",
        "System Actions: Reviews incoming Model 23 requisitions against quarterly departmental work plans.",
        "Decision Rights: Endorses requested quantities, reduces excessive requests, or rejects with explanation.",
        "Legal Role: Confirms the items are strictly required for university academic or research duties."
      ],
      TEAL
    );
  }

  // SLIDE 17: Role 3 & 4 - Storekeeper & TEC Committee
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "User Roles: Storekeeper (መጋዘን ኃላፊ) & TEC (ቴክኒክ ኮሚቴ)", "USER ROLES");

    addTwoColumnCards(
      s,
      "Storekeeper (የመጋዘን ኃላፊ)",
      [
        "Receiving: Unloads supplier trucks, counts packages, and issues Provisional Inward Vouchers (RCV).",
        "Storage Authority: Receives Copy 2 Yellow Model 19 from PAO to unquarantine items and shelve in bins.",
        "Stock Records: Posts movements to Bin Cards (Model 22) and coordinates with Stock Cards (Model 21).",
        "Dispatch: Picks items, generates Model 20 SIV, verifies recipient ID, and releases stock."
      ],
      GOLD,
      "Technical Evaluation Committee (TEC)",
      [
        "Composition: Subject-matter specialists (engineers, lab experts, IT analysts) appointed by PAO.",
        "Mandate: Unboxes items, conducts functional tests, and inspects specs against Purchase Order.",
        "System Actions: Submits independent inspection findings on Form TEC-01.",
        "Consensus: Votes Accept, Reject, or Conditional with mandatory technical observations."
      ],
      CRIMSON
    );
  }

  // SLIDE 18: Role 5 & 6 - PAO & Finance Accountant
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "User Roles: PAO (የንብረት ኃላፊ) & Accountant (የሂሳብ ሹም)", "USER ROLES");

    addTwoColumnCards(
      s,
      "Property Admin Officer (PAO - የንብረት ኃላፊ)",
      [
        "TEC Appointment: Designates qualified committee members based on consignment technical category.",
        "GRN Authorization: Performs final statutory approval on Model 19 GRN post-inspection.",
        "Requisition Approval: Conducts Level-2 institutional quota checks on Model 23 requests.",
        "Property Governance: Oversees inter-store transfers (Model 26) and property disposals (Model 27)."
      ],
      NAVY,
      "Finance / Accounts Officer (የሂሳብ ባለሙያ)",
      [
        "Invoice Audit: Receives Copy 1 White Model 19 to verify supplier delivery against commercial invoice.",
        "Disbursement Clearing: Authorizes bank transfers to suppliers only after valid Model 19 audit.",
        "Inventory Accounting: Reconciles perpetual Stock Card (Model 21) valuations with General Ledger.",
        "Year-End Audit: Validates FIFO inventory values for the Federal Auditor General (OFAG)."
      ],
      GREEN
    );
  }

  // SLIDE 19: Role 7, 8 & 9 - Security, Asset Officer & Admin
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "User Roles: Security Gate, Asset Officer & System Admin", "USER ROLES");

    const steps = [
      { step: "Security / Gate Officer (የበር ጥበቃ)", desc: "Perimeter control officer at campus gates. Inspects outgoing vehicles against digital Model 20 SIVs, confirms vehicle plate number and driver identity before stamping exit.", color: NAVY },
      { step: "Asset Management Officer (የቋሚ ንብረት ምዝገባ)", desc: "Registers capitalized institutional property (computers, lab machinery, vehicles), generates barcode tags, records serial numbers, and maintains Model 25 Fixed Asset Register.", color: TEAL },
      { step: "System Administrator (የስርዓት አስተዳዳሪ)", desc: "Governs platform user accounts, assigns system roles, configures university stores, item categories, measurement units, and monitors immutable security audit logs.", color: BLUE }
    ];
    addThreeStepCards(s, steps);
  }

  // =========================================================================
  // SECTION 5: STEP-BY-STEP STOCK OPERATIONS WORKFLOWS
  // =========================================================================

  // SLIDE 20: Overview of 8 Stock Operations
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Master Overview: The 8 Core Stock Operations", "OPERATIONAL WORKFLOWS");

    addTwoColumnCards(
      s,
      "Inward & Storage Operations",
      [
        "Operation 1: Goods Inward Receiving & Quarantine (RCV)",
        "Operation 2: Multi-Member TEC Technical Inspection (Form TEC-01)",
        "Operation 3: PAO Authorization & 4-Copy Model 19 GRN Issuance",
        "Operation 4: Warehouse Bin Cards (Model 22) & Stock Cards (Model 21)"
      ],
      NAVY,
      "Outward, Custody & Audit Operations",
      [
        "Operation 5: Store Requisition & Dual Approval (Model 23)",
        "Operation 6: Store Issue Voucher (SIV - Model 20) & Gate Pass",
        "Operation 7: Property Returns (M24), Transfers (M26) & Disposals (M27)",
        "Operation 8: Physical Stocktaking & Inventory Reconciliation"
      ],
      TEAL
    );
  }

  // SLIDE 21: Operation 1 - Receiving Step-by-Step
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 1: Goods Receiving & Quarantine Walkthrough", "OPERATION 1");

    const steps = [
      { step: "Step 1: Supplier Carrier Arrival at Warehouse", desc: "Supplier vehicle arrives at university central warehouse with delivery note, commercial invoice, and Purchase Order (PO) contract reference.", color: NAVY },
      { step: "Step 2: External Package Inspection & Count", desc: "Storekeeper counts outer packages, inspects shipping seals for transit damage, and logs carrier driver details.", color: TEAL },
      { step: "Step 3: Recording Delivery in Stock Receiving Module", desc: "Storekeeper enters consignment into the system, matching PO line items. Consignment status set to PENDING_EVALUATION.", color: BLUE },
      { step: "Step 4: Provisional Voucher (RCV) Issuance & Quarantine", desc: "System generates Provisional Inward Voucher (ጊዜያዊ የዕቃ መቀበያ ሰነድ). Goods locked in quarantine bay. Zero stock ledger impact.", color: GOLD }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 22: Operation 1 - Deep Dive on RCV
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Operation 1 Deep Dive: The Provisional Inward Voucher (RCV)", "OPERATION 1");

    addTwoColumnCards(
      s,
      "Provisional Voucher Attributes",
      [
        "Voucher Identifier: Unique sequential code `RCV-YYYYMMDD-XXXX`.",
        "Statutory Notice: Explicitly stamped 'ጊዜያዊ የዕቃ መቀበያ ሰነድ - በቴክኒክ ኮሚቴ ያልተረጋገጠ' (Provisional Receipt - Uninspected).",
        "Quarantine Enforcement: System prevents items from appearing in store available balances.",
        "Carrier Handover: Printed copy signed by Storekeeper and given to supplier driver as drop-off proof only."
      ],
      GOLD,
      "Directive 1095/2017 Safeguards",
      [
        "No Payment Release: Finance department strictly prohibited from paying supplier on RCV.",
        "Segregated Storage: Physical goods must remain in marked quarantine bay until technical clearance.",
        "Zero Premature Issuance: Requisitioners cannot request or receive items currently under RCV status.",
        "Audit Verification: Protects university from acknowledging ownership of damaged or non-compliant deliveries."
      ],
      CRIMSON
    );
  }

  // SLIDE 23: Operation 2 - Committee Appointment
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 2: Technical Committee Appointment", "OPERATION 2");

    const steps = [
      { step: "Step 1: Inward Alert Trigger to PAO", desc: "System instantly notifies the Property Administration Officer (PAO) that a new consignment has arrived under RCV quarantine.", color: NAVY },
      { step: "Step 2: Consignment Categorization & Specialist Selection", desc: "PAO examines the technical nature of items (e.g. computer hardware vs. chemical reagents vs. civil machinery) and opens candidate roster.", color: TEAL },
      { step: "Step 3: Designating the Multi-Member Committee", desc: "PAO designates 2 or more qualified technical specialists. System records appointment timestamp and sends in-app notifications to members.", color: BLUE },
      { step: "Step 4: Scheduling Physical Inspection Session", desc: "Designated committee members receive inspection docket with attached Purchase Order technical specifications and delivery notes.", color: GOLD }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 24: Operation 2 - Inspection Walkthrough
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 2: Form TEC-01 Inspection & Voting", "OPERATION 2");

    const steps = [
      { step: "Step 1: Physical Unboxing & Sampling", desc: "Committee members visit quarantine bay. Packages are opened, serial numbers recorded, and user manuals examined.", color: NAVY },
      { step: "Step 2: Technical Specification & Functional Testing", desc: "Inspectors test item parameters against PO contract specifications (e.g. processor speed, RAM, chemical purity, dimensions).", color: TEAL },
      { step: "Step 3: Individual Form TEC-01 Submission", desc: "Each member independently logs into Material Evaluation and submits Form TEC-01 recording Acceptance, Rejection, or Deficiencies.", color: BLUE },
      { step: "Step 4: Automated Consensus Determination", desc: "System aggregates member determinations: 100% Accept -> Status = EVALUATED; Any Rejection -> Status = REJECTED with full dissenting notes.", color: GREEN }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 25: Operation 2 - Consensus & Rejections
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Operation 2 Deep Dive: Consensus Rules & Rejection Handling", "OPERATION 2");

    addTwoColumnCards(
      s,
      "Automated Consensus Logic",
      [
        "Sequential Independent Voting: Members vote privately without seeing peers' votes to prevent undue influence.",
        "Consensus Threshold: Requires unanimous approval by all designated inspectors for full acceptance.",
        "Partial Acceptance: Committee can accept compliant quantities and reject damaged or non-compliant units.",
        "Form TEC-01 Dossier: Generates official inspection record signed digitally by all committee inspectors."
      ],
      TEAL,
      "Rejection & Supplier Return Protocol",
      [
        "Formal Rejection Notice: System generates rejection summary detailing failed technical specifications.",
        "Quarantine Hold: Rejected items locked in warehouse quarantine to prevent accidental mixing.",
        "Procurement Alert: Purchasing Directorate notified to issue supplier cure notice or return consignment.",
        "Zero Financial Liability: University accounts completely protected from fraudulent or defective invoices."
      ],
      CRIMSON
    );
  }

  // SLIDE 26: Operation 3 - PAO Approval & Model 19
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 3: PAO Approval & Model 19 GRN Walkthrough", "OPERATION 3");

    const steps = [
      { step: "Step 1: PAO Dossier Review", desc: "PAO opens the Evaluated & Model 19 Authorization queue. Reviews complete inspection dossier, Form TEC-01, and supplier delivery notes.", color: NAVY },
      { step: "Step 2: Authorize Model 19 (ሞዴል 19 አጽድቅ)", desc: "PAO enters institutional budget code, verifies accounting ledger accounts, and submits final statutory authorization.", color: TEAL },
      { step: "Step 3: Atomic Stock Card Posting (Prisma $transaction)", desc: "System generates official Goods Received Note (GRN-YYYY-XXXXX). Automatically updates perpetual Stock Cards (Model 21) using FIFO costing.", color: BLUE },
      { step: "Step 4: 4-Copy Distribution & Storekeeper Alert", desc: "System creates the 4 statutory copies. Storekeeper's screen immediately alerts: '🟡 Copy 2 (Storekeeper Yellow) Ready'.", color: GREEN }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 27: Operation 3 - 4-Copy Color Distribution
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Operation 3 Deep Dive: The 4-Copy Model 19 Distribution", "OPERATION 3");

    const copies = [
      { step: "Copy 1: White (ነጭ) — Finance & Accounts Directorate", desc: "Audited by university accountants against commercial bills to authorize supplier payment. Attached to payment voucher.", color: DARK },
      { step: "Copy 2: Canary Yellow (ቢጫ) — Storekeeper & Warehouse", desc: "Statutory authority for the storekeeper to move goods out of quarantine, shelve into racks, and record into Bin Cards (Model 22).", color: GOLD },
      { step: "Copy 3: Light Blue (ሰማያዊ) — Property Administration Officer (PAO)", desc: "Retained in the PAO bound permanent register pad. Serves as official institutional defense during Federal Auditor General (OFAG) audits.", color: BLUE },
      { step: "Copy 4: Light Green (አረንጓዴ) — Supplier / Vendor", desc: "Transmitted to the vendor as official legal receipt confirming goods transfer, technical acceptance, and title handover.", color: GREEN }
    ];
    addFourStepCards(s, copies);
  }

  // SLIDE 28: Operation 4 - Warehouse Stock & Bin Cards
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 4: Stock Cards (M21) & Bin Cards (M22)", "OPERATION 4");

    addTwoColumnCards(
      s,
      "Stock Card (ሞዴል 21 - የስቶክ መቆጣጠሪያ ካርድ)",
      [
        "Perpetual Inventory Ledger: Maintained per item, category, and store location.",
        "Transaction History: Automatically records Receipts (+), Issues (-), Returns (+), and Transfers (+/-).",
        "FIFO Valuation Engine: Tracks purchase cost per batch to compute exact inventory valuation and running averages.",
        "Financial Synchronization: Reconciled continuously with the University Finance General Ledger."
      ],
      NAVY,
      "Bin Card (ሞዴል 22 - የቢን ካርድ)",
      [
        "Physical Warehouse Coordinate: Placed directly on storage racks (Area -> Rack -> Shelf -> Bin).",
        "Perishable Tracking: Records batch numbers, manufacturing dates, and expiration milestones for chemicals.",
        "Immediate Shelf Updates: Storekeeper updates Bin Card when physically moving items in or out.",
        "Physical Audit Tool: Serves as primary verification document during quarterly stocktaking counts."
      ],
      TEAL
    );
  }

  // SLIDE 29: Operation 5 - Material Requisition
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 5: Store Material Requisition (Model 23)", "OPERATION 5");

    const steps = [
      { step: "Step 1: Department Requester Fills Model 23 Online", desc: "Staff member browses item catalog, checks available stock, enters requested quantity, and specifies operational or research justification.", color: NAVY },
      { step: "Step 2: Level-1 Review by Department Head (የክፍል ኃላፊ)", desc: "Department Head verifies necessity against quarterly departmental operational budget. Approves, reduces quantity, or rejects.", color: TEAL },
      { step: "Step 3: Level-2 Institutional Review by PAO (የንብረት ኃላፊ)", desc: "PAO verifies institutional stock availability, checks historical department consumption quotas, and gives final approval.", color: BLUE },
      { step: "Step 4: Stock Reservation & Storekeeper Dispatch Queue", desc: "System locks allocated stock quantity and sends authorized dispatch ticket directly to the Storekeeper's issuing queue.", color: GREEN }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 30: Operation 6 - Store Issue Voucher (SIV)
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 6: Store Issue Voucher (Model 20) & Dispatch", "OPERATION 6");

    const steps = [
      { step: "Step 1: Storekeeper Physical Picking", desc: "Storekeeper views approved requisition, locates items using Bin Card coordinates (Aisle/Rack/Bin), and prepares consignment.", color: NAVY },
      { step: "Step 2: Model 20 SIV Generation (የዕቃ ወጪ ሰነድ)", desc: "Storekeeper generates official Model 20 SIV, recording dispatched serial numbers and batch numbers. Stock balance deducted automatically.", color: TEAL },
      { step: "Step 3: Recipient Employee Custody Acknowledgment", desc: "Recipient staff member inspects physical items, verifies serial numbers, and signs the physical or digital Model 20 SIV.", color: BLUE },
      { step: "Step 4: Automatic Fixed Asset Binding (Model 25)", desc: "If the item is a capital asset (e.g. laptop), the system automatically binds the barcode tag to the recipient employee profile.", color: GREEN }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 31: Operation 6 - Campus Gate Control
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Operation 6 Deep Dive: Campus Gate Pass & Security Verification", "OPERATION 6");

    addTwoColumnCards(
      s,
      "Campus Security Inspection Protocol",
      [
        "Gate Pass Generation: SIV automatically generates digital Gate Pass for items leaving university premises.",
        "Security Officer Scan: Guard at campus perimeter gate inspects items against digital Model 20 record.",
        "Vehicle & Driver Logging: Guard records vehicle plate number, driver identity, and exit timestamp.",
        "Serial Number Verification: High-value assets verified against barcode serials before authorizing gate exit."
      ],
      NAVY,
      "Loss Prevention & Asset Protection",
      [
        "Zero Unauthorized Exit: No university property allowed through gates without verified digital SIV.",
        "Returnable Item Tracking: Tracks items leaving temporarily for field research or off-campus maintenance.",
        "Perimeter Incident Prevention: Immediate security alerts if unapproved items are presented at security checkpoints.",
        "Audit Trail Integrity: Complete digital record of who transported what property out of campus and when."
      ],
      GREEN
    );
  }

  // SLIDE 32: Operation 7 - Property Returns, Transfers & Disposals
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 7: Returns (M24), Transfers (M26) & Disposals (M27)", "OPERATION 7");

    const steps = [
      { step: "Property Return Voucher (ሞዴል 24 — የዕቃ መመለሻ ሰነድ)", desc: "For unutilized materials or employee clearance upon resignation. TEC evaluates condition: Serviceable (restocked), Repairable (sent to workshop), or Condemned.", color: NAVY },
      { step: "Inter-Store Transfer Form (ሞዴል 26 — የዕቃ ማስተላለፊያ ቅጽ)", desc: "Authorizes inventory movement between university branch stores. Requires dual confirmation: 'Transferred-Out' and 'Received-In' to eliminate transit leakage.", color: TEAL },
      { step: "Property Disposal Register (ሞዴል 27 — የተወገዱ ንብረቶች መመዝገቢያ)", desc: "Governed by Institutional Disposal Committee for obsolete, damaged, or expired assets via public auction, institutional donation, or destruction.", color: GOLD },
      { step: "Financial Write-Off & Asset Register Deregistration", desc: "Disposal records update Model 25 Fixed Asset Register and inform Finance Directorate to execute accounting write-offs.", color: CRIMSON }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 33: Operation 8 - Physical Stocktaking
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 8: Stocktaking & Physical Reconciliation", "OPERATION 8");

    const steps = [
      { step: "Step 1: Warehouse Movement Freeze & Committee Mobilization", desc: "Annual or quarterly stocktaking committee appointed. Warehouse transactions locked to establish exact cut-off baseline.", color: NAVY },
      { step: "Step 2: Blind Physical Inventory Count", desc: "Counting teams record actual physical quantities shelf-by-shelf and bin-by-bin without viewing system book balances.", color: TEAL },
      { step: "Step 3: Automated Variance Computation", desc: "System compares physical counts against perpetual Stock Cards (Model 21), computing Surpluses (+) and Deficits (-).", color: BLUE },
      { step: "Step 4: Audit Investigation & Reconciliation Adjustments", desc: "Internal Audit and PAO investigate variance causes (shrinkage, breakage, clerical error) and execute audited adjustment journals.", color: GREEN }
    ];
    addFourStepCards(s, steps);
  }

  // =========================================================================
  // SECTION 6: INSTITUTIONAL IMPACT & INTERNSHIP REFLECTIONS
  // =========================================================================

  // SLIDE 34: Institutional Impact
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Institutional Transformation for ASTU Operations", "INSTITUTIONAL IMPACT");

    addTwoColumnCards(
      s,
      "Operational & Administrative Gains",
      [
        "100% Federal Directive Compliance: Eradicated statutory compliance breaches across all university stores.",
        "Zero Paper Document Loss: Permanent digital archives with instant reprint capabilities for all federal models.",
        "Accelerated Requisition Cycle: Slashed approval turnaround from days of physical paper routing to minutes.",
        "Synchronized Financial Valuation: Real-time FIFO perpetual inventory perfectly matching General Ledger."
      ],
      NAVY,
      "Governance & Asset Security",
      [
        "OFAG Audit Protection: Clean, defensible electronic audit logs for the Federal Auditor General and Ministry of Finance.",
        "Strict Separation of Duties: Eliminated administrative overreach through programmatic role enforcement.",
        "Asset Accountability: Complete employee custody tracking preventing theft and unaccounted equipment loss.",
        "Multi-Store Transparency: Central administration has live bird's-eye visibility across all branch warehouses."
      ],
      GREEN
    );
  }

  // SLIDE 35: Internship Professional Learnings
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Key Engineering Learnings & Internship Takeaways", "INTERNSHIP REPORT");

    const steps = [
      { step: "Translating Civil Law into Software Business Logic", desc: "Learned how to dissect government procurement directives and federal regulations, translating legal mandates into type-safe code and validation guards.", color: NAVY },
      { step: "Enterprise Data Modeling & ACID Reliability", desc: "Mastered Prisma ORM and PostgreSQL transactions, ensuring zero orphaned rows, reliable FIFO queues, and multi-user concurrency handling.", color: TEAL },
      { step: "Production-Grade Print Engineering", desc: "Engineered high-fidelity, pixel-accurate government document print layouts conforming to standard physical paper form specifications.", color: BLUE },
      { step: "Full-Stack Collaboration & Architectural Thinking", desc: "Developed practical competence in building scalable RESTful architectures, debugging state lifecycles, and working effectively in team settings.", color: GOLD }
    ];
    addFourStepCards(s, steps);
  }

  // SLIDE 36: Conclusion & Live Demonstration
  {
    const s = pptx.addSlide();
    s.background = { color: NAVY };

    s.addText("THANK YOU!", {
      x: 1.0, y: 1.8, w: 11.3, h: 0.9,
      fontSize: 48, bold: true, color: WHITE, align: 'center'
    });
    s.addText("Adama Science & Technology University (ASTU)\nAutomated Institutional Stock & Property Management System", {
      x: 1.0, y: 2.9, w: 11.3, h: 1.0,
      fontSize: 22, bold: true, color: GOLD, align: 'center'
    });
    s.addText("Active Local Environment:\nFrontend Web Client: http://localhost:5173  |  Backend REST API: http://localhost:3001", {
      x: 1.0, y: 4.2, w: 11.3, h: 0.8,
      fontSize: 16, color: 'CBD5E1', align: 'center'
    });
    s.addText("Now Open for Questions, Committee Review & Live Demonstration", {
      x: 1.0, y: 5.4, w: 11.3, h: 0.6,
      fontSize: 18, bold: true, color: WHITE, align: 'center'
    });
  }

  const outPath = path.resolve('..', 'ASTU_Stock_Management_Comprehensive_Presentation.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log(`Comprehensive PPTX created successfully at: ${outPath}`);
}

buildComprehensiveDeck().catch(err => {
  console.error("Failed to generate comprehensive PPTX:", err);
  process.exit(1);
});
