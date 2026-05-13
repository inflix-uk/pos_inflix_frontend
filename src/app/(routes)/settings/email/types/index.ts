export interface EmailSettings {
 _id?: string;
 smtpHost: string;
 smtpPort: number;
 smtpSecure: "none" | "ssl" | "tls";
 smtpUsername: string;
 smtpPassword: string;
 fromEmail: string;
 fromName: string;
 replyToEmail: string;
 replyToName: string;
 enableEmailNotifications: boolean;
 createdBy?: string;
 updatedBy?: string;
 createdAt?: string;
 updatedAt?: string;
}

export interface EmailFormData {
 smtpHost: string;
 smtpPort: string;
 smtpSecure: "none" | "ssl" | "tls";
 smtpUsername: string;
 smtpPassword: string;
 fromEmail: string;
 fromName: string;
 replyToEmail: string;
 replyToName: string;
 enableEmailNotifications: boolean;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}

export interface EmailFormProps {
 formData: EmailFormData;
 isSaving: boolean;
 isTesting: boolean;
 hasExistingData: boolean;
 onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
 onCheckboxChange: (name: string, checked: boolean) => void;
 onSubmit: (e: React.FormEvent) => void;
 onReset: () => void;
 onDelete: () => void;
 onTest: () => void;
}

export interface DeleteConfirmModalProps {
 isOpen: boolean;
 onClose: () => void;
 onConfirm: () => void;
 isLoading?: boolean;
}

export interface TestEmailModalProps {
 isOpen: boolean;
 onClose: () => void;
 onTest: (email: string) => void;
 isTesting: boolean;
}
