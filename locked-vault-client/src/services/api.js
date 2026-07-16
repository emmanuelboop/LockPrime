import axios from "axios";
import { clearAuth, getToken } from "@/utils/authStorage";

const api = axios.create({
    baseURL: "http://localhost:5000",
});

let isHandlingUnauthorized = false;

const isAuthRequest = (url = "") =>
    url.includes("/api/auth/login") || url.includes("/api/auth/register");

api.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url ?? "";

        if (
            status === 401 &&
            !isAuthRequest(requestUrl) &&
            !isHandlingUnauthorized
        ) {
            isHandlingUnauthorized = true;
            clearAuth();
            window.location.assign("/login?reason=session-expired");
        }

        return Promise.reject(error);
    }
);

export default api;
