
export const getApiUrl = (path: string = '') => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!baseUrl) throw new Error ("Api base url is not defined");

    const cleanPath = path.replace(/^\//, '');
    return `${baseUrl.replace(/\/$/, '')}/${cleanPath}`
}