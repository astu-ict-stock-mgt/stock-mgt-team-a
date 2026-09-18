import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Modal, Button, Badge } from './ui'
import { useApp } from '../context/AppContext'

interface GrnLine {
  id?: string
  itemId?: string
  quantity?: number
  receivedQty?: number | string
  unitCost?: number | string
  totalCost?: number | string
  item?: { name?: string; code?: string }
  unit?: { symbol?: string; name?: string }
}

export interface GrnSheetData {
  id?: string
  receiptNumber?: string
  grnNumber?: string
  createdAt?: string
  receivedDate?: string
  deliveryDate?: string
  supplier?: { name?: string; code?: string; contactPerson?: string; phone?: string }
  store?: { name?: string; code?: string }
  department?: { name?: string; code?: string }
  purchaseOrderNumber?: string
  notes?: string
  status?: string
  totalAmount?: number | string
  lines?: GrnLine[]
  evaluations?: Array<{
    status?: string
    decision?: string
    evaluator?: { fullName?: string; email?: string }
    decisionDate?: string
  }>
  receivedByUser?: { fullName?: string }
  finalizedByUser?: { fullName?: string }
}

export interface Model19CopyConfig {
  id: 'COPY_1' | 'COPY_2' | 'COPY_3' | 'COPY_4'
  copyNumber: 1 | 2 | 3 | 4
  amharicLabel: string
  englishLabel: string
  recipientAmharic: string
  recipientEnglish: string
  colorName: string
  badgeBg: string
  badgeText: string
  paperBg: string
  paperBorder: string
  accentColor: string
  stampBorder: string
  defaultForRoles: string[]
  mandateDescription: string
}

export const MODEL_19_COPIES: Model19CopyConfig[] = [
  {
    id: 'COPY_1',
    copyNumber: 1,
    amharicLabel: 'ዋናው ቅጂ (1ኛ)',
    englishLabel: 'Original (Copy 1)',
    recipientAmharic: 'ለሂሳብ ክፍል (የክፍያ ማዘዣ)',
    recipientEnglish: 'Finance / Accounts Payable (Payment Authorization)',
    colorName: 'White (ነጭ)',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    badgeText: 'text-slate-900',
    paperBg: '#ffffff',
    paperBorder: '#000000',
    accentColor: '#0f172a',
    stampBorder: '#334155',
    defaultForRoles: ['ACCOUNTANT', 'FINANCE'],
    mandateDescription: 'Attached to supplier tax invoice and PO for auditing, financial ledger entry, and payment disbursement.',
  },
  {
    id: 'COPY_2',
    copyNumber: 2,
    amharicLabel: '2ኛ ቅጂ (ቢጫ)',
    englishLabel: '2nd Copy (Yellow)',
    recipientAmharic: 'ለመጋዘን ኃላፊው (ስቶክ መመዝገቢያ)',
    recipientEnglish: 'Storekeeper / Store Head (Stock & Bin Card Posting)',
    colorName: 'Canary Yellow (ቢጫ)',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeText: 'text-amber-950',
    paperBg: '#fefce8', // Authentic canary yellow carbon paper tint
    paperBorder: '#b45309',
    accentColor: '#92400e',
    stampBorder: '#b45309',
    defaultForRoles: ['STOREKEEPER', 'STORE_HEAD'],
    mandateDescription: 'Legal authorization for the Storekeeper to shelve delivered goods and record entries on Stock Card (Model 21) & Bin Card (Model 22).',
  },
  {
    id: 'COPY_3',
    copyNumber: 3,
    amharicLabel: '3ኛ ቅጂ (ሰማያዊ)',
    englishLabel: '3rd Copy (Blue)',
    recipientAmharic: 'ለንብረት አስተዳደር ክፍል (መቆጣጠሪያ)',
    recipientEnglish: 'Property Administration Office / PAO (Control Register)',
    colorName: 'Light Blue (ሰማያዊ)',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    badgeText: 'text-blue-950',
    paperBg: '#eff6ff', // Authentic light blue carbon paper tint
    paperBorder: '#1d4ed8',
    accentColor: '#1e40af',
    stampBorder: '#1d4ed8',
    defaultForRoles: ['PAO', 'ADMIN', 'SYSTEM_ADMIN'],
    mandateDescription: 'Retained in the PAO bound pad register as an official statutory oversight, fixed asset registration, and audit copy.',
  },
  {
    id: 'COPY_4',
    copyNumber: 4,
    amharicLabel: '4ኛ ቅጂ (አረንጓዴ)',
    englishLabel: '4th Copy (Green)',
    recipientAmharic: 'ለአቅራቢው / ለአስረካቢው',
    recipientEnglish: 'Supplier / Deliverer (Handover Confirmation)',
    colorName: 'Light Green (አረንጓዴ)',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    badgeText: 'text-emerald-950',
    paperBg: '#f0fdf4', // Authentic light green carbon paper tint
    paperBorder: '#15803d',
    accentColor: '#166534',
    stampBorder: '#15803d',
    defaultForRoles: ['SUPPLIER'],
    mandateDescription: 'Handed to the supplier representative/carrier as official institutional proof that goods were formally accepted.',
  },
]

interface GrnSheetModalProps {
  open: boolean
  onClose: () => void
  receipt: GrnSheetData | null
  initialCopy?: 'COPY_1' | 'COPY_2' | 'COPY_3' | 'COPY_4'
}

function numberToBirrWords(num: number): string {
  if (isNaN(num) || num === 0) return 'Zero Birr and 00/100 Cents Only'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const intPart = Math.floor(Math.abs(num))
  const cents = Math.round((Math.abs(num) - intPart) * 100)

  const convertGroup = (n: number): string => {
    if (n === 0) return ''
    if (n < 20) return ones[n] + ' '
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '') + ' '
    return ones[Math.floor(n / 100)] + ' Hundred ' + (n % 100 ? convertGroup(n % 100) : '')
  }

  let result = ''
  const billions = Math.floor(intPart / 1000000000)
  const millions = Math.floor((intPart % 1000000000) / 1000000)
  const thousands = Math.floor((intPart % 1000000) / 1000)
  const remainder = intPart % 1000

  if (billions) result += convertGroup(billions) + 'Billion '
  if (millions) result += convertGroup(millions) + 'Million '
  if (thousands) result += convertGroup(thousands) + 'Thousand '
  if (remainder) result += convertGroup(remainder)

  result = result.trim() + ' Birr'
  if (cents > 0) {
    result += ` and ${cents.toString().padStart(2, '0')}/100 Cents`
  } else {
    result += ' and 00/100 Cents'
  }

  return result + ' Only'
}

export default function GrnSheetModal({ open, onClose, receipt, initialCopy }: GrnSheetModalProps) {
  const { currentUser } = useApp()
  const printRef = useRef<HTMLDivElement>(null)

  // Determine user role and default copy
  const userRoles = useMemo(() => {
    const roles: string[] = []
    if (currentUser?.roles) {
      currentUser.roles.forEach((r: any) => roles.push((r.code || r).toUpperCase()))
    }
    if ((currentUser as any)?.role) {
      roles.push(((currentUser as any).role).toUpperCase())
    }
    return roles
  }, [currentUser])

  const defaultCopyId = useMemo<'COPY_1' | 'COPY_2' | 'COPY_3' | 'COPY_4'>(() => {
    if (initialCopy) return initialCopy
    if (userRoles.includes('STOREKEEPER') || userRoles.includes('STORE_HEAD')) return 'COPY_2' // Yellow Storekeeper copy!
    if (userRoles.includes('ACCOUNTANT') || userRoles.includes('FINANCE')) return 'COPY_1' // White Finance copy!
    if (userRoles.includes('PAO') || userRoles.includes('ADMIN') || userRoles.includes('SYSTEM_ADMIN')) return 'COPY_3' // Blue PAO copy!
    return 'COPY_1'
  }, [initialCopy, userRoles])

  const [activeCopyId, setActiveCopyId] = useState<'COPY_1' | 'COPY_2' | 'COPY_3' | 'COPY_4' | 'ALL'>('COPY_2')

  useEffect(() => {
    if (open) {
      setActiveCopyId(defaultCopyId)
    }
  }, [open, defaultCopyId])

  if (!receipt) return null

  const grnRef = receipt.grnNumber || receipt.receiptNumber || 'GRN-PENDING'
  const dateStr = receipt.receivedDate || receipt.deliveryDate || receipt.createdAt
  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')

  const lines = receipt.lines || []
  const totalValue = Number(receipt.totalAmount) || lines.reduce((sum, l) => {
    const qty = Number(l.quantity ?? l.receivedQty ?? 0)
    const cost = Number(l.unitCost ?? 0)
    return sum + (qty * cost)
  }, 0)

  const tecEvaluatorName = receipt.evaluations?.[0]?.evaluator?.fullName || 'Technical Evaluation Committee'
  const isApprovedOrPosted = ['APPROVED', 'EVALUATED', 'FINALIZED'].includes(receipt.status?.toUpperCase() || '') || !!receipt.grnNumber

  const amountInWords = numberToBirrWords(totalValue)

  const currentCopyConfig = MODEL_19_COPIES.find(c => c.id === (activeCopyId === 'ALL' ? 'COPY_1' : activeCopyId)) || MODEL_19_COPIES[0]

  // Generate single page HTML for a specific copy
  const generateSingleCopyHtml = (cfg: Model19CopyConfig) => {
    return `
      <div class="document-container" style="background-color: ${cfg.paperBg}; border-color: ${cfg.paperBorder};">
        <!-- Official Header -->
        <table class="header-table">
          <tr>
            <td style="width: 15%; text-align: left;">
              <div class="coat-of-arms">
                <div class="crest-box" style="border-color: ${cfg.paperBorder}; color: ${cfg.paperBorder};">ASTU</div>
              </div>
            </td>
            <td style="width: 55%; text-align: center;">
              <div class="republic-title">የኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ የገንዘብ ሚኒስቴር</div>
              <div class="ministry-title">FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA — MINISTRY OF FINANCE</div>
              <div class="ministry-title">የመንግሥት ግዥና ንብረት ባለሥልጣን / PUBLIC PROCUREMENT & PROPERTY AUTHORITY</div>
              <div class="university-title">የአዳማ ሳይንስና ቴክኖሎጂ ዩኒቨርሲቲ / ADAMA SCIENCE & TECHNOLOGY UNIVERSITY</div>
            </td>
            <td style="width: 30%; text-align: right;">
              <div class="model-badge-box" style="border-color: ${cfg.paperBorder};">
                <div class="model-name" style="border-bottom-color: ${cfg.paperBorder};">${isApprovedOrPosted ? 'ሞዴል 19 / MODEL 19' : 'ጊዜያዊ መቀበያ / PROVISIONAL'}</div>
                <div style="font-size: 10px;"><strong>ቁጥር / No:</strong> ${grnRef}</div>
                <div style="font-size: 10px;"><strong>ቀን / Date:</strong> ${formattedDate}</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Official Statutory Copy Designation Banner -->
        <div class="copy-designation-strip" style="background-color: ${cfg.paperBg}; border: 1.5px solid ${cfg.paperBorder};">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="text-align: left; font-weight: bold; font-size: 11px; color: ${cfg.accentColor};">
                ${cfg.amharicLabel} — ${cfg.recipientAmharic}
              </td>
              <td style="text-align: right; font-weight: bold; font-size: 10px; color: ${cfg.accentColor};">
                ${cfg.englishLabel.toUpperCase()} — ${cfg.recipientEnglish.toUpperCase()}
              </td>
            </tr>
          </table>
        </div>

        ${!isApprovedOrPosted ? `
        <!-- Statutory Warning for Provisional Receipt -->
        <div style="background: #fffbeb; border: 1.5px dashed #b45309; padding: 6px 10px; margin: 6px 0; text-align: center;">
          <div style="font-size: 11px; font-weight: bold; color: #92400e;">« ቴክኒካል ምርመራ ያልተደረገለት ጊዜያዊ የዕቃ መቀበያ ሰነድ — በሞዴል 19 አልፀደቀም »</div>
          <div style="font-size: 9.5px; font-style: italic; color: #b45309;">PROVISIONAL RECEIPT ONLY — PENDING TEC INSPECTION & PAO AUTHORIZATION (NOT POSTED TO INVENTORY)</div>
        </div>
        ` : ''}

        <!-- Document Title -->
        <div class="doc-title-banner" style="border-top-color: ${cfg.paperBorder}; border-bottom-color: ${cfg.paperBorder};">
          <h2>${isApprovedOrPosted ? 'የዕቃ መረከቢያ ሰነድ' : 'ጊዜያዊ የዕቃ መቀበያ ሰነድ'}</h2>
          <p>${isApprovedOrPosted ? 'GOODS RECEIVING NOTE (GRN) — MODEL 19' : 'PROVISIONAL INWARD GOODS RECEIPT (RCV)'}</p>
        </div>

        <!-- Metadata Table -->
        <table class="info-grid-table" style="border-color: ${cfg.paperBorder};">
          <tr>
            <td style="width: 50%; border-color: ${cfg.paperBorder};">
              <span class="label-am">የአቅራቢው ስም እና አድራሻ / Supplier Name & Address:</span>
              <div class="val-text">${receipt.supplier?.name || 'N/A'}</div>
              ${receipt.supplier?.code ? `<div style="font-size: 10px; color: #444;">የአቅራቢ መለያ / Code: <strong>${receipt.supplier.code}</strong></div>` : ''}
              ${receipt.supplier?.phone ? `<div style="font-size: 10px; color: #444;">ስልክ / Phone: ${receipt.supplier.phone}</div>` : ''}
            </td>
            <td style="width: 50%; border-color: ${cfg.paperBorder};">
              <span class="label-am">የመጋዘን ስም / Warehouse / Storehouse:</span>
              <div class="val-text">${receipt.store?.name || 'Central Storehouse'}</div>
              ${receipt.store?.code ? `<div style="font-size: 10px; color: #444;">የመጋዘን ኮድ / Store Code: <strong>${receipt.store.code}</strong></div>` : ''}
              <div style="font-size: 10px; color: #444; margin-top: 2px;">ሁኔታ / Status: <strong>${isApprovedOrPosted ? 'ተረጋግጦ በሞዴል 19 የጸደቀ (Model 19 Approved & Posted)' : 'ምርመራ በመጠባበቅ ላይ (Pending Evaluation)'}</strong></div>
            </td>
          </tr>
          <tr>
            <td style="border-color: ${cfg.paperBorder};">
              <span class="label-am">የትዕዛዝ / ውል ቁጥር / PO or Contract Reference:</span>
              <div class="val-text font-mono">${receipt.purchaseOrderNumber || 'N/A'}</div>
            </td>
            <td style="border-color: ${cfg.paperBorder};">
              <span class="label-am">የሰነዱ ሕጋዊ ዓላማ / Statutory Copy Mandate:</span>
              <div class="val-text" style="color: ${cfg.accentColor}; font-size: 10px;">${cfg.mandateDescription}</div>
            </td>
          </tr>
        </table>

        <!-- Line Items Table -->
        <table class="items-table" style="border-color: ${cfg.paperBorder};">
          <thead>
            <tr style="background: rgba(0,0,0,0.04);">
              <th style="width: 5%; border-color: ${cfg.paperBorder};">ተ.ቁ<br/><span class="label-en">Item</span></th>
              <th style="width: 15%; border-color: ${cfg.paperBorder};">የዕቃው ኮድ<br/><span class="label-en">Stock No / Code</span></th>
              <th style="width: 35%; border-color: ${cfg.paperBorder};">የዕቃው ዓይነትና ዝርዝር መግለጫ<br/><span class="label-en">Description of Articles / Specifications</span></th>
              <th style="width: 10%; border-color: ${cfg.paperBorder};">መለኪያ<br/><span class="label-en">Unit</span></th>
              <th style="width: 10%; border-color: ${cfg.paperBorder};">ብዛት<br/><span class="label-en">Quantity</span></th>
              <th style="width: 12%; border-color: ${cfg.paperBorder};">የአንዱ ዋጋ<br/><span class="label-en">Unit Price</span></th>
              <th style="width: 13%; border-color: ${cfg.paperBorder};">ጠቅላላ ዋጋ<br/><span class="label-en">Total Price</span></th>
            </tr>
          </thead>
          <tbody>
            ${lines.map((line, idx) => {
              const qty = Number(line.quantity ?? line.receivedQty ?? 0)
              const cost = Number(line.unitCost ?? 0)
              const total = qty * cost
              return `
                <tr>
                  <td class="text-center" style="border-color: ${cfg.paperBorder};">${idx + 1}</td>
                  <td class="font-mono text-center" style="border-color: ${cfg.paperBorder};">${line.item?.code || 'N/A'}</td>
                  <td style="border-color: ${cfg.paperBorder};"><strong>${line.item?.name || 'Item'}</strong></td>
                  <td class="text-center" style="border-color: ${cfg.paperBorder};">${line.unit?.symbol || line.unit?.name || 'Pcs'}</td>
                  <td class="text-center" style="font-weight: bold; border-color: ${cfg.paperBorder};">${qty}</td>
                  <td class="text-right" style="border-color: ${cfg.paperBorder};">${cost.toFixed(2)}</td>
                  <td class="text-right font-mono" style="font-weight: bold; border-color: ${cfg.paperBorder};">${total.toFixed(2)}</td>
                </tr>
              `
            }).join('')}
            ${lines.length === 0 ? `
              <tr><td colspan="7" class="text-center" style="padding: 12px;">ምንም የተመዘገበ ዕቃ የለም / No items recorded</td></tr>
            ` : ''}
          </tbody>
          <tfoot>
            <tr style="border-top: 1.5px solid ${cfg.paperBorder};">
              <td colspan="6" class="text-right" style="font-weight: bold; border-color: ${cfg.paperBorder};">
                አጠቃላይ ድምር ዋጋ በብር / GRAND TOTAL (ETB):
              </td>
              <td class="text-right font-mono" style="font-weight: bold; font-size: 11px; border-color: ${cfg.paperBorder};">
                ${totalValue.toFixed(2)} ETB
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Total in Words -->
        <div class="amount-words-box" style="border-color: ${cfg.paperBorder};">
          <strong>ጠቅላላ ድምር በፊደል / Total Amount in Words:</strong>
          <span style="text-decoration: underline; margin-left: 6px; font-style: italic;">${amountInWords}</span>
        </div>

        <!-- Official 3-Way Bordered Signatures Matrix -->
        <div class="signatures-matrix">
          <!-- Box 1: Storekeeper -->
          <div class="sig-card" style="border-color: ${cfg.paperBorder}; ${cfg.id === 'COPY_2' ? 'background-color: #fef08a;' : ''}">
            <div class="sig-card-header" style="border-bottom-color: ${cfg.paperBorder};">
              1. የተረከበው የመጋዘን ኃላፊ<br/>
              <span style="font-weight: normal; font-size: 8.5px;">Received by Storekeeper</span>
            </div>
            <div>
              <div class="sig-field"><strong>ስም:</strong> ${receipt.receivedByUser?.fullName || 'Storekeeper'}</div>
              <div class="sig-field"><strong>ፊርማ:</strong> ___________________</div>
              <div class="sig-field"><strong>ቀን:</strong> ${formattedDate}</div>
            </div>
            <div class="stamp-box" style="border-color: ${cfg.stampBorder};">የመጋዘን ማህተም / Store Stamp</div>
          </div>

          <!-- Box 2: TEC Committee -->
          <div class="sig-card" style="border-color: ${cfg.paperBorder};">
            <div class="sig-card-header" style="border-bottom-color: ${cfg.paperBorder};">
              2. የቴክኒክ ምርመራ ኮሚቴ<br/>
              <span style="font-weight: normal; font-size: 8.5px;">Technical Evaluation Committee</span>
            </div>
            <div>
              <div class="sig-field"><strong>አባል/መሪ:</strong> ${tecEvaluatorName}</div>
              <div class="sig-field"><strong>ውሳኔ:</strong> ${isApprovedOrPosted ? 'ተረጋግጧል (Certified)' : 'በመገምገም ላይ'}</div>
              <div class="sig-field"><strong>ፊርማ:</strong> ___________________</div>
              <div class="sig-field"><strong>ቀን:</strong> ${formattedDate}</div>
            </div>
            <div class="stamp-box" style="border-color: ${cfg.stampBorder};">የቴክኒክ ማህተም / TEC Seal</div>
          </div>

          <!-- Box 3: PAO -->
          <div class="sig-card" style="border-color: ${cfg.paperBorder}; ${cfg.id === 'COPY_3' ? 'background-color: #bfdbfe;' : ''}">
            <div class="sig-card-header" style="border-bottom-color: ${cfg.paperBorder};">
              3. ያጸደቀው የንብረት ኃላፊ<br/>
              <span style="font-weight: normal; font-size: 8.5px;">Approved by Property Admin (PAO)</span>
            </div>
            <div>
              <div class="sig-field"><strong>ስም:</strong> ${receipt.finalizedByUser?.fullName || 'Property Admin Officer'}</div>
              <div class="sig-field"><strong>ውሳኔ:</strong> ${isApprovedOrPosted ? 'ተፈቅዷል (Approved)' : 'ይረጋገጥ'}</div>
              <div class="sig-field"><strong>ፊርማ:</strong> ___________________</div>
              <div class="sig-field"><strong>ቀን:</strong> ${formattedDate}</div>
            </div>
            <div class="stamp-box" style="border-color: ${cfg.stampBorder};">የንብረት አስተዳደር ማህተም / PAO Seal</div>
          </div>
        </div>

        <!-- Legal Footnote -->
        <div class="footer-note" style="border-top-color: ${cfg.paperBorder}; color: #333;">
          ይህ የዕቃ መረከቢያ ሰነድ ሞዴል 19 በኢ.ፌ.ዴ.ሪ የገንዘብ ሚኒስቴር የመንግሥት ንብረት አስተዳደር መመሪያ ቁጥር 1095/2010 መሠረት የተዘጋጀ ሕጋዊ ሰነድ ነው::
          <br/>Prepared pursuant to FDRE Ministry of Finance Federal Government Property Administration Directive No. 1095/2017.
        </div>
      </div>
    `
  }

  const handlePrint = (printMode: 'CURRENT' | 'ALL') => {
    const printWindow = window.open('', '_blank', 'width=950,height=800')
    if (!printWindow) {
      window.print()
      return
    }

    const copiesToPrint = printMode === 'ALL'
      ? MODEL_19_COPIES
      : [currentCopyConfig]

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="am">
        <head>
          <meta charset="UTF-8" />
          <title>Model 19 Goods Receiving Note (${printMode === 'ALL' ? 'Complete 4-Copy Booklet' : currentCopyConfig.englishLabel}) - ${grnRef}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Times New Roman', Times, serif, 'Nyala', 'Abyssinica SIL', sans-serif;
              color: #000;
              background: #fff;
              padding: 6px;
              font-size: 11px;
              line-height: 1.25;
            }
            .page-break-container {
              page-break-after: always;
              margin-bottom: 20px;
            }
            .page-break-container:last-child {
              page-break-after: avoid;
              margin-bottom: 0;
            }
            .document-container {
              border: 2px solid #000;
              padding: 12px 14px;
              width: 100%;
              max-width: 820px;
              margin: 0 auto;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 6px;
            }
            .header-table td {
              vertical-align: middle;
            }
            .crest-box {
              width: 52px;
              height: 52px;
              border: 2px solid #000;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 13px;
              margin: 0 auto;
            }
            .republic-title {
              text-align: center;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .ministry-title {
              text-align: center;
              font-size: 10px;
              font-weight: bold;
              margin-top: 1px;
            }
            .university-title {
              text-align: center;
              font-size: 11px;
              font-weight: bold;
              margin-top: 2px;
              border-bottom: 1px solid #000;
              padding-bottom: 3px;
            }
            .model-badge-box {
              border: 2px solid #000;
              padding: 4px 8px;
              text-align: center;
              background: rgba(255,255,255,0.85);
            }
            .model-badge-box .model-name {
              font-size: 12px;
              font-weight: bold;
              border-bottom: 1px solid #000;
              padding-bottom: 2px;
              margin-bottom: 2px;
            }
            .copy-designation-strip {
              padding: 4px 8px;
              margin-bottom: 6px;
              font-weight: bold;
            }
            .doc-title-banner {
              text-align: center;
              border-top: 1.5px solid #000;
              border-bottom: 1.5px solid #000;
              padding: 4px 0;
              margin: 6px 0;
              background: rgba(0,0,0,0.03);
            }
            .doc-title-banner h2 {
              font-size: 13px;
              font-weight: bold;
              letter-spacing: 0.5px;
            }
            .doc-title-banner p {
              font-size: 10px;
              font-weight: bold;
            }
            .info-grid-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 6px;
              border: 1px solid #000;
            }
            .info-grid-table td {
              border: 1px solid #000;
              padding: 3px 6px;
              font-size: 10px;
              vertical-align: top;
            }
            .label-am { font-weight: bold; color: #000; }
            .label-en { font-size: 9px; color: #444; }
            .val-text { font-weight: bold; font-size: 10.5px; margin-top: 1px; }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 6px;
              border: 1.5px solid #000;
            }
            .items-table th {
              border: 1px solid #000;
              padding: 4px 3px;
              font-size: 9.5px;
              font-weight: bold;
              text-align: center;
            }
            .items-table td {
              border: 1px solid #000;
              padding: 4px 5px;
              font-size: 10px;
            }
            .items-table tfoot td {
              font-weight: bold;
              background: rgba(0,0,0,0.02);
              border-top: 1.5px solid #000;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .amount-words-box {
              border: 1px solid #000;
              padding: 4px 6px;
              margin-bottom: 8px;
              font-size: 10px;
              background: rgba(255,255,255,0.7);
            }
            .signatures-matrix {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 6px;
              margin-top: 6px;
            }
            .sig-card {
              border: 1px solid #000;
              padding: 6px 5px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              min-height: 115px;
              background: rgba(255,255,255,0.9);
            }
            .sig-card-header {
              font-weight: bold;
              font-size: 9.5px;
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 2px;
              margin-bottom: 4px;
            }
            .sig-field {
              font-size: 9.5px;
              margin-bottom: 2px;
            }
            .stamp-box {
              border: 1px dashed #666;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8.5px;
              color: #555;
              margin-top: 3px;
            }
            .footer-note {
              text-align: center;
              font-size: 8.5px;
              margin-top: 6px;
              padding-top: 3px;
              border-top: 1px dotted #555;
            }
            @media print {
              body { padding: 0; }
              .document-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          ${copiesToPrint.map(cfg => `
            <div class="page-break-container">
              ${generateSingleCopyHtml(cfg)}
            </div>
          `).join('')}
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Federal Model 19 — Goods Receiving Note (የዕቃ መረከቢያ ሰነድ ሞዴል 19)"
      width="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Statutory 4-Copy Selection Tab Bar */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-xl">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1E293B]">Select Official Copy (የሰነዱ ቅጂ):</span>
              <span className="text-[11px] text-[#64748B]">
                Defaulted to your role (<strong className="text-[#4F46E5]">{userRoles.join(', ') || 'User'}</strong>)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrint('CURRENT')}
                className="text-xs flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                Print Selected Copy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handlePrint('ALL')}
                className="text-xs flex items-center gap-1.5 shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10M6 14h10"/></svg>
                Print Full 4-Copy Set (የተሟላ 4 ቅጂዎች)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MODEL_19_COPIES.map(copy => {
              const isSelected = activeCopyId === copy.id
              const isDefault = defaultCopyId === copy.id
              return (
                <button
                  key={copy.id}
                  onClick={() => setActiveCopyId(copy.id)}
                  type="button"
                  className={`p-2.5 rounded-lg text-left transition-all border flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 shadow-sm border-transparent'
                      : 'hover:bg-white hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: isSelected ? copy.paperBg : '#ffffff',
                    borderColor: isSelected ? copy.paperBorder : '#E2E8F0',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs" style={{ color: copy.accentColor }}>
                      {copy.amharicLabel}
                    </span>
                    {isDefault && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                        My Role
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-gray-900 leading-tight">
                    {copy.recipientAmharic}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                    {copy.colorName}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Vendor Self-Service Notice for Copy 4 */}
        {currentCopyConfig.id === 'COPY_4' && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
            <span className="text-xl leading-none">🟢</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-emerald-950">4ኛ ቅጂ — ለአቅራቢው የሚሰጥ (Vendor Delivery Receipt)</span>
                <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Vendor Self-Service Portal (Coming Soon / በቅርቡ የሚጀመር)
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                በፌዴራል የንብረት አስተዳደር መመሪያ ቁጥር 1095/2010 መሠረት ይህ ቅጂ ለዕቃ አቅራቢው በወረቀት ታትሞ ወይም በዲጂታል ፒዲኤፍ (PDF) የሚሰጥ ነው። በቀጣይ ምዕራፍ አቅራቢዎች በራሳቸው መለያ ገብተው የዕቃዎቻቸውን የፍተሻ ሁኔታ የሚከታተሉበትና ሞዴል 19 ቅጂ 4ን የሚያወርዱበት የተለየ ፖርታል (Vendor Portal) ይካተታል።
                <br />
                <span className="text-[10.5px] italic text-emerald-700">
                  (Directive No. 1095/2017 specifies this copy is handed to the vendor as official handover confirmation. A dedicated external Supplier Self-Service Portal login will be integrated in Phase 2).
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Render Active Color-Coded Model 19 Form */}
        <div
          ref={printRef}
          className="border-2 p-5 text-black font-serif shadow-sm transition-colors duration-200"
          style={{
            backgroundColor: currentCopyConfig.paperBg,
            borderColor: currentCopyConfig.paperBorder,
          }}
        >
          {/* Header Row */}
          <div
            className="flex items-start justify-between border-b-2 pb-3 mb-2"
            style={{ borderColor: currentCopyConfig.paperBorder }}
          >
            <div
              className="w-16 h-16 rounded-full border-2 flex items-center justify-center font-bold text-sm tracking-wider shrink-0"
              style={{ borderColor: currentCopyConfig.paperBorder, color: currentCopyConfig.paperBorder }}
            >
              ASTU
            </div>
            <div className="text-center flex-1 px-3">
              <p className="font-bold text-xs uppercase tracking-wide">የኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ የገንዘብ ሚኒስቴር</p>
              <p className="font-bold text-[10px] uppercase text-gray-800">Federal Democratic Republic of Ethiopia — Ministry of Finance</p>
              <p className="font-semibold text-[10px] text-gray-700">የመንግሥት ግዥና ንብረት ባለሥልጣን / Public Procurement & Property Authority</p>
              <p className="font-bold text-xs uppercase mt-1 text-black">የአዳማ ሳይንስና ቴክኖሎጂ ዩኒቨርሲቲ / Adama Science & Technology University</p>
            </div>
            <div
              className="border-2 p-2 text-center bg-white/90 shrink-0 min-w-[155px]"
              style={{ borderColor: currentCopyConfig.paperBorder }}
            >
              <p className="font-bold text-xs border-b pb-1 mb-1" style={{ borderColor: currentCopyConfig.paperBorder }}>
                {isApprovedOrPosted ? 'ሞዴል 19 / MODEL 19' : 'ጊዜያዊ መቀበያ / PROVISIONAL'}
              </p>
              <p className="text-[11px] font-mono font-bold">ቁጥር: {grnRef}</p>
              <p className="text-[10px] text-gray-700">ቀን: {formattedDate}</p>
            </div>
          </div>

          {/* Statutory Copy Ribbon */}
          <div
            className="p-1.5 px-3 mb-2 text-xs font-bold flex justify-between items-center border"
            style={{
              backgroundColor: 'rgba(255,255,255,0.75)',
              borderColor: currentCopyConfig.paperBorder,
              color: currentCopyConfig.accentColor,
            }}
          >
            <div>
              <span className="font-extrabold">{currentCopyConfig.amharicLabel}</span>: {currentCopyConfig.recipientAmharic}
            </div>
            <div className="text-[10.5px] uppercase">
              {currentCopyConfig.englishLabel} — {currentCopyConfig.recipientEnglish}
            </div>
          </div>

          {!isApprovedOrPosted && (
            <div className="bg-amber-50 border-2 border-dashed border-amber-600 p-2 text-center mb-2">
              <p className="text-xs font-bold text-amber-900">« ቴክኒካል ምርመራ ያልተደረገለት ጊዜያዊ የዕቃ መቀበያ ሰነድ — በሞዴል 19 አልፀደቀም »</p>
              <p className="text-[10px] text-amber-700 italic">PROVISIONAL RECEIPT ONLY — PENDING TEC INSPECTION & PAO AUTHORIZATION (NOT POSTED TO INVENTORY)</p>
            </div>
          )}

          {/* Title Banner */}
          <div
            className="text-center border-y-2 py-1 mb-2.5 bg-black/5"
            style={{ borderColor: currentCopyConfig.paperBorder }}
          >
            <h2 className="font-bold text-base tracking-wide">
              {isApprovedOrPosted ? 'የዕቃ መረከቢያ ሰነድ' : 'ጊዜያዊ የዕቃ መቀበያ ሰነድ'}
            </h2>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
              {isApprovedOrPosted ? 'GOODS RECEIVING NOTE (GRN) — MODEL 19' : 'PROVISIONAL INWARD GOODS RECEIPT (RCV)'}
            </p>
          </div>

          {/* Metadata Boxed Grid */}
          <table className="w-full border-collapse border mb-2 text-xs" style={{ borderColor: currentCopyConfig.paperBorder }}>
            <tbody>
              <tr>
                <td className="border p-2 w-1/2 align-top" style={{ borderColor: currentCopyConfig.paperBorder }}>
                  <span className="font-bold">የአቅራቢው ስም እና አድራሻ / Supplier Name & Address:</span>
                  <p className="font-bold text-sm mt-0.5">{receipt.supplier?.name || 'N/A'}</p>
                  {receipt.supplier?.code && (
                    <p className="text-[11px] text-gray-700 font-mono">የአቅራቢ መለያ ኮድ: <strong>{receipt.supplier.code}</strong></p>
                  )}
                  {receipt.supplier?.phone && (
                    <p className="text-[11px] text-gray-700">ስልክ ቁጥር: {receipt.supplier.phone}</p>
                  )}
                </td>
                <td className="border p-2 w-1/2 align-top" style={{ borderColor: currentCopyConfig.paperBorder }}>
                  <span className="font-bold">የመጋዘን ስም / Warehouse / Storehouse:</span>
                  <p className="font-bold text-sm mt-0.5">{receipt.store?.name || 'Central Storehouse'}</p>
                  {receipt.store?.code && (
                    <p className="text-[11px] text-gray-700 font-mono">የመጋዘን ኮድ: <strong>{receipt.store.code}</strong></p>
                  )}
                  <p className="text-[10px] text-gray-700 mt-1">
                    የተረከበበት ሁኔታ: <strong>{isApprovedOrPosted ? 'ተረጋግጦ ወደ ስቶክ የገባ (Posted to Stock Card)' : 'ምርመራ በመጠባበቅ ላይ (Pending TEC Inspection)'}</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td className="border p-2" style={{ borderColor: currentCopyConfig.paperBorder }}>
                  <span className="font-bold">የትዕዛዝ / ውል ቁጥር / PO or Contract Reference:</span>
                  <p className="font-mono font-bold mt-0.5">{receipt.purchaseOrderNumber || 'N/A'}</p>
                </td>
                <td className="border p-2" style={{ borderColor: currentCopyConfig.paperBorder }}>
                  <span className="font-bold">የዚህ ቅጂ ሕጋዊ ተግባር / Mandate:</span>
                  <p className="text-[10.5px] mt-0.5 font-semibold" style={{ color: currentCopyConfig.accentColor }}>
                    {currentCopyConfig.mandateDescription}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Line Items Table */}
          <table className="w-full border-collapse border mb-2 text-xs" style={{ borderColor: currentCopyConfig.paperBorder }}>
            <thead>
              <tr className="bg-black/5">
                <th className="border p-1.5 text-center w-10" style={{ borderColor: currentCopyConfig.paperBorder }}>ተ.ቁ<br/><span className="text-[9px] font-normal">No</span></th>
                <th className="border p-1.5 text-center w-24" style={{ borderColor: currentCopyConfig.paperBorder }}>የዕቃ መለያ ኮድ<br/><span className="text-[9px] font-normal">Stock No</span></th>
                <th className="border p-1.5 text-left" style={{ borderColor: currentCopyConfig.paperBorder }}>የዕቃው ዓይነትና ዝርዝር መግለጫ<br/><span className="text-[9px] font-normal">Description of Articles / Specifications</span></th>
                <th className="border p-1.5 text-center w-16" style={{ borderColor: currentCopyConfig.paperBorder }}>መለኪያ<br/><span className="text-[9px] font-normal">Unit</span></th>
                <th className="border p-1.5 text-center w-16" style={{ borderColor: currentCopyConfig.paperBorder }}>ብዛት<br/><span className="text-[9px] font-normal">Quantity</span></th>
                <th className="border p-1.5 text-right w-20" style={{ borderColor: currentCopyConfig.paperBorder }}>የአንዱ ዋጋ<br/><span className="text-[9px] font-normal">Unit Price</span></th>
                <th className="border p-1.5 text-right w-24" style={{ borderColor: currentCopyConfig.paperBorder }}>ጠቅላላ ዋጋ<br/><span className="text-[9px] font-normal">Total Price</span></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const qty = Number(line.quantity ?? line.receivedQty ?? 0)
                const cost = Number(line.unitCost ?? 0)
                const lineTotal = qty * cost
                return (
                  <tr key={line.id || idx}>
                    <td className="border p-1.5 text-center" style={{ borderColor: currentCopyConfig.paperBorder }}>{idx + 1}</td>
                    <td className="border p-1.5 text-center font-mono text-[11px]" style={{ borderColor: currentCopyConfig.paperBorder }}>{line.item?.code || 'N/A'}</td>
                    <td className="border p-1.5" style={{ borderColor: currentCopyConfig.paperBorder }}>
                      <p className="font-bold">{line.item?.name || 'Item'}</p>
                    </td>
                    <td className="border p-1.5 text-center" style={{ borderColor: currentCopyConfig.paperBorder }}>{line.unit?.symbol || line.unit?.name || 'Pcs'}</td>
                    <td className="border p-1.5 text-center font-bold" style={{ borderColor: currentCopyConfig.paperBorder }}>{qty}</td>
                    <td className="border p-1.5 text-right font-mono" style={{ borderColor: currentCopyConfig.paperBorder }}>{cost.toFixed(2)}</td>
                    <td className="border p-1.5 text-right font-mono font-bold" style={{ borderColor: currentCopyConfig.paperBorder }}>{lineTotal.toFixed(2)}</td>
                  </tr>
                )
              })}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={7} className="border p-4 text-center text-gray-500" style={{ borderColor: currentCopyConfig.paperBorder }}>
                    ምንም የተመዘገበ ዕቃ የለም / No items recorded
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-black/5 border-t-2 font-bold" style={{ borderColor: currentCopyConfig.paperBorder }}>
                <td colSpan={6} className="border p-1.5 text-right uppercase" style={{ borderColor: currentCopyConfig.paperBorder }}>
                  አጠቃላይ ድምር ዋጋ በብር / Grand Total (ETB):
                </td>
                <td className="border p-1.5 text-right font-mono text-sm" style={{ borderColor: currentCopyConfig.paperBorder }}>
                  {totalValue.toFixed(2)} ETB
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Amount in Words */}
          <div className="border p-2 mb-2 text-xs bg-white/80" style={{ borderColor: currentCopyConfig.paperBorder }}>
            <span className="font-bold">ጠቅላላ ድምር በፊደል / Total Amount in Words:</span>
            <span className="italic underline ml-2 font-medium">{amountInWords}</span>
          </div>

          {/* Official 3-Way Bordered Signatures Matrix */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            {/* Box 1: Storekeeper */}
            <div
              className="border p-2 flex flex-col justify-between min-h-[135px]"
              style={{
                borderColor: currentCopyConfig.paperBorder,
                backgroundColor: currentCopyConfig.id === 'COPY_2' ? '#fef08a' : 'rgba(255,255,255,0.9)',
              }}
            >
              <div>
                <p className="font-bold text-center border-b pb-1 mb-1.5 text-[11px]" style={{ borderColor: currentCopyConfig.paperBorder }}>
                  1. የተረከበው የመጋዘን ኃላፊ<br/>
                  <span className="text-[10px] font-normal text-gray-700">Received by Storekeeper</span>
                </p>
                <p className="text-[11px] mb-0.5"><strong>ስም:</strong> {receipt.receivedByUser?.fullName || 'Storekeeper'}</p>
                <p className="text-[11px] mb-0.5"><strong>ፊርማ:</strong> __________________</p>
                <p className="text-[11px]"><strong>ቀን:</strong> {formattedDate}</p>
              </div>
              <div
                className="border border-dashed h-9 flex items-center justify-center text-[10px] text-gray-600 uppercase mt-1.5"
                style={{ borderColor: currentCopyConfig.stampBorder }}
              >
                የመጋዘን ማህተም / Stamp
              </div>
            </div>

            {/* Box 2: TEC Committee */}
            <div
              className="border p-2 flex flex-col justify-between min-h-[135px] bg-white/90"
              style={{ borderColor: currentCopyConfig.paperBorder }}
            >
              <div>
                <p className="font-bold text-center border-b pb-1 mb-1.5 text-[11px]" style={{ borderColor: currentCopyConfig.paperBorder }}>
                  2. የቴክኒክ ምርመራ ኮሚቴ<br/>
                  <span className="text-[10px] font-normal text-gray-700">Technical Evaluation Committee</span>
                </p>
                <p className="text-[11px] mb-0.5"><strong>አባል / መሪ:</strong> {tecEvaluatorName}</p>
                <p className="text-[11px] mb-0.5"><strong>ውሳኔ:</strong> {isApprovedOrPosted ? '✅ ተረጋግጧል (Certified)' : 'በመገምገም ላይ'}</p>
                <p className="text-[11px] mb-0.5"><strong>ፊርማ:</strong> __________________</p>
                <p className="text-[11px]"><strong>ቀን:</strong> {formattedDate}</p>
              </div>
              <div
                className="border border-dashed h-9 flex items-center justify-center text-[10px] text-gray-600 uppercase mt-1.5"
                style={{ borderColor: currentCopyConfig.stampBorder }}
              >
                የቴክኒክ ማረጋገጫ / TEC Seal
              </div>
            </div>

            {/* Box 3: PAO */}
            <div
              className="border p-2 flex flex-col justify-between min-h-[135px]"
              style={{
                borderColor: currentCopyConfig.paperBorder,
                backgroundColor: currentCopyConfig.id === 'COPY_3' ? '#bfdbfe' : 'rgba(255,255,255,0.9)',
              }}
            >
              <div>
                <p className="font-bold text-center border-b pb-1 mb-1.5 text-[11px]" style={{ borderColor: currentCopyConfig.paperBorder }}>
                  3. ያጸደቀው የንብረት ኃላፊ<br/>
                  <span className="text-[10px] font-normal text-gray-700">Approved by Property Admin (PAO)</span>
                </p>
                <p className="text-[11px] mb-0.5"><strong>ስም:</strong> {receipt.finalizedByUser?.fullName || 'Property Admin Officer'}</p>
                <p className="text-[11px] mb-0.5"><strong>ውሳኔ:</strong> {isApprovedOrPosted ? 'ተፈቅዷል (Approved)' : 'ይረጋገጥ'}</p>
                <p className="text-[11px] mb-0.5"><strong>ፊርማ:</strong> __________________</p>
                <p className="text-[11px]"><strong>ቀን:</strong> {formattedDate}</p>
              </div>
              <div
                className="border border-dashed h-9 flex items-center justify-center text-[10px] text-gray-600 uppercase mt-1.5"
                style={{ borderColor: currentCopyConfig.stampBorder }}
              >
                የንብረት አስተዳደር ማህተም / Seal
              </div>
            </div>
          </div>

          {/* Legal Footnote */}
          <div
            className="text-center text-[9.5px] text-gray-700 mt-2.5 pt-1.5 border-t border-dotted"
            style={{ borderColor: currentCopyConfig.paperBorder }}
          >
            ይህ የዕቃ መረከቢያ ሰነድ ሞዴል 19 በኢ.ፌ.ዴ.ሪ የገንዘብ ሚኒስቴር የመንግሥት ንብረት አስተዳደር መመሪያ ቁጥር 1095/2010 መሠረት የተዘጋጀ ሕጋዊ ሰነድ ነው::
            <br/>Prepared pursuant to Federal Government Property Administration Directive No. 1095/2017.
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePrint('CURRENT')}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <path d="M6 14h12v8H6z" />
              </svg>
              Print {currentCopyConfig.amharicLabel} ({currentCopyConfig.colorName})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrint('ALL')}
              className="flex items-center gap-1.5"
            >
              Print All 4 Copies (የተሟላ 4 ቅጂዎች አትም)
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
