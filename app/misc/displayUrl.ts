export type ValidateDisplayUrlResult = {
    valid: boolean;
    message?: string;
    suggestion?: string;
    url?: URL;
};

export function validateDisplayUrl(value: string) {
    if (value.startsWith(":")) {
        value = `http://${window.location.hostname}${value}`;
    } else if (!(value.includes(":") || value.includes(".")) && value.charAt(0) >= '0' && value.charAt(0) <= '9') {
        return {
            valid: false,
            message: "Did you forget the colon prefix?",
            suggestion: `:${value}`,
        };
    } else if (!value.includes("://")) {
        return {
            valid: false,
            message: "HTTP or HTTPS?",
            suggestion: `https://${value}`,
        };
    }
    let url: URL;
    try {
        url = new URL(value);
    } catch (error) {
        return {
            valid: false,
            message: "Please enter a valid URL.",
        };
    }
    if (url.hostname == window.location.hostname && url.port == window.location.port) {
        return {
            valid: false,
            message: "That would probably kill your browser. Enter the port of a different app!",
        };
    }
    return {
        valid: true,
        url
    };
}
