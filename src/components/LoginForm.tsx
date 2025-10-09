import { signInWithGoogle } from "@/lib/firebase/auth";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import useLogin from "@/hooks/useLogin";
import { useEffect } from "react";

function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const navigate = useNavigate();
    const {
        handleLoginApiCall,
        handleSettingupDataInStorage,
        isLoggedIn,
        navigateUrl,
    } = useLogin();

    async function handleGoogleLogin() {
        const firebaseUser = await signInWithGoogle();
        const userIdToken = await firebaseUser?.user.getIdToken();
        console.log("Firebase User:", firebaseUser);

        if (userIdToken && firebaseUser?.user.uid) {
            const body = {
                idToken: userIdToken,
            };

            const loginResponse = await handleLoginApiCall(body);
            await handleSettingupDataInStorage(
                loginResponse,
                firebaseUser.user
            );
        } else {
            toast.error("Failed to login with Google. Please try again.", {
                richColors: true,
            });
        }
    }

    useEffect(() => {
        if (isLoggedIn && navigateUrl && navigateUrl !== "") {
            navigate(navigateUrl);
        }
    }, [isLoggedIn, navigateUrl]);
    return (
        <div
            className={cn("flex flex-col items-center gap-6 p-8", className)}
            {...props}
        >
            <div className="flex flex-col items-center gap-6 text-center">
                {/* agentAct branding */}
                <div className="flex items-center gap-2">
                    <img src="/logo.svg" alt="agentAct logo" />
                </div>

                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-3xl font-bold text-black bg-amber-500">Welcome</h1>
                    <p className="text-gray-500">Sign in to continue</p>
                </div>
            </div>

            <Button
                onClick={handleGoogleLogin}
                className="w-full max-w-sm bg-black hover:bg-gray-800 text-white py-3 px-6 rounded-md flex items-center justify-center gap-3"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Continue with Google
            </Button>

            <p className="text-xs text-gray-500 text-center max-w-sm">
                By continuing, you agree to our{" "}
                <a href="#" className="underline hover:no-underline">
                    Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline hover:no-underline">
                    Privacy Policy
                </a>
            </p>
        </div>
    );
}

export default LoginForm;
