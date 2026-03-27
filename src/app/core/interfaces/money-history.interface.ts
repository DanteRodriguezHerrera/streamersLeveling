export interface IMoneyHistory {
    id_money_history: string;
    quantity: number;
    reason: string;
    date_money_history: Date;
    user_id: string;
}

export interface MoneyHistoryDTO {
    quantity: number;
    reason: string;
    user_id: string;
}