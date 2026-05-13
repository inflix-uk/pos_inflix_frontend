export interface UserData {
 _id: string;
 name: string;
 email: string;
 role: string;
 phone?: string;
 createdAt?: string;
 lastLogin?: string;
}

export interface ProfileFormData {
 name: string;
 email: string;
 phone: string;
}

export interface PasswordFormData {
 currentPassword: string;
 newPassword: string;
 confirmPassword: string;
}

export interface Message {
 type: "success" | "error" | "";
 text: string;
}
