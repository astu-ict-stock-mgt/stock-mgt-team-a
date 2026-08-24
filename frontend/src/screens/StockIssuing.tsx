import { useState } from "react";
import {
  Button,
  Input,
  Select,
  Stepper,
  SectionHeader,
  Card,
  Badge,
  Divider,
  Textarea,
  useToast,
} from "../components/ui";
import { useApp } from "../context/AppContext";

const steps = [
  "Request Details",
  "Item Selection",
  "Approval",
  "Issue Voucher",
];

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

interface IssueLine {
  id: string;
  itemName: string;
  sku: string;
  requestedQty: string;
  availableQty: number;
  unit: string;
}

export default function StockIssuing() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    department: "",
    requestedBy: "",
    purpose: "",
    urgency: "normal",
    warehouse: "",
  });
  const [lines, setLines] = useState<IssueLine[]>([
    {
      id: createId(),
      itemName: "Welding Electrodes 3.2mm",
      sku: "WE-E6013-3.2",
      requestedQty: "5",
      availableQty: 15,
      unit: "kg",
    },
  ]);
  const { addStockMovement } = useApp();
  const { toast } = useToast();

  const [approvalStatus, setApprovalStatus] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [approvalNote, setApprovalNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const issueRef =
    "ISV-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-002";

  const validateStep0 = () => {
    const e: Record<string, string> = {};

    if (!form.department) e.department = "Department is required";
    if (!form.requestedBy.trim()) e.requestedBy = "Requestor name is required";
    if (!form.purpose.trim()) e.purpose = "Purpose is required";
    if (!form.warehouse) e.warehouse = "Select a warehouse";

    return e;
  };

  const validateLines = () => {
    const e: Record<string, string> = {};

    if (lines.length === 0) {
      e.lines = "Add at least one item";
      return e;
    }

    lines.forEach((line, index) => {
      const quantity = Number(line.requestedQty);

      if (!line.itemName.trim()) {
        e[`line-${line.id}`] = `Item ${index + 1}: select an item`;
      }

      if (!line.requestedQty.trim()) {
        e[`qty-${line.id}`] = `Item ${index + 1}: quantity is required`;
      } else if (!Number.isFinite(quantity) || quantity <= 0) {
        e[`qty-${line.id}`] =
          `Item ${index + 1}: quantity must be greater than 0`;
      } else if (quantity > line.availableQty) {
        e[`qty-${line.id}`] =
          `Item ${index + 1}: quantity cannot exceed available stock`;
      }
    });

    return e;
  };

  const handleNext = () => {
    if (isSubmitting) return;
    let errs: Record<string, string> = {};

    if (step === 0) {
      errs = validateStep0();
    }

    if (step === 1) {
      errs = validateLines();
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});

    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      if (approvalStatus !== "approved") {
        toast.error("Stock cannot be issued without approval");
        return;
      }

      const finalErrors = {
        ...validateStep0(),
        ...validateLines(),
      };

      if (Object.keys(finalErrors).length > 0) {
        setErrors(finalErrors);
        toast.error("Please correct the errors before submitting");
        return;
      }

      setIsSubmitting(true);

      try {
        const transactionDate = new Date()
          .toISOString()
          .slice(0, 16)
          .replace("T", " ");

        lines.forEach((line) => {
          addStockMovement({
            id: `TXN-${createId()}`,
            date: transactionDate,
            type: "issued",
            item: line.itemName.trim(),
            itemId: line.sku,
            qty: Number(line.requestedQty),
            unit: line.unit,
            warehouse: form.warehouse,
            reference: issueRef,
            user: "James Okafor",
            dept: form.department.trim(),
          });
        });

        toast.success("Stock issued successfully");
        setSubmitted(true);
      } catch (error) {
        console.error("Failed to issue stock:", error);
        toast.error("Failed to issue stock. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }

    if (submitted) {
      return (
        <div>
          <SectionHeader
            title="Stock Issuing"
            subtitle="Process outgoing stock requests"
          />
          <div className="max-w-2xl mx-auto">
            <Card>
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="2.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#0F172A]">
                  Stock Issued Successfully
                </h2>
                <p className="text-sm text-[#64748B] mt-1">
                  Voucher:{" "}
                  <span className="font-mono font-semibold text-[#4F46E5]">
                    {issueRef}
                  </span>
                </p>
              </div>
              <Divider label="Issue Voucher" />
              <div className="border border-[#E2E8F0] rounded-xl p-5 print:fixed print:inset-0 print:bg-white print:z-[9999] print:border-none print:p-12 print:block">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-[#0F172A]">StockManager</p>
                    <p className="text-xs text-[#64748B]">
                      Stock Issue Voucher
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold font-mono text-[#4F46E5]">
                      {issueRef}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {new Date().toISOString().slice(0, 10)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-0.5">
                      Department
                    </p>
                    <p className="text-sm text-[#1E293B]">
                      {form.department || "Maintenance"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-0.5">
                      Requested by
                    </p>
                    <p className="text-sm text-[#1E293B]">
                      {form.requestedBy || "K. Adebayo"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-0.5">
                      Purpose
                    </p>
                    <p className="text-sm text-[#1E293B]">
                      {form.purpose || "Equipment maintenance"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-0.5">
                      Approved by
                    </p>
                    <p className="text-sm text-[#1E293B]">
                      Priya Sharma · Dept. Head
                    </p>
                  </div>
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      {["Item", "SKU", "Issued Qty", "Unit"].map((h) => (
                        <th
                          key={h}
                          className="py-2 px-2 text-left font-semibold text-[#64748B] uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.id} className="border-b border-[#F8FAFC]">
                        <td className="py-2 px-2 font-medium text-[#1E293B]">
                          {l.itemName}
                        </td>
                        <td className="py-2 px-2 font-mono text-[#64748B]">
                          {l.sku}
                        </td>
                        <td className="py-2 px-2 font-semibold text-[#4F46E5]">
                          {l.requestedQty}
                        </td>
                        <td className="py-2 px-2 text-[#64748B]">{l.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between text-xs text-[#94A3B8]">
                  <span>Issued by: James Okafor · Storekeeper</span>
                  <Badge variant="success">Issued</Badge>
                </div>
              </div>
              <div className="flex gap-2 mt-5 print:hidden">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  Print voucher
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    setSubmitted(false);
                    setStep(0);
                    setApprovalStatus("pending");
                  }}
                >
                  New request
                </Button>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div>
        <SectionHeader
          title="Stock Issuing"
          subtitle="Process outgoing stock requests with approval workflow"
        />
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Stepper steps={steps} current={step} />
          </div>
          <Card>
            {step === 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-[#0F172A] mb-4">
                  Request Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Requesting Department *"
                    options={[
                      { value: "", label: "Select department..." },
                      { value: "Maintenance", label: "Maintenance" },
                      { value: "Engineering", label: "Engineering" },
                      { value: "Production", label: "Production" },
                      { value: "Administration", label: "Administration" },
                    ]}
                    value={form.department}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, department: e.target.value }))
                    }
                    error={errors.department}
                  />
                  <Input
                    label="Requested by *"
                    placeholder="Full name"
                    value={form.requestedBy}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, requestedBy: e.target.value }))
                    }
                    error={errors.requestedBy}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Issuing Warehouse *"
                    options={[
                      { value: "", label: "Select..." },
                      { value: "Warehouse A", label: "Warehouse A" },
                      { value: "Warehouse B", label: "Warehouse B" },
                      { value: "Warehouse C", label: "Warehouse C" },
                    ]}
                    value={form.warehouse}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, warehouse: e.target.value }))
                    }
                    error={errors.warehouse}
                  />
                  <Select
                    label="Urgency"
                    options={[
                      { value: "normal", label: "Normal" },
                      { value: "urgent", label: "Urgent" },
                      { value: "critical", label: "Critical — equipment down" },
                    ]}
                    value={form.urgency}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, urgency: e.target.value }))
                    }
                  />
                </div>
                <Textarea
                  label="Purpose / Justification *"
                  placeholder="Describe why this stock is needed..."
                  value={form.purpose}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, purpose: e.target.value }))
                  }
                  error={errors.purpose}
                />
              </div>
            )}

            {step === 1 && (
              <div>
                <h3 className="text-base font-semibold text-[#0F172A] mb-4">
                  Select Items to Issue
                </h3>
                <div className="space-y-3">
                  {lines.map((line, idx) => (
                    <div
                      key={line.id}
                      className="p-4 border border-[#E2E8F0] rounded-xl"
                    >
                      <div className="grid grid-cols-5 gap-3 items-end">
                        <div className="col-span-2">
                          <Select
                            label="Item"
                            options={[
                              { value: "", label: "Select item..." },
                              {
                                value: "Welding Electrodes 3.2mm",
                                label: "Welding Electrodes 3.2mm",
                              },
                              {
                                value: "Bosch 18V Power Drill",
                                label: "Bosch 18V Power Drill",
                              },
                              {
                                value: "Industrial Safety Gloves (L)",
                                label: "Industrial Safety Gloves (L)",
                              },
                            ]}
                            value={line.itemName}
                            onChange={(e) =>
                              setLines((ls) =>
                                ls.map((l) =>
                                  l.id === line.id
                                    ? { ...l, itemName: e.target.value }
                                    : l,
                                ),
                              )
                            }
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#94A3B8] mb-1.5">
                            Available
                          </p>
                          <div className="h-9 flex items-center px-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                            <span className="text-sm font-mono text-[#16A34A]">
                              {line.availableQty} {line.unit}
                            </span>
                          </div>
                        </div>
                        <Input
                          label="Requested qty"
                          type="number"
                          min="0"
                          step="any"
                          value={line.requestedQty}
                          onChange={(e) =>
                            setLines((ls) =>
                              ls.map((l) =>
                                l.id === line.id
                                  ? { ...l, requestedQty: e.target.value }
                                  : l,
                              ),
                            )
                          }
                          error={errors[`qty-${line.id}`]}
                        />

                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setLines((ls) =>
                                ls.filter((l) => l.id !== line.id),
                              )
                            }
                            className="h-9 px-3 border border-[#E2E8F0] rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:border-[#FECACA] hover:bg-[#FEF2F2] transition-all text-sm"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLines((ls) => [
                      ...ls,
                      {
                        id: createId(),
                        itemName: "",
                        sku: "",
                        requestedQty: "",
                        availableQty: 0,
                        unit: "pcs",
                      },
                    ])
                  }
                  className="mt-3 w-full py-2.5 border-2 border-dashed border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:border-[#4F46E5] hover:text-[#4F46E5] transition-all"
                >
                  + Add item
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-base font-semibold text-[#0F172A] mb-1">
                  Approval Step
                </h3>
                <p className="text-sm text-[#64748B] mb-5">
                  This request requires authorization from the department head.
                </p>

                <div className="p-4 border border-[#E2E8F0] rounded-xl mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-sm font-semibold flex items-center justify-center">
                      PS
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        Priya Sharma
                      </p>
                      <p className="text-xs text-[#94A3B8]">
                        Department Head · Operations
                      </p>
                    </div>
                    <div className="ml-auto">
                      <Badge
                        variant={
                          approvalStatus === "approved"
                            ? "success"
                            : approvalStatus === "rejected"
                              ? "danger"
                              : "warning"
                        }
                        dot
                      >
                        {approvalStatus === "approved"
                          ? "Approved"
                          : approvalStatus === "rejected"
                            ? "Rejected"
                            : "Awaiting approval"}
                      </Badge>
                    </div>
                  </div>
                  {approvalStatus === "pending" && (
                    <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#92400E]">
                      Approval request sent. You will be notified when the
                      department head reviews this request.
                    </div>
                  )}
                </div>

                <Textarea
                  label="Approval note (optional)"
                  placeholder="Any remarks for this approval..."
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                />

                {/* Simulate approval for demo */}
                <div className="mt-4 p-3 bg-[#F1F5F9] rounded-xl">
                  <p className="text-xs font-medium text-[#64748B] mb-2">
                    Demo: Simulate approval decision
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setApprovalStatus("approved")}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] hover:bg-[#DCFCE7]"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setApprovalStatus("rejected")}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="text-base font-semibold text-[#0F172A] mb-4">
                  Review & Issue
                </h3>
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg mb-4 flex items-center gap-2 text-sm text-[#16A34A]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Approved by Priya Sharma · Department Head
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    ["Department", form.department || "Maintenance"],
                    ["Requested by", form.requestedBy || "K. Adebayo"],
                    ["Purpose", form.purpose || "Equipment maintenance"],
                    ["Warehouse", form.warehouse || "Warehouse B"],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-0.5">
                        {l}
                      </p>
                      <p className="text-sm text-[#1E293B]">{v}</p>
                    </div>
                  ))}
                </div>
                <Divider label="Items" />
                <div className="space-y-2">
                  {lines.map((l, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#1E293B]">
                          {l.itemName || "Welding Electrodes 3.2mm"}
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                          Available: {l.availableQty} {l.unit}
                        </p>
                      </div>
                      <span className="text-sm font-semibold font-mono text-[#4F46E5]">
                        {l.requestedQty} {l.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#E2E8F0]">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                ← Back
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={
                  isSubmitting || (step === 2 && approvalStatus !== "approved")
                }
              >
                {isSubmitting
                  ? "Issuing..."
                  : step === 3
                    ? "Confirm Issue"
                    : step === 2
                      ? approvalStatus === "approved"
                        ? "Continue →"
                        : "Awaiting approval..."
                      : "Continue →"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  };
}
