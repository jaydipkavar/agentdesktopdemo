export const LOCAL_KEYS = {
    IS_LOGGED_IN: 'isLoggedIn',
    USER_ID_TOKEN : 'userIdToken',
    USER_ID: 'userId',
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
    USER_DETAIL: 'userDetail',
}

export const NAV_PATHS = {
    DASHBOARD: '/',
    LOGIN: '/login',
    DETAIL: '/detail/:id',
}

export type ILocalKeys = typeof LOCAL_KEYS;
export type INavPaths = typeof NAV_PATHS;