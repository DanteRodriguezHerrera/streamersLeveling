export interface User {
    user_id: string;
    twitch_id: string;
    role_id: string;
    group_id: string;
    access_token: string;
    expires_in: number;
    refresh_token: string;
    actual_money: number;
    channel_name: string;
}

export interface UserDTO {
    twitch_id: string;
    role_id: string;
    group_id: string;
    access_token: string;
    expires_in: number;
    refresh_token: string;
    actual_money: number;
    channel_name: string;
}

export interface UserResponse {
    status: number;
    message: string;
    data: User;
}

export interface UsersResponse {
    status: number;
    message: string;
    data: User[];
}