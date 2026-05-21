const LOCAL_DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const parseTrustedOrigins = (value: string | undefined) =>
    (value ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

export const trustedOrigins = parseTrustedOrigins(process.env.TRUSTED_ORIGINS);

export const isLocalDevelopmentOrigin = (origin: string) =>
    LOCAL_DEV_ORIGIN_PATTERN.test(origin);

export const isAllowedOrigin = (origin: string | undefined) => {
    if (!origin) {
        return true;
    }

    if (trustedOrigins.includes(origin)) {
        return true;
    }

    return process.env.NODE_ENV !== 'production'
        && isLocalDevelopmentOrigin(origin);
};

export const getAuthTrustedOrigins = (request?: Request) => {
    const origins = [...trustedOrigins];
    const requestOrigin = request?.headers.get('origin');

    if (
        requestOrigin
        && process.env.NODE_ENV !== 'production'
        && isLocalDevelopmentOrigin(requestOrigin)
        && !origins.includes(requestOrigin)
    ) {
        origins.push(requestOrigin);
    }

    return origins;
};
