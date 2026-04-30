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
    jwt_token?: string;
}

export interface UsersResponse {
    status: number;
    message: string;
    data: User[];
}

export interface UserTwitchInfoResponse {
    data: UserTwitchInfo[]
}

export interface UserTwitchInfo {
    broadcaster_type: string,
    created_at: string,
    description: string,
    display_name: string,
    id: string,
    login: string,
    offline_image_url: string,
    profile_image_url: string,
    type: string,
    view_count: number,
}