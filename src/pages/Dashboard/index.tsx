"use client";

import {
    Search,
    ChevronRight,
    ChevronLeft,
    RefreshCw,
    RotateCcw,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/sidebar";
import { ProjectCard } from "@/components/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteSession, getAllSessions } from "@/lib/constants";

import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import AgentLoader from "@/components/Loader";
import { motion } from "framer-motion";
const Banneer = React.lazy(() => import("@/components/Banner"));
const DownloadModal = React.lazy(
    () => import("@/components/modals/DownloadModal")
);
const DeleteConfirmationModal = React.lazy(
    () => import("@/components/modals/DeleteConfirmationModal")
);

interface IProjects {
    base_url: string;
    created_at: string;
    number_of_steps: number;
    session_id: number;
    session_name: string;
    updated_at: string;
}
[];

export default function DashboardPage() {
    const navigate = useNavigate();
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<IProjects | null>(
        null
    );
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState<IProjects[]>([]);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        projectId: number | null;
        projectTitle: string;
    }>({
        isOpen: false,
        projectId: null,
        projectTitle: "",
    });
    const [filteredProjects, setFilteredProjects] = useState<
        IProjects[] | null
    >(null);
    const user = window.localStorage.getItem("user")
        ? JSON.parse(window.localStorage.getItem("user") || "{}")
        : null;

    const handleProjectClick = (projectId: number) => {
        const project = filteredProjects?.find(
            (p) => p?.session_id === projectId
        );
        if (project) {
            navigate(`/detail/${project.session_id}`, {
                state: {
                    project,
                },
            });
        }
    };

    const handlePlayProject = (projectId: number) => {
        const project = filteredProjects?.find(
            (p) => p?.session_id === projectId
        );
        if (project) {
            setSelectedProject(project);
        }
    };

    const handleDeleteProject = (projectId: number) => {
        const project = filteredProjects?.find(
            (p) => p?.session_id === projectId
        );
        setDeleteConfirmation({
            isOpen: true,
            projectId,
            projectTitle: project?.session_name || "",
        });
    };

    const handleExtensionDownload = () => {
        // Open Chrome Web Store in new tab
        window.open(
            "https://chrome.google.com/webstore/detail/agentact",
            "_blank"
        );
    };

    const handleHowToCreate = () => {
        // Open the download modal which shows how to create automation
        setIsDownloadModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteConfirmation.projectId) {
            console.log(`Deleting project ${deleteConfirmation.projectId}`);
            // Add actual delete logic here
            // For example: setProjects(projects.filter(p => p.id !== deleteConfirmation.projectId))
            await deleteSession(deleteConfirmation.projectId);
            toast.success("Session Deleted Successfully", {
                richColors: true,
            });
            handleFetchProjects();
        }
        setDeleteConfirmation({
            isOpen: false,
            projectId: null,
            projectTitle: "",
        });
    };

    const cancelDelete = () => {
        setDeleteConfirmation({
            isOpen: false,
            projectId: null,
            projectTitle: "",
        });
    };

    const handleProjectSearch = (
        e:
            | React.KeyboardEvent<HTMLInputElement>
            | React.ChangeEvent<HTMLInputElement>
    ) => {
        const query =
            typeof e === "string" ? e : e.currentTarget.value.toLowerCase();
        console.log("Searching projects for:", query);
        // Implement search logic here
        // For example: filter projects based on the query
        let debounceTimeout: NodeJS.Timeout | null = null;
        if (debounceTimeout) clearTimeout(debounceTimeout);
        const value =
            typeof e === "string" ? e : e.currentTarget.value.toLowerCase();
        debounceTimeout = setTimeout(() => {
            const filtered = projects.filter(
                (p) =>
                    p.session_name.toLowerCase().includes(value) ||
                    p.base_url.toLowerCase().includes(value)
            );
            setFilteredProjects(filtered);
        }, 300);
    };

    const handleToggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const handleFetchProjects = async () => {
        setIsLoading(true);
        try {
            // get access token from indexdb
            const response = await getAllSessions();
            if (response) {
                const data = response.data;
                setProjects(data?.sessions || []); // Set projects from response
                setFilteredProjects(data.sessions); // Initialize filtered projects
                console.log("Projects fetched successfully:", data);
            } else {
                console.error("Failed to fetch projects:", response.error);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
        setIsRefreshing(false);
        setIsLoading(false);
    };

    useEffect(() => {
        const isLoggedIn = !!window.localStorage?.getItem?.("isLoggedIn");

        if (isLoggedIn) {
            // Fetch projects when the component mounts
            handleFetchProjects();
        }
    }, []);

    const handleRefreshProjects = () => {
        setIsRefreshing(true);
        handleFetchProjects();
    };

    return (
        <div className="flex h-screen bg-[#f7f9fa]">
            <DashboardSidebar collapsed={sidebarCollapsed} />

            <div className="flex-1 flex flex-col">
                <div className="flex-1 bg-[#f7f9fa] overflow-y-auto">
                    <Button
                        variant={"secondary"}
                        className="rounded-tl-none rounded-bl-none cursor-pointer"
                        type="button"
                        onClick={handleToggleSidebar}
                    >
                        {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
                    </Button>
                    {/* Welcome Section */}
                    <div className="flex gap-3 px-6 pt-8 pb-6">
                        <div className="mb-0">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 bg-clip-text text-transparent mb-2">
                                {user
                                    ? `Hello, ${user?.name || "User"}`
                                    : "Welcome to agentAct"}
                            </h1>
                            <p className="text-lg text-gray-500">
                                What automation can I help you with today?
                            </p>
                        </div>
                    </div>

                    {/* Banner */}
                    <Banneer
                        handleExtensionDownload={handleExtensionDownload}
                        handleHowToCreate={handleHowToCreate}
                    />
                    {/* Automations Section with aligned search */}
                    <div className="mx-6 mb-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-black">
                                Automations
                            </h2>

                            <div className="flex gap-5 items-center">
                                {" "}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefreshProjects}
                                    disabled={isRefreshing}
                                    className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400 
                      transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                      ${isRefreshing ? "bg-gray-50" : "hover:bg-gray-50"}
                    `}
                                    title="Refresh automations"
                                >
                                    <RotateCcw
                                        className={`w-4 h-4 transition-transform duration-500 ${
                                            isRefreshing ? "animate-spin" : ""
                                        }`}
                                    />
                                    <span className="hidden sm:inline">
                                        {isRefreshing
                                            ? "Refreshing..."
                                            : "Refresh"}
                                    </span>
                                </Button>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search automations..."
                                        onKeyDown={handleProjectSearch}
                                        onChange={handleProjectSearch}
                                        className="pl-10 bg-[#ffffff] border-[#e4e6eb] w-64"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projects Grid */}
                    <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {isLoading ? (
                                <AgentLoader />
                            ) : filteredProjects?.length ? (
                                filteredProjects.map((project, index) => (
                                    <motion.div
                                        initial={{
                                            y: 32,
                                            opacity: 0,
                                            scale: 0.95,
                                        }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        whileHover={{
                                            y: -4,
                                            scale: 1.02,
                                            boxShadow:
                                                "0 10px 15px -3px rgba(0,0,0,0.1)",
                                            borderColor: "rgb(156 163 175)",
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            delay: index * 0.1,
                                            ease: "easeOut",
                                        }}
                                    >
                                        <ProjectCard
                                            title={project.session_name}
                                            itemCount={project.number_of_steps}
                                            domain={project.base_url}
                                            platform={project.base_url}
                                            onClick={() =>
                                                handleProjectClick(
                                                    project.session_id
                                                )
                                            }
                                            onPlay={() =>
                                                handlePlayProject(
                                                    project.session_id
                                                )
                                            }
                                            onDelete={() =>
                                                handleDeleteProject(
                                                    project.session_id
                                                )
                                            }
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full text-center text-gray-500 py-12">
                                    No sessions found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Download Modal */}
            <DownloadModal
                isOpen={isDownloadModalOpen}
                setIsOpen={setIsDownloadModalOpen}
                handleExtensionDownload={handleExtensionDownload}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                deleteConfirmation={deleteConfirmation}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                modalText="Project"
                content="This action cannot be undone. This will permanently
                        delete the project and all its data."
            />
        </div>
    );
}
