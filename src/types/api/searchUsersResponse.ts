export interface SearchUsersResponse {
    next_offset: number | null;
    users: UserType[];
}

export interface UserType {
    user_id: number;
    username: string;
}