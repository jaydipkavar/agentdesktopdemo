// export const BASE_URL = "https://api.agentact.com";
export const BASE_URL = "http://141.148.221.8:8000";
// export const BASE_URL = "http://0.0.0.0:8000";

export const LOGIN_URL = `${BASE_URL}/login`;
// export const SESSION_LIST_URL = `${BASE_URL}/get-all-session`;
export const REFRESH_TOKEN_URL = `${BASE_URL}/refresh`;
// export const SESSION_DETAIL_URL = (id: number) =>
//     `${BASE_URL}/get-session-by-id/${id}`;
// export const SESSSION_DELETE_URL = (id: number) =>
//     `${BASE_URL}/delete-session/${id}`;
// export const PROCESS_HTML_URL = `${BASE_URL}/process-html`;
// export const GENERATE_JSON_URL = `${BASE_URL}/generate-schema`;
// export const UPDATE_SESSION_URL = `${BASE_URL}/update-session`;

import api from "./axiosInstance";

export const getAllSessions = () => api.get("/get-all-session");

export const getSessionById = (id: number) =>
    api.get(`/get-session-by-id/${id}`);

export const deleteSession = (id: number) =>
    api.delete(`/delete-session/${id}`);

export const processHTML = (data: any) => api.post("/process-html", data);
export const processHTMLCatch = (data: any) =>
    api.post("/process-html-cache", data);

export const generateSchema = (data: any) => api.post("/generate-schema", data);

export const updateSession = (data: any) => api.post("/update-session", data);

export const sessionInspired = (data: any) =>
    api.post("/session-inspired-chat", data);
