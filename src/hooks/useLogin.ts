import { toast } from "@/components/ui/sonner";
import { db } from "@/db";
import { LOGIN_URL } from "@/lib/constants";
import { firebaseAuth } from "@/lib/firebase/config";
import { LOCAL_KEYS, NAV_PATHS } from "@/lib/keys";
import { logoutCleanUp } from "@/lib/utils";
import type { Auth, User, UserCredential } from "firebase/auth";
import { useState } from "react";

interface ILoginResponse {
    ok: boolean;
    data?: any;
    error?: string;
}

const useLogin = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [navigateUrl, setNavigateUrl] = useState<string | null>(null);

    const handleSettingupDataInStorage = async (
        loginResponse: ILoginResponse,
        firebaseUser: User
    ) => {
        if (loginResponse.ok && loginResponse.data) {
            const { access_token, refresh_token, email } = loginResponse.data;
            const userIdToken =
                (await firebaseAuth.currentUser?.getIdToken()) || "";

            // Store userIdToken and userId in local storage
            window?.localStorage.setItem(LOCAL_KEYS.USER_ID_TOKEN, userIdToken);
            window?.localStorage.setItem(
                LOCAL_KEYS.USER_ID,
                firebaseUser?.uid || ""
            );
            window?.localStorage.setItem(LOCAL_KEYS.ACCESS_TOKEN, access_token);
            window?.localStorage.setItem(
                LOCAL_KEYS.REFRESH_TOKEN,
                refresh_token
            );
            window?.localStorage.setItem(
                LOCAL_KEYS.USER,
                JSON.stringify({
                    name: firebaseUser.displayName,
                    email: firebaseUser.email,
                    photoURL: firebaseUser.photoURL,
                })
            );
            window?.localStorage.setItem(LOCAL_KEYS.IS_LOGGED_IN, "true");

            if ("indexedDB" in window) {
                try {
                    await db.tokens.bulkPut([
                        { id: LOCAL_KEYS.USER_ID_TOKEN, value: userIdToken },
                        {
                            id: LOCAL_KEYS.ACCESS_TOKEN,
                            value: access_token,
                        },
                        {
                            id: LOCAL_KEYS.REFRESH_TOKEN,
                            value: refresh_token,
                        },
                    ]);

                    const userDetail = {
                        ...firebaseUser,
                        apiResponse: {
                            access_token: access_token,
                            refresh_token: refresh_token,
                            email: email,
                        },
                    };

                    await db.users.put({
                        id: LOCAL_KEYS.USER_DETAIL,
                        value: JSON.stringify(userDetail),
                    });

                    toast.success("Login Successfully", {
                        richColors: true,
                    });

                    // Redirect to the dashboard
                } catch (error) {
                    toast.error("Database error", {
                        richColors: true,
                    });
                }
            }

            setIsLoggedIn(true);
            setNavigateUrl(NAV_PATHS.DASHBOARD);
        } else {
            setIsLoggedIn(false);
            setNavigateUrl(NAV_PATHS.LOGIN);
            toast.error(loginResponse.error || "Login failed", {
                richColors: true,
            });
        }
    };

    const handleLoginApiCall = async (body: {
        idToken: string;
    }): Promise<ILoginResponse> => {
        const response: ILoginResponse = await window.api.fetch(LOGIN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        return response;
    };

    // Check if user is logged in
    const checkLoginStatus = async () => {
        // Fetch token from indexedDB or localStorage

        const isLoggin =
            window?.localStorage.getItem(LOCAL_KEYS.IS_LOGGED_IN) === "true";
        const userIdToken = window.localStorage.getItem(
            LOCAL_KEYS.USER_ID_TOKEN
        );
        let accessToken;
        if (typeof window !== "undefined" && "indexedDB" in window) {
            accessToken = db.tokens.get(LOCAL_KEYS.ACCESS_TOKEN);
        } else if (typeof window !== "undefined") {
            accessToken = window.localStorage.getItem(LOCAL_KEYS.ACCESS_TOKEN);
        }

        if (isLoggin && accessToken && userIdToken) {
            // fetch new accessToken from API
            const body = {
                idToken: await userIdToken,
            };

            const response = await handleLoginApiCall(body);
            window?.localStorage.setItem(
                LOCAL_KEYS.ACCESS_TOKEN,
                response.data.access_token
            );
            window?.localStorage.setItem(
                LOCAL_KEYS.REFRESH_TOKEN,
                response.data.refresh_token
            );

            if ("indexedDB" in window) {
                await db.tokens.bulkPut([
                    { id: LOCAL_KEYS.USER_ID_TOKEN, value: userIdToken },
                    {
                        id: LOCAL_KEYS.ACCESS_TOKEN,
                        value: response.data.access_token,
                    },
                    {
                        id: LOCAL_KEYS.REFRESH_TOKEN,
                        value: response.data.refresh_token,
                    },
                ]);
            }

            // await handleSettingupDataInStorage(response, user)

            setIsLoggedIn(true);
            setNavigateUrl(NAV_PATHS.DASHBOARD);
        } else {
            setIsLoggedIn(false);
            logoutCleanUp();
            setNavigateUrl(NAV_PATHS.LOGIN);
        }
    };

    return {
        checkLoginStatus,
        handleLoginApiCall,
        handleSettingupDataInStorage,
        isLoggedIn,
        navigateUrl,
    };
};

export default useLogin;
