export interface User {
    user_id: string;
    twitch_id: string;
    role_id: string;
    group_id: string;
    access_token: string;
    expires_in: string;
    refresh_token: string;
}

export interface UserDTO {
    twitch_id: string;
    role_id: string;
    group_id: string;
    access_token: string;
    expires_in: string;
    refresh_token: string;
}

export interface UserResponse {
    status: number;
    message: string;
    data: User;
}