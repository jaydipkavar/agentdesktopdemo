// axiosInstance.ts
import axios, { AxiosError } from "axios";
import { REFRESH_TOKEN_URL, LOGIN_URL } from "./constants";

const api = axios.create({
    baseURL: "http://141.148.221.8:8000",
});

let isRefreshing = false;
let failedQueue: {
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const redirectToLogin = () => {
    window.localStorage.clear();
    window.dispatchEvent(new CustomEvent("auth:logout"));

    window.location.href = "/login";
};

const isTokenValid = (token: string | null): boolean => {
    return !!token && token !== "undefined" && token !== "null" && token.trim();
};

// ========== REQUEST INTERCEPTOR ==========
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (isTokenValid(token)) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            redirectToLogin();
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// ========== RESPONSE INTERCEPTOR ==========
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as any & {
            _retry?: boolean;
            _noRefresh?: boolean;
        };

        // Handle network error
        if (!error.response) {
            console.error("Network error:", error.message);
            return Promise.reject(error);
        }

        const status = error.response.status;

        const shouldAttemptRefresh =
            (status === 401 || status === 422) &&
            !originalRequest._retry &&
            originalRequest.url !== REFRESH_TOKEN_URL &&
            originalRequest.url !== LOGIN_URL &&
            !originalRequest._noRefresh;

        if (!shouldAttemptRefresh) {
            if (status === 401 || status === 422) {
                console.warn("Unauthorized. Redirecting to login...");
                redirectToLogin();
            }
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    if (token && originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!isTokenValid(refreshToken)) {
                throw new Error("Missing or invalid refresh token");
            }

            const refreshResponse = await axios.post(
                REFRESH_TOKEN_URL,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${refreshToken}`,
                        "Content-Type": "application/json",
                    },
                    timeout: 5000,
                }
            );

            const newAccessToken = refreshResponse.data.access_token;
            if (!newAccessToken) {
                throw new Error("No access token in refresh response");
            }

            // Update tokens
            localStorage.setItem("accessToken", newAccessToken);
            localStorage.removeItem("refreshToken"); // optional: may keep if still valid

            api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }

            processQueue(null, newAccessToken);

            return api(originalRequest);
        } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            processQueue(refreshError, null);
            redirectToLogin();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
