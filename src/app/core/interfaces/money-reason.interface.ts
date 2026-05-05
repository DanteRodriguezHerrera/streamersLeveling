import { HttpStatusCode } from "@angular/common/http";

export interface MoneyReason {
    money_reason_id: string;
    reason: number;
    quantity: number;
    description: string;
}

export interface MoneyReasonResponse {
    message: string;
    data: MoneyReason;
    status: HttpStatusCode;
}

export interface MoneyReasonsResponse {
    message: string;
    data: MoneyReason[];
    status: HttpStatusCode;
}

export interface MoneyReasonDTO {
    quantity?: number;
    description?: string;
}