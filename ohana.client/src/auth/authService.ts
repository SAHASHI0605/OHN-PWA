export type LoginRequest = {
    userId: string;
    password: string;
};

export type LoginResponse = {
    token: string;
};

export const loginAsync = async (
    request: LoginRequest
): Promise<LoginResponse> => {
    if (request.userId === 'test' && request.password === 'password') {
        return {
            token: 'dummy-jwt-token',
        };
    }

    throw new Error('ユーザーIDまたはパスワードが違います。');
};
