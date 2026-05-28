export interface AboutSettings {
 _id?: string;
 appTitle: string;
 appName: string;
 logo: string | null;
 loginPageTitle: string;
 companyAddress: string;
 companyNumber: string;
 vatNumber: string;
 orderPdfTitle: string;
 invoicePdfTitle: string;
 createdBy?: string;
 updatedBy?: string;
 createdAt?: string;
 updatedAt?: string;
}

export interface AboutFormData {
 appTitle: string;
 appName: string;
 logo: File | null;
 logoPreview: string | null;
 loginPageTitle: string;
 companyAddress: string;
 companyNumber: string;
 vatNumber: string;
 orderPdfTitle: string;
 invoicePdfTitle: string;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

export interface AboutSettingsFormProps {
 formData: AboutFormData;
 isLoading: boolean;
 isSaving: boolean;
 hasExistingData: boolean;
 onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
 onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
 onRemoveLogo: () => void;
 onSubmit: (e: React.FormEvent) => void;
 onReset: () => void;
 onDelete: () => void;
}

export interface DeleteConfirmModalProps {
 isOpen: boolean;
 onClose: () => void;
 onConfirm: () => void;
 isLoading?: boolean;
}

export interface MessageAlertProps {
 message: Message;
}
