export interface TokenPayload {
  role: string;
  group: string | null;
  iat: number
}