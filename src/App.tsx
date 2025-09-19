import { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Detail from "./pages/Detail";
import { initializeDB } from "./db";
import useLogin from "./hooks/useLogin";
import { Loader } from "lucide-react";

function App() {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { checkLoginStatus, isLoggedIn, navigateUrl } = useLogin();

    useEffect(() => {
        (async () => {
            await initializeDB();
            checkLoginStatus()
                .then(() => setIsLoading(false))
                .catch(() => setIsLoading(false));
        })()
    }, []);

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            // If not logged in, redirect to login page
            navigate(navigateUrl || "/login");
        } else if (isLoggedIn && navigateUrl) {
            // If logged in, redirect to the specified URL
            navigate(navigateUrl);
        }
    }, [isLoggedIn, navigateUrl]);

    return (
        <div className="w-full h-screen">
            <Toaster position="top-right" />
            {isLoading && <Loader />}
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/detail/:id" element={<Detail />} />
            </Routes>
        </div>
    );
}

export default App;
