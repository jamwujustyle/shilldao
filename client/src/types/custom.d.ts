declare module 'js-cookie' {
    interface CookieAttributes {
        expires?: number | Date;
        path?: string;
        domain?: string;
        secure?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
    }

    interface Cookies {
        get(name: string): string | undefined;
        set(name: string, value: string, attributes?: CookieAttributes): string | undefined;
        remove(name: string, attributes?: CookieAttributes): void;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        getJSON(name: string): any; // Keep any for getJSON as return type can vary
        /* eslint-enable @typescript-eslint/no-explicit-any */
    }

    const Cookies: Cookies;
    export default Cookies;
}
