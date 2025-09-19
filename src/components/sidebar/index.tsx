"use client";

import { cn } from "@/lib/utils";
import { Zap, BarChart3 } from "lucide-react";
import { useState } from "react";
import ProfileSection from "../ProfileSection";
import { Link } from "react-router-dom";
import SidebarHeader from "./Header";

const navigationItems = [
    { name: "Automation", icon: Zap, active: true, to: "/" },
    // { name: "Variables", icon: BarChart3, active: false },
];

interface DashboardSidebarProps {
    collapsed?: boolean;
}

export function DashboardSidebar({
    collapsed: externalCollapsed,
}: DashboardSidebarProps) {
    const [internalCollapsed, setInternalCollapsed] = useState(false);

    // Use external collapsed state if provided, otherwise use internal state
    const isCollapsed =
        externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

    return (
        <div
            className={cn(
                "bg-[#fafafa] border-r border-[#e4e6eb] h-full flex flex-col transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            <SidebarHeader
                internalCollapsed={internalCollapsed}
                setInternalCollapsed={setInternalCollapsed}
                externalCollapsed={externalCollapsed}
                isCollapsed={isCollapsed}
            />
            <nav className={cn("px-2 flex-1", isCollapsed && "px-1")}>
                {navigationItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item?.to || "#"}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium mb-1 transition-all",
                            item.active
                                ? isCollapsed
                                    ? "bg-gray-100 text-black rounded-none"
                                    : "bg-gray-100 text-black rounded-md"
                                : "text-gray-600 hover:bg-gray-50 hover:text-black rounded-md",
                            isCollapsed ? "justify-center px-2 py-2 mx-1" : ""
                        )}
                        title={isCollapsed ? item.name : undefined}
                    >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!isCollapsed && item.name}
                    </Link>
                ))}
            </nav>

            {/* Profile Section at Bottom */}
            <ProfileSection isCollapsed={isCollapsed} />
        </div>
    );
}
