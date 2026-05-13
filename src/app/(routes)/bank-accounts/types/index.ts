export interface BankAccount {
 _id?: string;
 accountName: string;
 bankName: string;
 accountNumber: string;
 sortCode: string;
 iban: string;
 swiftBic: string;
 branchAddress: string;
 isDefault: boolean;
 isActive: boolean;
 createdBy?: string;
 updatedBy?: string;
 createdAt?: string;
 updatedAt?: string;
}

export interface BankAccountFormData {
 accountName: string;
 bankName: string;
 accountNumber: string;
 sortCode: string;
 iban: string;
 swiftBic: string;
 branchAddress: string;
 isDefault: boolean;
 isActive: boolean;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

export interface BankAccountFormProps {
 formData: BankAccountFormData;
 isEditing: boolean;
 isSaving: boolean;
 onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
 onCheckboxChange: (name: string, checked: boolean) => void;
 onSubmit: (e: React.FormEvent) => void;
 onCancel: () => void;
}

export interface BankAccountListProps {
 accounts: BankAccount[];
 onEdit: (account: BankAccount) => void;
 onDelete: (account: BankAccount) => void;
 onSetDefault: (account: BankAccount) => void;
}

export interface DeleteConfirmModalProps {
 isOpen: boolean;
 account: BankAccount | null;
 onClose: () => void;
 onConfirm: () => void;
 isLoading?: boolean;
}
