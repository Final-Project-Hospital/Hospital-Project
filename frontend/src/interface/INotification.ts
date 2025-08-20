export interface NotificationInterface {
  ID: number;
  Name: string;
  UserID: string;
  Alert: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}