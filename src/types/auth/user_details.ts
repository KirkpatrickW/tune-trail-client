export interface UserDetails {
    user_id: string;
    username: string | null;
    is_admin: boolean;
    is_oauth_account: boolean;
    spotify_subscription: 'free' | 'premium' | null;
}