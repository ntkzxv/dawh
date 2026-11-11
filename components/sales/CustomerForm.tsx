"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { salesApi, type Customer } from "@/lib/api/sales";
import { message } from "@/components/warehouse/Ui";
import { SidePanelFieldError, sidePanelInvalidFieldClassName } from "@/components/common/SidePanel";
import { SalesField, useFormStyles } from "@/components/sales/SalesUi";
import { useNotification } from "@/context/NotificationContext";
import { useAppLanguage } from "@/utils/language";

export default function CustomerForm({
  customer,
  onSaved,
  onCancel,
}: {
  customer?: Customer;
  onSaved: (customer: Customer) => void;
  onCancel: () => void;
}) {
  const isThai = useAppLanguage() === "TH";
  const { notify } = useNotification();
  const [fullName, setFullName] = useState(customer?.full_name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [citizenId, setCitizenId] = useState(customer?.citizen_id ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [note, setNote] = useState(customer?.note ?? "");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    const invalid = [
      ...(fullName.trim() ? [] : ["fullName"]),
      ...(phone.trim() ? [] : ["phone"]),
      ...(citizenId && !/^\d{13}$/.test(citizenId) ? ["citizenId"] : []),
    ];
    setErrors(invalid);
    if (invalid.length) return;
    setSaving(true);
    try {
      const body = { fullName, phone, citizenId, address, note };
      const saved = customer
        ? await salesApi.updateCustomer(customer.id, body)
        : await salesApi.createCustomer(body);
      notify.success(isThai ? "บันทึกลูกค้าแล้ว" : "Customer saved");
      onSaved(saved);
    } catch (cause) {
      notify.error(isThai ? "บันทึกลูกค้าไม่สำเร็จ" : "Could not save customer", { message: message(cause, isThai) });
    } finally {
      setSaving(false);
    }
  }

  const f = useFormStyles();
  const cls = (key: string) => `${f.input} ${errors.includes(key) ? sidePanelInvalidFieldClassName : ""}`;
  return (
    <form onSubmit={submit} noValidate className={f.form}>
      <div className={f.content}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SalesField label={isThai ? "ชื่อ-นามสกุล *" : "Full name *"}>
            <input className={cls("fullName")} value={fullName} maxLength={200} onChange={(e) => setFullName(e.target.value)} />
            {errors.includes("fullName") && <SidePanelFieldError>{isThai ? "กรุณากรอกชื่อ" : "Enter a name."}</SidePanelFieldError>}
          </SalesField>
          <SalesField label={isThai ? "เบอร์โทร *" : "Phone *"}>
            <input className={cls("phone")} value={phone} maxLength={30} inputMode="tel" onChange={(e) => setPhone(e.target.value)} />
            {errors.includes("phone") && <SidePanelFieldError>{isThai ? "กรุณากรอกเบอร์โทร" : "Enter a phone number."}</SidePanelFieldError>}
          </SalesField>
          <SalesField label={isThai ? "เลขบัตรประชาชน" : "Citizen ID"}>
            <input className={cls("citizenId")} value={citizenId} maxLength={13} inputMode="numeric" onChange={(e) => setCitizenId(e.target.value.replace(/\D/g, ""))} />
            {errors.includes("citizenId") && <SidePanelFieldError>{isThai ? "ต้องมี 13 หลัก" : "Use exactly 13 digits."}</SidePanelFieldError>}
          </SalesField>
          <SalesField label={isThai ? "ที่อยู่" : "Address"}>
            <input className={f.input} value={address} maxLength={1000} onChange={(e) => setAddress(e.target.value)} />
          </SalesField>
          <SalesField label={isThai ? "หมายเหตุ" : "Note"} className="sm:col-span-2">
            <input className={f.input} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
          </SalesField>
        </div>
      </div>
      <div className={f.footer}>
        <button type="button" className={f.cancel} onClick={onCancel} disabled={saving}>{isThai ? "ยกเลิก" : "Cancel"}</button>
        <button type="submit" className={`${f.submit} inline-flex items-center justify-center`} disabled={saving}>
          {saving && <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" />}
          {isThai ? "บันทึก" : "Save"}
        </button>
      </div>
    </form>
  );
}
