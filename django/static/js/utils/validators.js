export function usernameOk(username) {
    return username !== '' && /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function emailOk(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function pwOk(pw) {
    return pw.length >= 8
        && /[A-Z]/.test(pw)
        && /[a-z]/.test(pw)
        && /[^a-zA-Z0-9]/.test(pw);
}