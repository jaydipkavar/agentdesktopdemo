import { User, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn, logoutCleanUp } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

function ProfileSection({ isCollapsed }: { isCollapsed?: boolean }) {
    const navigate = useNavigate();
    const user = window.localStorage.getItem("user")
        ? JSON.parse(window.localStorage.getItem("user") || "{}")
        : null;

    const handleLogout = () => {
        console.log("Logging out...");
        // Add logout logic here
        logoutCleanUp();
        
        toast.success("Logged out successfully", {
            richColors: true,
        });
        
        // Optionally redirect to login page
        navigate("/login");
    };
    return (
        <div
            className={cn(
                "p-4 border-t border-[#e4e6eb] mt-auto",
                isCollapsed && "p-2"
            )}
        >
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start p-2 h-auto",
                            isCollapsed && "justify-center p-2"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gray-100 text-gray-600">
                                    <User className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            {!isCollapsed && (
                                <div className="flex flex-col items-start">
                                    <p className="font-medium text-sm">
                                        {user ? user.name : ""}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {user ? user.email : ""}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                            <p className="font-medium">
                                {user ? user.name : ""}
                            </p>
                            <p className="w-[200px] truncate text-sm text-muted-foreground">
                                {user ? user.email : ""}
                            </p>
                        </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export default ProfileSection;
