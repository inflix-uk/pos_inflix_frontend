export interface Tax {
 _id?: string;
 name: string;
 rate: number;
 type: "percentage" | "fixed";
 code: string;
 description: string;
 isCompound: boolean;
 isDefault: boolean;
 isActive: boolean;
 createdBy?: string;
 updatedBy?: string;
 createdAt?: string;
 updatedAt?: string;
}

export interface TaxFormData {
 name: string;
 rate: string;
 type: "percentage" | "fixed";
 code: string;
 description: string;
 isCompound: boolean;
 isDefault: boolean;
 isActive: boolean;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

export interface TaxFormProps {
 formData: TaxFormData;
 isEditing: boolean;
 isSaving: boolean;
 onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
 onCheckboxChange: (name: string, checked: boolean) => void;
 onSubmit: (e: React.FormEvent) => void;
 onCancel: () => void;
}

export interface TaxListProps {
 taxes: Tax[];
 onEdit: (tax: Tax) => void;
 onDelete: (tax: Tax) => void;
 onSetDefault: (tax: Tax) => void;
}

export interface DeleteConfirmModalProps {
 isOpen: boolean;
 tax: Tax | null;
 onClose: () => void;
 onConfirm: () => void;
 isLoading?: boolean;
}
