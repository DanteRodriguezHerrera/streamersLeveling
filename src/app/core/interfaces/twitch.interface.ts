export interface tokenParameters {
    client_id: string;
    client_secret: string;
    code: string;
    grant_type: string;
    redirect_uri: string;
}

export interface tokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: any[];
    token_type: string;
}

export interface validationTokenResponse {
    client_id: string;
    login: string;
    scopes: any[];
    user_id: string;
    expires_in: number;
}