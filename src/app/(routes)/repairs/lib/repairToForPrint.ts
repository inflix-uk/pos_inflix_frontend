import type { RepairForPrint } from "@/lib/invoicePrint";
import type { Repair } from "../types";

export function repairToForPrint(r: Repair): RepairForPrint {
 const firstDevice = r.devices?.[0];
 return {
  _id: r._id,
  reference: r.reference ?? "",
  customerName: r.customerName ?? "",
  locationId: r.locationId
   ? (typeof r.locationId === "object" ? r.locationId._id : r.locationId)
   : null,
  locationName: r.locationId && typeof r.locationId === "object" ? r.locationId.name : null,
  contactPhone: r.contactPhone,
  contactEmail: r.contactEmail,
  deviceDescription: firstDevice?.deviceDescription ?? r.deviceDescription ?? "",
  serialNumber: firstDevice?.serialNumber ?? r.serialNumber,
  problemType: firstDevice?.problemType ?? r.problemType,
  estimatedCost: firstDevice?.estimatedCost ?? r.estimatedCost ?? null,
  devices:
   r.devices?.length ?
    r.devices.map((d) => ({
     deviceDescription: d.deviceDescription,
     serialNumber: d.serialNumber,
     problemType: d.problemType,
     devicePassword: d.devicePassword,
    }))
   : undefined,
  receivedAt: r.receivedAt,
  status: r.status,
  devicePassword: firstDevice?.devicePassword ?? r.devicePassword,
  repairItems: r.repairItems,
  actualCost: r.actualCost ?? null,
  notes: r.notes,
 };
}
