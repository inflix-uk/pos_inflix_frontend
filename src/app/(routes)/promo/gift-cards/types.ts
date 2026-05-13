export interface GiftCard {
 id: string;
 giftCard: string;
 customer: {
  name: string;
  avatar: string;
  color: string;
 };
 issuedDate: string;
 expiryDate: string;
 amount: number;
 balance: number;
 status: "Active" | "Redeemed" | "Expired";
}

export interface Message {
 type: "success" | "error";
 text: string;
}
