const path = require('path');
const pptxgen = require('pptxgenjs');

async function buildDeck() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 16:9

  // Colors
  const NAVY = '102C57';
  const GOLD = 'DAA520';
  const WHITE = 'FFFFFF';
  const DARK = '1E293B';
  const LIGHT_BG = 'F8FAFC';
  const TEAL = '0F766E';
  const BLUE = '2563EB';

  function addHeader(slide, title, category = "ASTU STOCK & PROPERTY MANAGEMENT SYSTEM") {
    slide.addText(category.toUpperCase(), {
      x: 0.8, y: 0.4, w: 11.7, h: 0.3,
      fontSize: 11, bold: true, color: GOLD
    });
    slide.addText(title, {
      x: 0.8, y: 0.7, w: 11.7, h: 0.6,
      fontSize: 22, bold: true, color: NAVY
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: 1.4, w: 11.7, h: 0.02,
      fill: { color: 'E2E8F0' }, line: { color: 'E2E8F0' }
    });
  }

  // SLIDE 1: Title
  {
    const s = pptx.addSlide();
    s.background = { color: NAVY };
    s.addText("ADAMA SCIENCE & TECHNOLOGY UNIVERSITY (ASTU)", {
      x: 1.2, y: 1.5, w: 10.9, h: 0.4,
      fontSize: 14, bold: true, color: GOLD
    });
    s.addText("Automated Institutional Stock & Property Management System", {
      x: 1.2, y: 2.1, w: 10.9, h: 1.4,
      fontSize: 34, bold: true, color: WHITE
    });
    s.addText("Digitalizing Public Property Governance in Compliance with Federal Directive No. 1095/2017\nTechnical Architecture, Operational Workflows & Internship Engineering Report", {
      x: 1.2, y: 3.7, w: 10.9, h: 1.0,
      fontSize: 16, color: 'CBD5E1'
    });
    s.addText("Presenter: ICT & Software Engineering Intern  |  Host Directorate: ICT & Property Administration", {
      x: 1.2, y: 5.5, w: 10.9, h: 0.5,
      fontSize: 13, bold: true, color: GOLD
    });
  }

  // SLIDE 2: Executive Summary & Context
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Executive Summary & ASTU Problem Statement");

    // Left card: Problems
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.7, w: 5.6, h: 5.2,
      fill: { color: 'FEF2F2' }, line: { color: 'FCA5A5', width: 1.5 }
    });
    s.addText("The Traditional Manual Challenges", {
      x: 1.1, y: 1.9, w: 5.0, h: 0.4,
      fontSize: 17, bold: true, color: '991B1B'
    });
    const probItems = [
      "Uncontrolled Receiving: Uninspected supplier items mixed with active stock before technical verification.",
      "Separation of Duties Breaches: Administrators performing physical inspections rather than qualified technical committees.",
      "Lost Paper Trail: Manual multi-copy carbon papers (Model 19, 20) lost or delayed between stores and finance.",
      "Inaccurate Valuations: Lack of perpetual FIFO costing leading to discrepancies with General Ledger during annual audits.",
      "Audit Exposure: Severe audit findings by the Federal Auditor General (OFAG) regarding public asset custody."
    ];
    let y = 2.4;
    probItems.forEach(item => {
      s.addText("• " + item, {
        x: 1.1, y: y, w: 5.0, h: 0.8,
        fontSize: 12, color: DARK
      });
      y += 0.9;
    });

    // Right card: Solution
    s.addShape(pptx.ShapeType.roundRect, {
      x: 6.9, y: 1.7, w: 5.6, h: 5.2,
      fill: { color: 'F0FDF4' }, line: { color: '86EFAC', width: 1.5 }
    });
    s.addText("The Automated SMS Solution", {
      x: 7.2, y: 1.9, w: 5.0, h: 0.4,
      fontSize: 17, bold: true, color: '166534'
    });
    const solItems = [
      "Directive 1095/2017 Compliance: Strictly encodes every federal model form and approval sequence.",
      "4-Copy Carbonless Model 19: Role-based color tinting (Finance White, Store Yellow, PAO Blue, Supplier Green).",
      "Multi-Member TEC Voting: Multi-specialist independent technical evaluation with Form TEC-01 acceptance dossiers.",
      "Real-Time Stock Cards: Perpetual FIFO valuation updating on-hand, allocated, and available balances automatically.",
      "End-to-End Traceability: From supplier delivery and quarantine to employee asset custody and gate pass clearance."
    ];
    y = 2.4;
    solItems.forEach(item => {
      s.addText("✓ " + item, {
        x: 7.2, y: y, w: 5.0, h: 0.8,
        fontSize: 12, color: DARK
      });
      y += 0.9;
    });
  }

  // SLIDE 3: My Internship Role & Engineering Duties
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "My Internship Role & Specific Engineering Contributions", "DUTIES & IMPLEMENTATION");

    const cards = [
      {
        title: "1. Federal Model 19 4-Copy Engine",
        desc: "Engineered official bilingual Model 19 with 4 statutory color-coded copies (Finance White, Store Yellow, PAO Blue, Supplier Green). Built single-copy and 4-copy batch printing engines with automated currency number-to-words conversion.",
        color: BLUE
      },
      {
        title: "2. Multi-Member TEC Inspection Workflow",
        desc: "Re-architected the inspection module from a single-user action into a multi-specialist Technical Evaluation Committee with sequential independent voting, consensus calculation, and Form TEC-01 digital dossiers.",
        color: TEAL
      },
      {
        title: "3. Provisional Inward Voucher (RCV)",
        desc: "Eliminated illegal premature stock posting by introducing the Provisional Inward Receiving Voucher (ጊዜያዊ የዕቃ መቀበያ ሰነድ - RCV) ensuring deliveries remain in quarantine until authorized by PAO.",
        color: NAVY
      },
      {
        title: "4. Full-Stack Robustness & Bug Elimination",
        desc: "Resolved critical runtime crashes in Material Evaluation caused by Prisma Decimal type mismatches. Authored transactional backend services ensuring atomic stock balance integrity.",
        color: GOLD
      }
    ];

    cards.forEach((c, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const left = 0.8 + col * 6.0;
      const top = 1.7 + row * 2.6;

      s.addShape(pptx.ShapeType.roundRect, {
        x: left, y: top, w: 5.7, h: 2.3,
        fill: { color: WHITE }, line: { color: c.color, width: 2 }
      });
      s.addText(c.title, {
        x: left + 0.25, y: top + 0.2, w: 5.2, h: 0.35,
        fontSize: 15, bold: true, color: c.color
      });
      s.addText(c.desc, {
        x: left + 0.25, y: top + 0.65, w: 5.2, h: 1.5,
        fontSize: 12, color: DARK
      });
    });
  }

  // SLIDE 4: Technical Architecture & Tech Stack
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "System Architecture & Enterprise Technology Stack", "SYSTEM DESIGN");

    const layers = [
      {
        title: "Frontend Client Layer",
        color: BLUE,
        items: [
          "React 18 & TypeScript",
          "Vite fast development server",
          "Vanilla CSS modular design tokens",
          "Optimistic UI state management",
          "Bilingual typography (Amharic & English)",
          "Print media CSS layout rules"
        ]
      },
      {
        title: "Backend API & Logic Layer",
        color: TEAL,
        items: [
          "Node.js (v20+) & Express REST API",
          "JWT stateless token authentication",
          "Role-Based Access Control (RBAC)",
          "Multi-member committee voting engine",
          "Automated audit logging middleware",
          "Security headers, CORS & rate limiters"
        ]
      },
      {
        title: "Database & Persistence Layer",
        color: NAVY,
        items: [
          "PostgreSQL Enterprise Database",
          "Prisma ORM 5 type-safe queries",
          "ACID compliance via $transaction",
          "45 interconnected relational models",
          "FIFO perpetual stock valuation",
          "Automated schema migrations"
        ]
      }
    ];

    layers.forEach((l, i) => {
      const left = 0.8 + i * 4.0;
      s.addShape(pptx.ShapeType.roundRect, {
        x: left, y: 1.7, w: 3.7, h: 5.2,
        fill: { color: WHITE }, line: { color: l.color, width: 2 }
      });
      s.addText(l.title, {
        x: left + 0.2, y: 1.9, w: 3.3, h: 0.4,
        fontSize: 16, bold: true, color: l.color
      });
      let y = 2.4;
      l.items.forEach(item => {
        s.addText("• " + item, {
          x: left + 0.2, y: y, w: 3.3, h: 0.45,
          fontSize: 12, color: DARK
        });
        y += 0.65;
      });
    });
  }

  // SLIDE 5: Comprehensive Role Matrix
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "User Roles & Separation of Duties Matrix", "ACCESS CONTROL MATRIX");

    const roles = [
      { name: "Requester (ጠያቂ)", desc: "Department staff submitting material requisitions for work tasks.", models: "Model 23" },
      { name: "Department Head (የክፍል ኃላፊ)", desc: "Reviews & approves departmental requisitions based on work plan.", models: "Model 23 Endorsement" },
      { name: "Storekeeper (የመጋዘን ኃላፊ)", desc: "Unloads shipments, issues RCV, logs Copy 2 Yellow Model 19, posts Bin Cards, issues SIV.", models: "RCV, Model 19 (Copy 2), Model 20, 22" },
      { name: "TEC Committee (ቴክኒክ ኮሚቴ)", desc: "Specialists inspecting specs, testing items, signing Form TEC-01.", models: "Form TEC-01, Model 19 (Box 2)" },
      { name: "PAO (የንብረት ኃላፊ)", desc: "Designates TEC, conducts final requisition approval, authorizes Model 19 GRN.", models: "Model 19 (Box 3), Model 20, 23, 26, 27" },
      { name: "Accountant / Finance (የሂሳብ ባለሙያ)", desc: "Audits Model 19 Copy 1 White against supplier bills; performs FIFO reconciliations.", models: "Model 19 (Copy 1), Model 21" },
      { name: "Security Gate Officer (የበር ጥበቃ)", desc: "Inspects dispatched goods against approved Model 20 SIV at campus gates.", models: "Model 20 Gate Pass" },
      { name: "Asset Officer (የንብረት ምዝገባ)", desc: "Assigns unique barcode tags to fixed assets, records employee custody.", models: "Model 25 Asset Register" },
      { name: "System Admin (የስርዓት አስተዳዳሪ)", desc: "Manages users, roles, stores, units, categories, and system audit logs.", models: "Master Settings & Security" }
    ];

    roles.forEach((r, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const left = 0.8 + col * 4.0;
      const top = 1.7 + row * 1.75;

      s.addShape(pptx.ShapeType.roundRect, {
        x: left, y: top, w: 3.7, h: 1.55,
        fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 }
      });
      s.addText(r.name, {
        x: left + 0.15, y: top + 0.1, w: 3.4, h: 0.3,
        fontSize: 12, bold: true, color: NAVY
      });
      s.addText(r.desc, {
        x: left + 0.15, y: top + 0.42, w: 3.4, h: 0.65,
        fontSize: 10, color: DARK
      });
      s.addText("Authorized: " + r.models, {
        x: left + 0.15, y: top + 1.15, w: 3.4, h: 0.3,
        fontSize: 9, bold: true, color: TEAL
      });
    });
  }

  // SLIDE 6: Stock Operation 1
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 1: Inward Receiving & Provisional Voucher (RCV)", "WORKFLOW 1");

    const steps = [
      { title: "Step 1: Physical Delivery", desc: "Supplier arrives at university warehouse with delivery note, PO, and goods consignment.", color: NAVY },
      { title: "Step 2: Quarantine Entry", desc: "Storekeeper counts parcels, inspects outer packages, and enters receipt details in the system.", color: TEAL },
      { title: "Step 3: Provisional Voucher (RCV)", desc: "System issues Provisional Receiving Voucher (ጊዜያዊ የዕቃ መቀበያ ሰነድ). Items placed in Quarantine Bay.", color: GOLD },
      { title: "Step 4: Statutory Compliance Rule", desc: "Under Federal Directive 1095/2017, stock is strictly NOT posted to stock ledger until TEC inspects & PAO approves.", color: BLUE }
    ];

    steps.forEach((st, i) => {
      const top = 1.7 + i * 1.3;
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: top, w: 11.7, h: 1.1,
        fill: { color: WHITE }, line: { color: st.color, width: 2 }
      });
      s.addText(st.title, {
        x: 1.1, y: top + 0.15, w: 11.1, h: 0.35,
        fontSize: 14, bold: true, color: st.color
      });
      s.addText(st.desc, {
        x: 1.1, y: top + 0.55, w: 11.1, h: 0.45,
        fontSize: 11, color: DARK
      });
    });
  }

  // SLIDE 7: Stock Operation 2
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 2: Multi-Member TEC Inspection & Dossier", "WORKFLOW 2");

    const steps = [
      { title: "Phase A: PAO Committee Designation", desc: "PAO selects qualified specialists (engineers, lab experts, IT) to inspect the technical specifications.", color: NAVY },
      { title: "Phase B: Independent Technical Testing", desc: "Assigned committee members inspect physical items, verify serial numbers, check manufacturer manuals, and conduct live tests.", color: TEAL },
      { title: "Phase C: Form TEC-01 Submission", desc: "Each member submits an independent evaluation record on Form TEC-01 with detailed inspection observations.", color: GOLD },
      { title: "Phase D: Consensus Calculation", desc: "All assigned members must vote. If all approve -> status becomes EVALUATED. If any member rejects -> flagged for return to vendor.", color: BLUE }
    ];

    steps.forEach((st, i) => {
      const top = 1.7 + i * 1.3;
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: top, w: 11.7, h: 1.1,
        fill: { color: WHITE }, line: { color: st.color, width: 2 }
      });
      s.addText(st.title, {
        x: 1.1, y: top + 0.15, w: 11.1, h: 0.35,
        fontSize: 14, bold: true, color: st.color
      });
      s.addText(st.desc, {
        x: 1.1, y: top + 0.55, w: 11.1, h: 0.45,
        fontSize: 11, color: DARK
      });
    });
  }

  // SLIDE 8: Stock Operation 3 - 4 Copies
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 3: PAO Approval & 4-Copy Model 19 GRN", "WORKFLOW 3");

    const copies = [
      { title: "Copy 1: White (ነጭ)", desc: "Sent to Finance / Accounts Directorate to audit supplier invoices and authorize payment disbursements.", bg: 'F1F5F9', border: '64748B', text: '1E293B' },
      { title: "Copy 2: Canary Yellow (ቢጫ)", desc: "Received by Storekeeper as statutory legal authorization to unquarantine items and write into Bin & Stock Cards.", bg: 'FEF08A', border: 'CA8A04', text: '713F12' },
      { title: "Copy 3: Light Blue (ሰማያዊ)", desc: "Retained by Property Administration Officer (PAO) in permanent institutional archive pad for audits.", bg: 'BFDBFE', border: '3B82F6', text: '1E3A8A' },
      { title: "Copy 4: Light Green (አረንጓዴ)", desc: "Transmitted to the Supplier as official proof of goods delivery, inspection acceptance, and institutional ownership.", bg: 'BBF7D0', border: '22C55E', text: '14532D' }
    ];

    copies.forEach((c, i) => {
      const top = 1.7 + i * 1.3;
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: top, w: 11.7, h: 1.1,
        fill: { color: c.bg }, line: { color: c.border, width: 2 }
      });
      s.addText(c.title, {
        x: 1.1, y: top + 0.15, w: 11.1, h: 0.35,
        fontSize: 14, bold: true, color: c.text
      });
      s.addText(c.desc, {
        x: 1.1, y: top + 0.55, w: 11.1, h: 0.45,
        fontSize: 11, color: DARK
      });
    });
  }

  // SLIDE 9: Stock Operation 4 - Models 21 & 22
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 4: Perpetual Stock Cards & Bin Cards", "WORKFLOW 4");

    // Model 21
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.7, w: 5.6, h: 5.2,
      fill: { color: WHITE }, line: { color: NAVY, width: 2 }
    });
    s.addText("Stock Card — ሞዴል 21", {
      x: 1.1, y: 1.9, w: 5.0, h: 0.4,
      fontSize: 18, bold: true, color: NAVY
    });
    const b21 = [
      "Maintains perpetual institutional stock ledger per item and warehouse.",
      "Records every transaction: Receipts (+), Issues (-), Returns (+), and Transfers (+/-).",
      "Tracks running financial valuation using First-In-First-Out (FIFO) costing.",
      "Reconciled continuously with the University Finance General Ledger.",
      "Prevents discrepancies during internal and external audit reviews."
    ];
    let y = 2.4;
    b21.forEach(it => {
      s.addText("• " + it, {
        x: 1.1, y: y, w: 5.0, h: 0.8,
        fontSize: 12, color: DARK
      });
      y += 0.9;
    });

    // Model 22
    s.addShape(pptx.ShapeType.roundRect, {
      x: 6.9, y: 1.7, w: 5.6, h: 5.2,
      fill: { color: WHITE }, line: { color: TEAL, width: 2 }
    });
    s.addText("Bin Card — ሞዴል 22", {
      x: 7.2, y: 1.9, w: 5.0, h: 0.4,
      fontSize: 18, bold: true, color: TEAL
    });
    const b22 = [
      "Maintained physically and digitally inside warehouse storage aisles.",
      "Tracks exact storage location coordinates: Area -> Rack -> Shelf -> Bin.",
      "Records batch numbers, manufacturing dates, and expiration milestones for perishables.",
      "Updated immediately whenever storekeeper physically shelves or picks items.",
      "Used during physical inventory stocktaking for physical-to-card reconciliation."
    ];
    y = 2.4;
    b22.forEach(it => {
      s.addText("• " + it, {
        x: 7.2, y: y, w: 5.0, h: 0.8,
        fontSize: 12, color: DARK
      });
      y += 0.9;
    });
  }

  // SLIDE 10: Stock Operation 5 - Model 23
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 5: Material Requisition & Dual Approval (Model 23)", "WORKFLOW 5");

    const reqSteps = [
      { title: "Step 1: Department Staff Request (ጠያቂ)", desc: "Staff fills online Store Requisition (ሞዴል 23), specifying items, requested quantities, and academic/operational justifications.", color: NAVY },
      { title: "Step 2: Department Head Endorsement (የክፍል ኃላፊ)", desc: "Department Head checks request against quarterly departmental budget and project deliverables. Approves or returns for revision.", color: TEAL },
      { title: "Step 3: PAO Institutional Quota Approval (የንብረት ኃላፊ)", desc: "PAO conducts institutional check: verifies store inventory, checks user consumption quota, and approves final allocation quantity.", color: GOLD },
      { title: "Step 4: Dispatch Queue Routing", desc: "System locks allocated quantity and instantly sends authorized dispatch ticket to Storekeeper's issuing queue.", color: BLUE }
    ];

    reqSteps.forEach((st, i) => {
      const top = 1.7 + i * 1.3;
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: top, w: 11.7, h: 1.1,
        fill: { color: WHITE }, line: { color: st.color, width: 2 }
      });
      s.addText(st.title, {
        x: 1.1, y: top + 0.15, w: 11.1, h: 0.35,
        fontSize: 14, bold: true, color: st.color
      });
      s.addText(st.desc, {
        x: 1.1, y: top + 0.55, w: 11.1, h: 0.45,
        fontSize: 11, color: DARK
      });
    });
  }

  // SLIDE 11: Stock Operation 6 - Model 20
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 6: Store Issue Voucher (SIV) & Gate Control (Model 20)", "WORKFLOW 6");

    const siv = [
      { title: "Store Issue Voucher (ሞዴል 20 - SIV)", desc: "Storekeeper picks physical goods from bins, verifies batch/serial numbers, prints Model 20 SIV. Recipient employee signs for custody. Inventory is deducted automatically.", color: NAVY },
      { title: "Fixed Asset Custody Binding (ሞዴል 25)", desc: "If the issued item is a capitalized fixed asset (e.g. laptop, lab microscope), the system automatically binds the barcode tag to the recipient's employee profile in Model 25.", color: TEAL },
      { title: "Gate Pass & Security Clearance", desc: "Security officers at campus gates inspect outgoing vehicles and items against the digital Model 20 SIV, logging vehicle plate numbers and driver identity before departure.", color: GOLD }
    ];

    siv.forEach((c, i) => {
      const top = 1.7 + i * 1.75;
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: top, w: 11.7, h: 1.5,
        fill: { color: WHITE }, line: { color: c.color, width: 2 }
      });
      s.addText(c.title, {
        x: 1.1, y: top + 0.2, w: 11.1, h: 0.4,
        fontSize: 15, bold: true, color: c.color
      });
      s.addText(c.desc, {
        x: 1.1, y: top + 0.65, w: 11.1, h: 0.7,
        fontSize: 12, color: DARK
      });
    });
  }

  // SLIDE 12: Stock Operation 7 - Models 24, 26, 27
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 7: Property Returns, Transfers & Disposals", "WORKFLOW 7");

    const op7 = [
      { title: "Property Return Voucher — ሞዴል 24", desc: "For unutilized items or employee departure clearance. Submitted with TEC technical condition evaluation: Serviceable (returned to store), Repairable (sent to maintenance), or Condemned.", color: NAVY },
      { title: "Inter-Store Transfer Voucher — ሞዴል 26", desc: "Authorizes transfer of inventory between university campus stores. Tracks dual-confirmation: 'Transferred-Out' and 'Received-In' ensuring no stock disappears in transit.", color: TEAL },
      { title: "Property Disposal Register — ሞዴል 27", desc: "Governs obsolete, damaged, or expired assets. Governed by the Institutional Disposal Committee for public auction, donation, or approved destruction with accounting write-offs.", color: GOLD }
    ];

    op7.forEach((c, i) => {
      const top = 1.7 + i * 1.75;
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: top, w: 11.7, h: 1.5,
        fill: { color: WHITE }, line: { color: c.color, width: 2 }
      });
      s.addText(c.title, {
        x: 1.1, y: top + 0.2, w: 11.1, h: 0.4,
        fontSize: 15, bold: true, color: c.color
      });
      s.addText(c.desc, {
        x: 1.1, y: top + 0.65, w: 11.1, h: 0.7,
        fontSize: 12, color: DARK
      });
    });
  }

  // SLIDE 13: Stock Operation 8 - Stocktaking
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Stock Operation 8: Physical Counting & Stocktaking Reconciliation", "WORKFLOW 8");

    const stSteps = [
      { title: "1. Stocktaking Session Freeze", desc: "Annual/quarterly counting committee freezes warehouse movements and conducts blind physical counts per bin location.", color: NAVY },
      { title: "2. Variance Analysis Calculation", desc: "System automatically compares physical counts against perpetual stock records, calculating Surpluses (+) and Deficits (-).", color: TEAL },
      { title: "3. Audit Review & Reconciliation", desc: "Internal Audit and PAO investigate variance causes (shrinkage, damaged items, clerical errors) and authorize adjustment entries.", color: GOLD },
      { title: "4. Statutory Audit Sign-off", desc: "Generates official Stocktaking Report for submission to Ministry of Finance and Federal Auditor General.", color: BLUE }
    ];

    stSteps.forEach((st, i) => {
      const top = 1.7 + i * 1.3;
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: top, w: 11.7, h: 1.1,
        fill: { color: WHITE }, line: { color: st.color, width: 2 }
      });
      s.addText(st.title, {
        x: 1.1, y: top + 0.15, w: 11.1, h: 0.35,
        fontSize: 14, bold: true, color: st.color
      });
      s.addText(st.desc, {
        x: 1.1, y: top + 0.55, w: 11.1, h: 0.45,
        fontSize: 11, color: DARK
      });
    });
  }

  // SLIDE 14: Institutional Impact & Internship Learnings
  {
    const s = pptx.addSlide();
    s.background = { color: LIGHT_BG };
    addHeader(s, "Institutional Impact on ASTU & Internship Professional Learnings", "OUTCOMES & IMPACT");

    // Left
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.7, w: 5.6, h: 5.2,
      fill: { color: 'F0FDF4' }, line: { color: '22C55E', width: 2 }
    });
    s.addText("Institutional Impact for ASTU", {
      x: 1.1, y: 1.9, w: 5.0, h: 0.4,
      fontSize: 18, bold: true, color: '166534'
    });
    const bImpact = [
      "100% compliance with Federal Directive No. 1095/2017.",
      "Zero uninspected goods posted to active inventory.",
      "Strict separation of duties between PAO, TEC, and Storekeeper.",
      "Instant audit readiness for Federal Auditor General (OFAG).",
      "Substantial cost savings and elimination of paper document loss."
    ];
    let y = 2.4;
    bImpact.forEach(it => {
      s.addText("✓ " + it, {
        x: 1.1, y: y, w: 5.0, h: 0.8,
        fontSize: 12, color: DARK
      });
      y += 0.9;
    });

    // Right
    s.addShape(pptx.ShapeType.roundRect, {
      x: 6.9, y: 1.7, w: 5.6, h: 5.2,
      fill: { color: 'EFF6FF' }, line: { color: '3B82F6', width: 2 }
    });
    s.addText("Internship Engineering Takeaways", {
      x: 7.2, y: 1.9, w: 5.0, h: 0.4,
      fontSize: 18, bold: true, color: '1E40AF'
    });
    const bLearn = [
      "Translating complex legal and statutory directives into software business rules.",
      "Designing relational enterprise data models with Prisma ORM & PostgreSQL.",
      "Building production-grade, print-ready bilingual government documents.",
      "Debugging complex asynchronous state management and transactional APIs.",
      "Mastering real-world collaborative full-stack engineering practices."
    ];
    y = 2.4;
    bLearn.forEach(it => {
      s.addText("★ " + it, {
        x: 7.2, y: y, w: 5.0, h: 0.8,
        fontSize: 12, color: DARK
      });
      y += 0.9;
    });
  }

  // SLIDE 15: Q&A & Demonstration
  {
    const s = pptx.addSlide();
    s.background = { color: NAVY };

    s.addText("THANK YOU!", {
      x: 1.5, y: 2.0, w: 10.3, h: 0.9,
      fontSize: 44, bold: true, color: WHITE, align: 'center'
    });
    s.addText("Adama Science & Technology University (ASTU)\nAutomated Stock & Property Management System", {
      x: 1.5, y: 3.1, w: 10.3, h: 0.8,
      fontSize: 20, color: GOLD, align: 'center'
    });
    s.addText("System Running Live: Frontend (http://localhost:5173) | Backend API (http://localhost:3001)\nQuestions, Discussion & Live System Demonstration", {
      x: 1.5, y: 4.2, w: 10.3, h: 0.8,
      fontSize: 15, color: 'CBD5E1', align: 'center'
    });
  }

  const outPath = path.resolve('..', 'ASTU_Stock_Management_Internship_Presentation.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log(`PPTX created successfully at: ${outPath}`);
}

buildDeck().catch(err => {
  console.error("Failed to generate PPTX:", err);
  process.exit(1);
});
