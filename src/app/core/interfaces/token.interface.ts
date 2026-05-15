export interface TokenPayload {
  role: string;
  group: string | null;
  name: string;
  iat: number;
}