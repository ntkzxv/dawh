export interface LandingTranslation {
  nav: {
    features: string;
    analytics: string;
    pricing: string;
    faq: string;
    contact: string;
    login: string;
    startTrial: string;
  };
  hero: {
    line1: string;
    line2: string;
    startPilot: string;
    exploreArch: string;
  };
  dashboard: {
    hubTitle: string;
    roleBadge: string;
    portfolioSub: string;
    modules: {
      erp: string;
      hp: string;
      reports: string;
      api: string;
    };
    chart: {
      title: string;
      stat: string;
      statLabel: string;
      tab7d: string;
      tab30d: string;
      tabFy: string;
      peak: string;
      days: string[];
    };
    queue: {
      title: string;
      auditedBadge: string;
      item1Title: string;
      item1Sub: string;
      item1Tag: string;
      item2Title: string;
      item2Sub: string;
      item2Tag: string;
      item3Title: string;
      item3Sub: string;
      item3Tag: string;
      engineActive: string;
      inspectQueue: string;
    };
  };
  analytics: {
    heading: string;
    subtitle: string;
    kpi1Val: string;
    kpi1Title: string;
    kpi1Desc: string;
    kpi2Val: string;
    kpi2Title: string;
    kpi2Desc: string;
    kpi3Val: string;
    kpi3Title: string;
    kpi3Desc: string;
    kpi4Val: string;
    kpi4Title: string;
    kpi4Desc: string;
    breakdownTitle: string;
    breakdownSub: string;
    tabs: {
      overview: string;
      warehouse: string;
      datacenter: string;
      audit: string;
    };
    overview: {
      bkkTitle: string;
      bkkSub: string;
      cnxTitle: string;
      cnxSub: string;
      hdyTitle: string;
      hdySub: string;
      eecTitle: string;
      eecSub: string;
    };
    warehouse: {
      fmcgTitle: string;
      fmcgSub: string;
      machineryTitle: string;
      machinerySub: string;
      techTitle: string;
      techSub: string;
      transitTitle: string;
      transitSub: string;
    };
    datacenter: {
      activeTitle: string;
      activeSub: string;
      settleTitle: string;
      settleSub: string;
      reminderTitle: string;
      reminderSub: string;
      recoveryTitle: string;
      recoverySub: string;
    };
    audit: {
      ledgerTitle: string;
      ledgerSub: string;
      etaxTitle: string;
      etaxSub: string;
      cryptoTitle: string;
      cryptoSub: string;
      bankTitle: string;
      bankSub: string;
    };
  };
  features: {
    heading: string;
    subtitle: string;
    card1Badge: string;
    card1Title: string;
    card1Desc: string;
    card1P1: string;
    card1P2: string;
    card1P3: string;
    card1P4: string;
    statusActive: string;
    statusSynced: string;
    statusRealtime: string;
    statusVerified: string;
    card2Badge: string;
    card2Title: string;
    card2Desc: string;
    card2GaugeLabel: string;
    card2GaugeBadge: string;
    card3Badge: string;
    card3Title: string;
    card3Desc: string;
    card3Log1: string;
    card3Log2: string;
    card4Badge: string;
    card4Title: string;
    card4Desc: string;
    card4TitleBox: string;
    card4SubBox: string;
    card4BadgeBox: string;
  };
  faq: {
    heading: string;
    subtitle: string;
    items: Array<{ q: string; a: string }>;
  };
  cta: {
    heading: string;
    subtitle: string;
    placeholder: string;
    button: string;
    bullet1: string;
    bullet2: string;
    bullet3: string;
  };
  footer: {
    desc: string;
    colProduct: string;
    colOrg: string;
    colLegal: string;
    aboutUs: string;
    careers: string;
    hiring: string;
    network: string;
    caseStudies: string;
    contactSales: string;
    privacy: string;
    terms: string;
    security: string;
    status: string;
    compliance: string;
    copyright: string;
    tagline: string;
  };
}

export const LANDING_TRANSLATIONS: Record<"EN" | "TH", LandingTranslation> = {
  EN: {
    nav: {
      features: "Features",
      analytics: "Analytics",
      pricing: "Pricing",
      faq: "FAQ",
      contact: "Contact",
      login: "Log in",
      startTrial: "Start Free Trial",
    },
    hero: {
      line1: "Enterprise Operations",
      line2: "Simplified Control",
      startPilot: "Start Enterprise Pilot",
      exploreArch: "Explore Architecture",
    },
    dashboard: {
      hubTitle: "Bangkok Central Hub • Depot #01",
      roleBadge: "ENTERPRISE ADMIN",
      portfolioSub: "฿2.48B Managed Portfolio • 4 Core Modules Synced",
      modules: {
        erp: "Warehouse ERP",
        hp: "HP Datacenter",
        reports: "Reports & Audit",
        api: "API Gateway",
      },
      chart: {
        title: "Live Capital & Inventory Velocity",
        stat: "฿284,910,000",
        statLabel: "Active Ledger Volume",
        tab7d: "7 Days",
        tab30d: "30 Days",
        tabFy: "FY 2026",
        peak: "Sun (Auto-Reconcile)",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun (Auto-Reconcile)"],
      },
      queue: {
        title: "Operations Queue",
        auditedBadge: "3 Audited",
        item1Title: "Batch Stock Dispatch #4910",
        item1Sub: "Warehouse • 1,250 SKUs",
        item1Tag: "99.8% Fill",
        item2Title: "HP Contract Reconciliation",
        item2Sub: "Datacenter • 48 Accounts",
        item2Tag: "Reconciled",
        item3Title: "Automated Financial Audit Run",
        item3Sub: "Reports • Ledger Synced",
        item3Tag: "Verified",
        engineActive: "Enterprise Engine Active",
        inspectQueue: "Inspect Queue",
      },
    },
    analytics: {
      heading: "Numbers that speak louder than words",
      subtitle: "Enterprise organizations scaling with DAWH experience seamless cross-branch sync, audited capital tracking, and zero operational friction.",
      kpi1Val: "฿2.48B+",
      kpi1Title: "Managed Portfolio Capital",
      kpi1Desc: "Cumulative Hire-Purchase asset and lease financing contracts audited safely.",
      kpi2Val: "99.98%",
      kpi2Title: "Inventory Precision Rate",
      kpi2Desc: "Real-time multi-depot SKU tracking across nationwide branch networks.",
      kpi3Val: "94.2%",
      kpi3Title: "Operational Efficiency Gain",
      kpi3Desc: "Accelerated turnaround in debtor reconciliation and cross-dock fulfillment.",
      kpi4Val: "4.2 Hrs",
      kpi4Title: "Saved Per Audit Cycle Daily",
      kpi4Desc: "Eliminates manual ledger reformatting, statement sorting, and paperwork.",
      breakdownTitle: "Multi-Branch Distribution & Inventory Velocity",
      breakdownSub: "Real-time ledger retention, branch inventory balance, and cross-dock logistics",
      tabs: {
        overview: "Overview",
        warehouse: "Warehouse ERP",
        datacenter: "HP Datacenter",
        audit: "Audit Logs",
      },
      overview: {
        bkkTitle: "Bangkok Central Hub",
        bkkSub: "1.2M SKUs • ฿1.24B Capital",
        cnxTitle: "Northern Hub (CNX)",
        cnxSub: "720K SKUs • ฿680M Capital",
        hdyTitle: "Southern Hub (HDY)",
        hdySub: "450K SKUs • ฿390M Capital",
        eecTitle: "Express Cross-dock (EEC)",
        eecSub: "150K SKUs • ฿170M Capital",
      },
      warehouse: {
        fmcgTitle: "FMCG & Consumer",
        fmcgSub: "In-Stock Fill Rate: 99.8%",
        machineryTitle: "Industrial Machinery",
        machinerySub: "In-Stock Fill Rate: 99.2%",
        techTitle: "Tech & Electronics",
        techSub: "Serial Tracked: 100%",
        transitTitle: "Transit Batches",
        transitSub: "Inspected & Verified",
      },
      datacenter: {
        activeTitle: "Performing Leases",
        activeSub: "฿1.88B Current Active",
        settleTitle: "Early Settlement",
        settleSub: "฿350M Cleared YTD",
        reminderTitle: "Reminders Queue",
        reminderSub: "฿170M Auto-Followup",
        recoveryTitle: "Repossession Watch",
        recoverySub: "Risk Containment SLA",
      },
      audit: {
        ledgerTitle: "Ledger Balance",
        ledgerSub: "Zero Discrepancy SLA",
        etaxTitle: "E-Tax RD Invoices",
        etaxSub: "Direct RD Gateway Sync",
        cryptoTitle: "Cryptographic Hashes",
        cryptoSub: "Immutable Logged",
        bankTitle: "Bank Statement Sync",
        bankSub: "T+0 Instant Reconciled",
      },
    },
    features: {
      heading: "Engineered for unstoppable enterprise momentum",
      subtitle: "A unified suite of enterprise tools designed to eliminate operational friction and scale your organization.",
      card1Badge: "01 • HP DATACENTER",
      card1Title: "Hire-Purchase & Financial Ledger Infrastructure",
      card1Desc: "End-to-end lease amortization schedules, automated debtor risk scoring, installment collections, and instant audit reconciliation.",
      card1P1: "HP Contracts",
      card1P2: "Amortization",
      card1P3: "Collections",
      card1P4: "Audit Trail",
      statusActive: "● Active",
      statusSynced: "● Synced",
      statusRealtime: "● Realtime",
      statusVerified: "● Verified",
      card2Badge: "02 • WAREHOUSE ERP",
      card2Title: "Multi-Branch Inventory & Stock Velocity",
      card2Desc: "Real-time barcode tracking, automated purchase reorders, batch expiration controls, and cross-dock dispatch optimization.",
      card2GaugeLabel: "Fulfillment Precision",
      card2GaugeBadge: "Zero Variance SLA",
      card3Badge: "03 • REPORTS & AUDITING",
      card3Title: "Financial Statements & Compliance",
      card3Desc: "Instant balance sheets, profit-and-loss auditing, tax summaries, and cryptographic tamper-proof operational logs.",
      card3Log1: "Audit #8821: BKK Central Hub Month-End Cleared",
      card3Log2: "DAWH Engine: All 12 Ledgers Balanced (0 Errors) ✓",
      card4Badge: "04 • INTEGRATION SERVICES",
      card4Title: "Unified Banking & Enterprise API Gateway",
      card4Desc: "Direct integration with core Thai banking rails, external payment gateways, custom ERP/CRM webhooks, and SOC2-ready encryption.",
      card4TitleBox: "Enterprise Gateway Active",
      card4SubBox: "99.99% Uptime SLA • SOC2 Certified & ISO 27001 Ready",
      card4BadgeBox: "Connected",
    },
    faq: {
      heading: "Frequently Asked Questions",
      subtitle: "Have questions regarding multi-branch architecture, hire-purchase compliance, or security? Explore our enterprise guide.",
      items: [
        {
          q: "How does DAWH integrate with our existing ERP and accounting software?",
          a: "DAWH provides enterprise REST APIs, webhooks, and pre-built connectors for legacy ERPs, SAP, and accounting packages. Your branch inventory, invoices, and general ledgers synchronize in real time with zero system downtime.",
        },
        {
          q: "Can we manage nationwide multi-branch warehouses with separate role permissions?",
          a: "Yes. DAWH is natively engineered for multi-branch organizations. You can define granular role-based permissions (Headquarters Admin, Branch Manager, Warehouse Dispatcher, Auditor) with strict per-branch inventory scoping and inter-branch transfer approval workflows.",
        },
        {
          q: "How does the HP Datacenter handle hire-purchase interest and repayment schedules?",
          a: "The HP Datacenter automates effective rate calculations, flat-rate conversions, penalty interest accruals, VAT installment splits, and automated collection reminders. The platform tracks debtor delinquency risks with instant recovery queue dispatch.",
        },
        {
          q: "Is our financial and customer data secure and compliant?",
          a: "Enterprise security is foundational to DAWH. We enforce bank-grade AES-256 encryption at rest, TLS 1.3 in transit, strict multi-factor authentication, database Row-Level Security (RLS), and cryptographic immutable audit logs for regulatory compliance.",
        },
        {
          q: "Can DAWH be deployed on private cloud or on-premise infrastructure?",
          a: "Yes. In addition to our high-availability managed cloud, we support private VPC (AWS, GCP, Azure) and hybrid on-premise containerized Kubernetes deployments for enterprises with strict data residency requirements.",
        },
        {
          q: "Is there a sandbox environment for evaluation before organization rollout?",
          a: "Absolutely. We offer a 14-day enterprise pilot sandbox preloaded with synthetic multi-branch inventory and mock HP contract ledgers, allowing your leadership and operations teams to test real-world workflows risk-free.",
        },
      ],
    },
    cta: {
      heading: "Accelerate Your Enterprise Operations with DAWH",
      subtitle: "Join enterprises and fast-scaling organizations managing operations on autopilot. Access warehouse logistics, financial datacenters, and automated audit control.",
      placeholder: "Enter corporate email...",
      button: "Request Demo",
      bullet1: "14-Day Pilot Sandbox",
      bullet2: "No Credit Card Required",
      bullet3: "Enterprise Security Included",
    },
    footer: {
      desc: "The modern enterprise platform for scalable inventory, hire-purchase infrastructure, and automated financial auditing.",
      colProduct: "Product",
      colOrg: "Organization",
      colLegal: "Legal & Trust",
      aboutUs: "About DAWH",
      careers: "Careers",
      hiring: "HIRING",
      network: "Branch Network",
      caseStudies: "Case Studies",
      contactSales: "Contact Sales",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      security: "Security & SOC2",
      status: "Platform Status",
      compliance: "Compliance",
      copyright: "All rights reserved.",
      tagline: "Enterprise-grade infrastructure built for high-velocity operations.",
    },
  },
  TH: {
    nav: {
      features: "ฟีเจอร์",
      analytics: "สถิติ & ประสิทธิภาพ",
      pricing: "ราคา",
      faq: "คำถามที่พบบ่อย",
      contact: "ติดต่อเรา",
      login: "เข้าสู่ระบบ",
      startTrial: "ทดลองใช้งานฟรี",
    },
    hero: {
      line1: "ยกระดับการบริหารองค์กร",
      line2: "ควบคุมสะดวกสบาย",
      startPilot: "เริ่มทดลองใช้งานระบบ",
      exploreArch: "ดูภาพรวมสถาปัตยกรรม",
    },
    dashboard: {
      hubTitle: "ศูนย์กระจายสินค้ากรุงเทพฯ • สาขาหลัก #01",
      roleBadge: "ผู้ดูแลระบบระดับองค์กร",
      portfolioSub: "พอร์ตบริหาร ฿2.48 พันล้าน • 4 โมดูลเชื่อมต่อสมบูรณ์",
      modules: {
        erp: "คลังสินค้า ERP",
        hp: "เช่าซื้อ HP Datacenter",
        reports: "รายงาน & บัญชี",
        api: "เกตเวย์ API",
      },
      chart: {
        title: "ความเร็วการหมุนเวียนเงินทุนและสินค้าคงคลัง",
        stat: "฿284,910,000",
        statLabel: "ยอดเดินบัญชีหมุนเวียน",
        tab7d: "7 วัน",
        tab30d: "30 วัน",
        tabFy: "ปีงบ 2026",
        peak: "อาทิตย์ (กระทบยอดอัตโนมัติ)",
        days: ["จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์", "อาทิตย์ (กระทบยอด)"],
      },
      queue: {
        title: "คิวการปฏิบัติงาน",
        auditedBadge: "3 รายการตรวจสอบแล้ว",
        item1Title: "จัดส่งล็อตสต็อกสินค้า #4910",
        item1Sub: "คลังสินค้า • 1,250 รายการสินค้า",
        item1Tag: "เติมสต็อก 99.8%",
        item2Title: "กระทบยอดสัญญาเช่าซื้อ HP",
        item2Sub: "ศูนย์ข้อมูล • 48 บัญชีลูกหนี้",
        item2Tag: "กระทบยอดแล้ว",
        item3Title: "ประมวลผลการตรวจสอบบัญชี",
        item3Sub: "รายงานการเงิน • บัญชีตรงกัน",
        item3Tag: "ผ่านการรับรอง",
        engineActive: "ระบบปฏิบัติการระดับองค์กรทำงานปกติ",
        inspectQueue: "ตรวจสอบคิวงาน",
      },
    },
    analytics: {
      heading: "ตัวเลขที่พิสูจน์ประสิทธิภาพอย่างแท้จริง",
      subtitle: "องค์กรชั้นนำที่ขยายธุรกิจด้วย DAWH สัมผัสประสบการณ์การเชื่อมโยงข้ามสาขาแบบเรียลไทม์ ตรวจสอบบัญชีแม่นยำ และไร้ข้อติดขัด",
      kpi1Val: "฿2.48B+",
      kpi1Title: "พอร์ตสินเชื่อและสัญญาเช่าซื้อ",
      kpi1Desc: "มูลค่าสัญญาเช่าซื้อและสินเชื่อหมุนเวียนที่บริหารจัดการและตรวจสอบอย่างปลอดภัย",
      kpi2Val: "99.98%",
      kpi2Title: "ความแม่นยำของสต็อกสินค้า",
      kpi2Desc: "การติดตาม SKU ข้ามเครือข่ายคลังสินค้าและสาขาทั่วประเทศแบบเรียลไทม์",
      kpi3Val: "94.2%",
      kpi3Title: "ประสิทธิภาพการปฏิบัติงานเพิ่มขึ้น",
      kpi3Desc: "เร่งกระบวนการกระทบยอดหนี้และส่งมอบสินค้าผ่าน Cross-dock รวดเร็วยิ่งขึ้น",
      kpi4Val: "4.2 ชม.",
      kpi4Title: "ประหยัดเวลาทำบัญชีและตรวจต่อวัน",
      kpi4Desc: "ขจัดขั้นตอนการจัดรูปแบบเอกสารและงานตรวจบัญชีย้อนหลังด้วยระบบอัตโนมัติ",
      breakdownTitle: "การกระจายสินค้าและความเร็วสต็อกข้ามสาขา",
      breakdownSub: "ระบบติดตามยอดคงเหลือ บัญชีแยกประเภท และการกระจายสินค้าแบบเรียลไทม์",
      tabs: {
        overview: "ภาพรวม",
        warehouse: "คลังสินค้า ERP",
        datacenter: "เช่าซื้อ HP",
        audit: "บันทึกการตรวจสอบ",
      },
      overview: {
        bkkTitle: "ศูนย์กระจายสินค้ากรุงเทพฯ",
        bkkSub: "1.2 ล้านชิ้น • มูลค่า ฿1.24 พันล้าน",
        cnxTitle: "ศูนย์ภูมิภาคภาคเหนือ",
        cnxSub: "7.2 แสนชิ้น • มูลค่า ฿680 ล้าน",
        hdyTitle: "ศูนย์ภูมิภาคภาคใต้",
        hdySub: "4.5 แสนชิ้น • มูลค่า ฿390 ล้าน",
        eecTitle: "ศูนย์กระจายด่วนระเบียงเศรษฐกิจ",
        eecSub: "1.5 แสนชิ้น • มูลค่า ฿170 ล้าน",
      },
      warehouse: {
        fmcgTitle: "สินค้าอุปโภคบริโภคทั่วไป",
        fmcgSub: "อัตราเติมสต็อกพร้อมส่ง: 99.8%",
        machineryTitle: "เครื่องจักรอุตสาหกรรมและชิ้นส่วน",
        machinerySub: "อัตราเติมสต็อกพร้อมส่ง: 99.2%",
        techTitle: "อุปกรณ์เทคโนโลยีและอิเล็กทรอนิกส์",
        techSub: "ติดตามหมายเลขซีเรียล: 100%",
        transitTitle: "ล็อตสินค้าอยู่ระหว่างจัดส่ง",
        transitSub: "ตรวจสอบและยืนยันแล้ว",
      },
      datacenter: {
        activeTitle: "สัญญาเช่าซื้อสถานะปกติ",
        activeSub: "พอร์ตหมุนเวียน ฿1.88 พันล้าน",
        settleTitle: "ปิดสัญญาก่อนกำหนด",
        settleSub: "ชำระเสร็จสิ้น ฿350 ล้าน",
        reminderTitle: "คิวแจ้งเตือนชำระค่างวด",
        reminderSub: "ระบบติดตามอัตโนมัติ ฿170 ล้าน",
        recoveryTitle: "เฝ้าระวังและติดตามหนี้",
        recoverySub: "ควบคุมความเสี่ยงตามมาตรฐานกำหนด",
      },
      audit: {
        ledgerTitle: "ความถูกต้องของบัญชีแยกประเภท",
        ledgerSub: "ความคลาดเคลื่อนเป็นศูนย์ 100%",
        etaxTitle: "ใบกำกับภาษีอิเล็กทรอนิกส์",
        etaxSub: "เชื่อมตรงระบบกรมสรรพากร 99.4%",
        cryptoTitle: "บันทึกความปลอดภัยทางคณิตศาสตร์",
        cryptoSub: "ป้องกันการแก้ไขข้อมูล 100%",
        bankTitle: "กระทบยอดรายการเดินบัญชีธนาคาร",
        bankSub: "ตรงตามเวลาจริง 98.9%",
      },
    },
    features: {
      heading: "ขับเคลื่อนองค์กรสู่การเติบโตอย่างไร้ขีดจำกัด",
      subtitle: "ชุดเครื่องมือระดับองค์กรที่ออกแบบมาเพื่อขจัดความล่าช้าและเพิ่มความคล่องตัวในการปฏิบัติงาน",
      card1Badge: "01 • HP DATACENTER",
      card1Title: "โครงสร้างสัญญาเช่าซื้อและการบริหารบัญชี",
      card1Desc: "ระบบคำนวณตารางตัดดอกเบี้ยครบวงจร ประเมินความเสี่ยงลูกหนี้ และติดตามยอดชำระอัตโนมัติ",
      card1P1: "สัญญาเช่าซื้อ",
      card1P2: "ตารางดอกเบี้ย",
      card1P3: "ระบบติดตามหนี้",
      card1P4: "ประวัติการตรวจ",
      statusActive: "● ใช้งานอยู่",
      statusSynced: "● ซิงก์แล้ว",
      statusRealtime: "● เรียลไทม์",
      statusVerified: "● ตรวจสอบแล้ว",
      card2Badge: "02 • WAREHOUSE ERP",
      card2Title: "การบริหารคลังสินค้าและการหมุนเวียนหลายสาขา",
      card2Desc: "สแกนบาร์โค้ดติดตามแบบเรียลไทม์ ระบบแจ้งเตือนสั่งซื้ออัตโนมัติ ควบคุมวันหมดอายุ และจัดส่งด่วน",
      card2GaugeLabel: "ความแม่นยำในการจัดส่ง",
      card2GaugeBadge: "มาตรฐานคลาดเคลื่อน 0%",
      card3Badge: "03 • REPORTS & AUDITING",
      card3Title: "งบการเงินและการตรวจสอบตามมาตรฐาน",
      card3Desc: "ออกงบดุล งบกำไรขาดทุน รายงานภาษี และบันทึกประวัติการทำธุรกรรมแบบป้องกันการแก้ไข",
      card3Log1: "ตรวจบัญชี #8821: ปิดยอดสิ้นเดือนสาขาหลัก BKK เรียบร้อย",
      card3Log2: "เครื่องมือ DAWH: บัญชีแยกประเภททั้ง 12 เล่มตรงกัน (0 ข้อผิดพลาด) ✓",
      card4Badge: "04 • INTEGRATION SERVICES",
      card4Title: "เกตเวย์เชื่อมต่อธนาคารและ API ระดับองค์กร",
      card4Desc: "เชื่อมต่อระบบธนาคารไทยชั้นนำ ช่องทางชำระเงิน Webhooks และการเข้ารหัสความปลอดภัยมาตรฐาน SOC2",
      card4TitleBox: "เกตเวย์องค์กรทำงานปกติ",
      card4SubBox: "รับประกันระบบพร้อมใช้ 99.99% • มาตรฐาน SOC2 & ISO 27001",
      card4BadgeBox: "เชื่อมต่อแล้ว",
    },
    faq: {
      heading: "คำถามที่พบบ่อย",
      subtitle: "มีข้อสงสัยเกี่ยวกับสถาปัตยกรรมหลายสาขา การคำนวณสัญญาเช่าซื้อ หรือความปลอดภัย? ค้นหาคำตอบได้ที่นี่",
      items: [
        {
          q: "DAWH สามารถเชื่อมต่อกับระบบ ERP และโปรแกรมบัญชีเดิมขององค์กรได้อย่างไร?",
          a: "DAWH มี REST API, Webhooks และตัวเชื่อมต่อสำเร็จรูปสำหรับระบบ ERP ดั้งเดิม, SAP และโปรแกรมบัญชีชั้นนำ ข้อมูลสต็อกสาขา ใบกำกับภาษี และสมุดบัญชีจะซิงก์กันแบบเรียลไทม์โดยไม่กระทบการทำงานเดิม",
        },
        {
          q: "สามารถจัดการคลังสินค้าหลายสาขาทั่วประเทศพร้อมกำหนดสิทธิ์แยกกันได้หรือไม่?",
          a: "ได้แน่นอน DAWH ออกแบบมาเพื่อรองรับองค์กรหลายสาขาโดยเฉพาะ คุณสามารถกำหนดสิทธิ์แบบ Role-Based (ผู้ดูแลสำนักงานใหญ่, ผู้จัดการสาขา, เจ้าหน้าที่คลัง, ผู้ตรวจสอบ) พร้อมระบบอนุมัติการโอนย้ายสินค้าระหว่างสาขา",
        },
        {
          q: "HP Datacenter จัดการดอกเบี้ยเช่าซื้อและตารางการชำระเงินอย่างไร?",
          a: "ระบบคำนวณดอกเบี้ยแบบลดต้นลดดอก (Effective Rate) และอัตราคงที่ (Flat Rate), เบี้ยปรับล่าช้า, ภาษีมูลค่าเพิ่มค่างวดอัตโนมัติตามมาตรฐานกฎหมาย พร้อมระบบแจ้งเตือนและจัดคิวติดตามหนี้ทันที",
        },
        {
          q: "ข้อมูลทางการเงินและข้อมูลลูกค้าขององค์กรมีความปลอดภัยเพียงใด?",
          a: "ความปลอดภัยคือหัวใจของ DAWH เราใช้การเข้ารหัสระดับธนาคาร AES-256 ในการจัดเก็บ และ TLS 1.3 ในการส่งข้อมูล มีการยืนยันตัวตนแบบ MFA, สิทธิ์ระดับแถวข้อมูล (Row-Level Security) และบันทึก Audit Logs ที่เปลี่ยนแปลงไม่ได้",
        },
        {
          q: "DAWH สามารถติดตั้งบน Private Cloud หรือ เซิร์ฟเวอร์ On-Premise ได้หรือไม่?",
          a: "ได้ นอกจากระบบคลาวด์มาตรฐานที่มีความพร้อมใช้งานสูง เรายังรองรับการติดตั้งบน Private VPC (AWS, GCP, Azure) และแบบ On-Premise ด้วยคอนเทนเนอร์ Kubernetes สำหรับองค์กรที่มีนโยบายควบคุมข้อมูลภายใน",
        },
        {
          q: "มีระบบทดลอง (Sandbox) ให้ทดสอบก่อนนำไปใช้งานจริงในองค์กรหรือไม่?",
          a: "มี เรามีระบบ Enterprise Pilot Sandbox ให้ทดลองใช้งานฟรี 14 วัน พร้อมข้อมูลจำลองสินค้าคงคลังและสัญญาเช่าซื้อ เพื่อให้ฝ่ายปฏิบัติการและการเงินได้ทดสอบขั้นตอนการทำงานจริงก่อนการเริ่มระบบ",
        },
      ],
    },
    cta: {
      heading: "เร่งสปีดการดำเนินงานระดับองค์กรของคุณด้วย DAWH",
      subtitle: "ร่วมเป็นส่วนหนึ่งขององค์กรที่บริหารจัดการอย่างเป็นระบบ ทั้งคลังสินค้า ศูนย์ข้อมูลการเงิน และการตรวจสอบบัญชีอัตโนมัติ",
      placeholder: "กรอกอีเมลองค์กรของคุณ...",
      button: "ขอนัดหมายสาธิตระบบ",
      bullet1: "ทดลองใช้งานฟรี 14 วัน",
      bullet2: "ไม่ต้องใช้บัตรเครดิต",
      bullet3: "รวมระบบความปลอดภัยระดับองค์กร",
    },
    footer: {
      desc: "แพลตฟอร์มระดับองค์กรรุ่นใหม่สำหรับการจัดการคลังสินค้า โครงสร้างสัญญาเช่าซื้อ และการตรวจสอบบัญชีอัตโนมัติ",
      colProduct: "ผลิตภัณฑ์",
      colOrg: "องค์กร",
      colLegal: "กฎหมาย & ความปลอดภัย",
      aboutUs: "เกี่ยวกับ DAWH",
      careers: "ร่วมงานกับเรา",
      hiring: "เปิดรับสมัคร",
      network: "เครือข่ายสาขา",
      caseStudies: "กรณีศึกษา",
      contactSales: "ติดต่อฝ่ายขาย",
      privacy: "นโยบายความเป็นส่วนตัว",
      terms: "ข้อกำหนดการให้บริการ",
      security: "ความปลอดภัย & SOC2",
      status: "สถานะระบบ",
      compliance: "มาตรฐานกำกับดูแล",
      copyright: "สงวนลิขสิทธิ์ทั้งหมด",
      tagline: "โครงสร้างพื้นฐานระดับองค์กรเพื่อการปฏิบัติงานที่รวดเร็วและแม่นยำ",
    },
  },
};
