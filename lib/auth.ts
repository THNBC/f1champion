export function isAuthenticated() {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("f1-auth") === "true";
}

export function login(password: string) {
    if (password === "admin") {
        localStorage.setItem("f1-auth", "true");
        return true;
    }
    return false;
}

export function logout() {
    localStorage.removeItem("f1-auth");
}