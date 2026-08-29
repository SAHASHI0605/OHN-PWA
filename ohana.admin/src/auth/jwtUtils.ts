export type JwtPayload = {
    sub?: string;
    name?: string;
    role?: string;
    exp?: number;
    [key: string]: unknown;
};

function decodeBase64Url(
    value: string,
): string {
    const base64 = value
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const padded = base64.padEnd(
        Math.ceil(base64.length / 4) * 4,
        '=',
    );

    return decodeURIComponent(
        Array.prototype.map
            .call(
                atob(padded),
                (char: string) =>
                    '%' +
                    (
                        '00' +
                        char
                            .charCodeAt(0)
                            .toString(16)
                    ).slice(-2),
            )
            .join(''),
    );
}

export function parseJwt(
    token: string,
): JwtPayload | null {
    try {
        const parts = token.split('.');

        if (parts.length !== 3) {
            return null;
        }

        const payload =
            decodeBase64Url(parts[1]);

        return JSON.parse(
            payload,
        ) as JwtPayload;
    }
    catch {
        return null;
    }
}

export function isTokenExpired(
    token: string,
): boolean {
    const payload = parseJwt(token);

    if (!payload?.exp) {
        return true;
    }

    return Date.now() >=
        payload.exp * 1000;
}

export function getTokenExpirationTime(
    token: string,
): number | null {
    const payload = parseJwt(token);

    if (!payload?.exp) {
        return null;
    }

    return payload.exp * 1000;
}

const ROLE_CLAIM =
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

const NAME_CLAIM =
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

const NAME_IDENTIFIER_CLAIM =
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

export function getRoleFromToken(
    token: string,
): string {
    const payload = parseJwt(token);

    if (!payload) {
        return '';
    }

    const role =
        payload.role ??
        payload[ROLE_CLAIM];

    return String(
        role ?? '',
    );
}

export function getNameFromToken(
    token: string,
): string {
    const payload =
        parseJwt(token);

    if (!payload) {
        return '';
    }

    const name =
        payload.name ??
        payload[NAME_CLAIM];

    return String(
        name ?? '',
    );
}

export function getEmployeeNumberFromToken(
    token: string,
): string {
    const payload =
        parseJwt(token);

    if (!payload) {
        return '';
    }

    const employeeNumber =
        payload.sub ??
        payload[NAME_IDENTIFIER_CLAIM];

    return String(
        employeeNumber ?? '',
    );
}
