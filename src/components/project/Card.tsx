"use client";

import type React from "react";

import { Card } from "@/components/ui/card";
import { Play, Trash2 } from "lucide-react";
import { useState } from "react";

interface ProjectCardProps {
    title: string;
    itemCount: number;
    platform?: string;
    domain?: string;
    onClick?: () => void;
    onPlay?: () => void;
    onDelete?: () => void;
}

const getPlatformIcon = (platform: string) => {
    return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${platform}&size=128 `;
};

export function ProjectCard({
    title,
    itemCount,
    platform,
    domain,
    onClick,
    onPlay,
    onDelete,
}: ProjectCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handlePlayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPlay?.();
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.();
    };

    return (
        <Card
            className="p-0 cursor-pointer hover:border-gray-400 transition-colors border border-gray-200 relative group overflow-hidden"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="aspect-video flex items-center justify-center bg-gray-100">
                <img
                    src={
                        platform
                            ? getPlatformIcon(platform)
                            : getPlatformIcon("https://www.google.com")
                    }
                    alt=""
                />
            </div>
            <div className="p-4 relative">
                <h3 className="font-medium text-black mb-1 truncate">
                    {title}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="truncate">{domain}</span>
                    <span className="ml-2 whitespace-nowrap">
                        {itemCount} steps
                    </span>
                </div>

                {/* Action Buttons - Show on hover */}
                {isHovered && (
                    <div className="absolute bottom-15 right-3 flex gap-2">
                        <button
                            onClick={onClick}
                            className="w-8 h-8 rounded-md bg-black hover:bg-gray-800 flex items-center justify-center transition-colors cursor-pointer"
                            title="Play"
                        >
                            <Play className="h-3 w-3 text-white fill-white pointer-events-none" />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="w-8 h-8 rounded-md bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-200 flex items-center justify-center transition-colors"
                        >
                            <Trash2 className="h-3 w-3 text-gray-600 hover:text-red-600" />
                        </button>
                    </div>
                )}
            </div>
        </Card>
    );
}
