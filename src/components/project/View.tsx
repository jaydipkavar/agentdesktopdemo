"use client";

import {
    ArrowLeft,
    Play,
    Pause,
    Settings,
    Download,
    Share,
    MoreHorizontal,
    Plus,
    Pencil,
    ArrowUp,
    ArrowDown,
    Trash2,
    Save,
    ShieldUser,
    Bot,
    FileCode2,
    CircleCheckBig,
    Zap,
    Info,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { StepCard } from "@/components/common/StepCard";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ReactJsonPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css";
import {
    generateSchema,
    processHTML,
    processHTMLCatch,
    sessionInspired,
    updateSession,
} from "@/lib/constants";
import { useNavigate } from "react-router-dom";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import { Label } from "@radix-ui/react-dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import Loader from "../Loader";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { ChatModal } from "../modals/ChatModal";
interface ISteps {
    action?: string;
    step_type: string;
    element_name?: string;
    keyboard_input?: string | null;
    step_id: number;
    description?: string;
    json_schema?: any;
    url?: any;
    scrap_description?: any;
    viewport?: {
        width: number;
        height: number;
    };
}

interface ProjectViewProps {
    steps: ISteps[];
    project: {
        base_url: string;
        created_at: string;
        number_of_steps: number;
        session_id: number;
        session_name: string;
        updated_at: string;
    };
}

import {
    drawActionLabelOnBase64Image,
    getActionIcon,
    getActionLabel,
} from "@/lib/actionUtils";
import StepPreview from "./StepPreview";

const getPlatformIcon = (platform: string) => {
    return (
        <img
            src={`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${platform}&size=128 `}
            className="w-14"
        />
    );
};

export function ProjectView({
    steps: initialSteps,
    project,
}: ProjectViewProps) {
    const [steps, setSteps] = useState(initialSteps);
    const [isDirty, setIsDirty] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [stepStatuses, setStepStatuses] = useState(
        Array(steps.length).fill("pending")
    );
    const [currentStep, setCurrentStep] = useState(0);
    const [screenshots, setScreenshots] = useState<{
        [step_id: string]: {
            type: "image" | "json";
            data: string | object;
        };
    }>({});
    const currentStepId = steps[currentStep]?.step_id;
    const currentShot = screenshots[currentStepId];
    const navigate = useNavigate();
    const [stepTimes, setStepTimes] = useState(Array(steps.length).fill(null));
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [stepToDeleteIndex, setStepToDeleteIndex] = useState<number | null>(
        null
    );
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editStepData, setEditStepData] = useState<ISteps | null>(null);
    const [isJsonValid, setIsJsonValid] = useState(false);
    const [addBlockModal, setAddBlockModal] = useState({
        isOpen: false,
        blockType: "user-input",
        actionDescription: "",
        scrapDescription: "",
        jsonSchema: "",
    });
    const [isGeneratingJson, setIsGeneratingJson] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [pausedStepIndex, setPausedStepIndex] = useState(null);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [loadingStepIndex, setLoadingStepIndex] = useState<number | null>(
        null
    );
    const [useCachedInference, setUseCachedInference] = useState(true);
    const [isChatMode, setIsChatMode] = useState(false);
    const [chatMessages, setChatMessages] = useState<any>([]);
    const [chatInput, setChatInput] = useState("");
    const [loading, setLoading] = useState(false);
    const handleOpenChat = () => {
        setIsChatMode(true);
    };

    const handleCloseChat = () => {
        setIsChatMode(false);
    };
    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const newMessage = {
            id: Date.now(),
            type: "user" as const,
            message: chatInput,
            timestamp: new Date(),
            actions: undefined,
        };
        setChatMessages((prev: any) => [...prev, newMessage]);
        setChatInput("");
        setLoading(true);

        try {
            // Build userInputArray including previous assistant steps
            const userInputArray: any[] = [];

            chatMessages.forEach((msg: any) => {
                userInputArray.push({
                    role: msg.type === "user" ? "user" : "assistant",
                    content: msg.message,
                });

                // If previous assistant has steps, push them as separate assistant content
                if (msg.actions && msg.actions.length > 0) {
                    userInputArray.push({
                        role: "assistant",
                        content: msg.actions,
                    });
                }
            });

            // Push current user input
            userInputArray.push({ role: "user", content: chatInput });

            const res = await sessionInspired({
                session_id: project.session_id,
                user_input: userInputArray,
            });

            const steps = res.data?.steps || [];

            const aiResponse = {
                id: Date.now() + 1,
                type: "ai" as const,
                message: res.data?.response || "No response",
                timestamp: new Date(),
                actions: steps.map((step: any, index: number) => ({
                    id: Date.now() + index + 1,
                    action: step.action || "none",
                    element: step.element_name || step.xpath?.[0] || "Unknown",
                    type: step.action || "none",
                    xpath: step.xpath || [],
                    status: "suggested" as const,
                    keyboard_input: step.keyboard_input || null,
                    url: step.url || null,
                    timestamp: new Date().toISOString(), // step time
                })),
            };

            setChatMessages((prev: any) => [...prev, aiResponse]);
        } catch (error) {
            console.error("API error:", error);
            setChatMessages((prev: any) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    type: "ai" as const,
                    message:
                        "⚠️ Sorry, I couldn’t fetch suggestions. Please try again.",
                    timestamp: new Date(),
                    actions: [],
                },
            ]);
        } finally {
            if (isChatMode) setLoading(false);
        }
    };

    useEffect(() => {
        setSteps(initialSteps);
    }, [initialSteps]);

    const updateStepStatusAndTime = (
        index: any,
        status: "completed" | "failed",
        startTime: any
    ) => {
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);

        setStepStatuses((prev) =>
            prev.map((s, idx) => (idx === index ? status : s))
        );
        setStepTimes((prev) =>
            prev.map((t, idx) => (idx === index ? duration : t))
        );
    };
    function getColorByAction(action: any) {
        const colors: any = {
            click: "#E76F00", // orange
            type: "#007BFF", // blue
            enter: "#28A745", // green
        };
        return colors[action.toLowerCase()] || "#555";
    }
    const getInferance = async (
        session_id: any,
        step: any,
        stepId: any,
        htmlContent: any,
        url: any
    ) => {
        const payload = {
            session_id,
            step_id: stepId,
            viewport_height: step.viewport?.height || 857,
            viewport_width: step.viewport?.width || 1106,
            html: htmlContent,
            url: url.split("?")[0],
        };
        const payloadCache = {
            session_id,
            step_id: stepId,
        };

        const formData = new FormData();
        formData.append("session_id", payload.session_id.toString());
        formData.append("step_id", payload.step_id.toString());
        formData.append("viewport_height", payload.viewport_height.toString());
        formData.append("viewport_width", payload.viewport_width.toString());
        formData.append(
            "html",
            new Blob([payload.html], { type: "text/plain" }),
            "page.txt"
        );
        formData.append("url", payload.url);

        let actionObj = {};

        try {
            if (step.step_type === "act" || step.step_type === "ai-action") {
                if (useCachedInference) {
                    // Try cached processing first
                    const response = await processHTMLCatch(payloadCache);

                    const is404 = response.data.success === false;
                    const finalXpathNull = response?.data?.final_xpath === null;
                    console.log(is404, finalXpathNull);
                    if (is404 || finalXpathNull) {
                        console.warn(
                            "Fallback triggered: 404 or final_xpath is null from processHTMLCatch"
                        );

                        // Fallback to regular processHTML
                        const fallbackResponse = await processHTML(formData);
                        actionObj = fallbackResponse?.data ?? {};
                    } else {
                        actionObj = response.data;
                    }
                } else {
                    // Directly use processHTML without using cache
                    const response = await processHTML(formData);
                    actionObj = response?.data ?? {};
                }
            } else {
                //if user action is scraping,assert,ai-action than never use cache api
                const fallbackResponse = await processHTML(formData);
                actionObj = fallbackResponse?.data ?? {};
            }
        } catch (error) {
            console.error(
                "Error during processHTMLCatch or fallback processHTML:",
                error
            );
            try {
                // Ensure fallback still happens if catch itself fails
                const fallbackResponse = await processHTML(formData);
                actionObj = fallbackResponse?.data ?? {};
            } catch (fallbackError) {
                console.error(
                    "Fallback processHTML also failed:",
                    fallbackError
                );
                actionObj = {};
            }
        } finally {
            return actionObj;
        }
    };

    const runAutomation = async (startIndex = 0) => {
        setIsPlaying(true);
        let prevUrl = null;
        let actionResponse;
        let actionObj;

        const captureAndStoreScreenshot = async (
            stepId: number,
            box = null,
            img = null,
            isJson = false,
            jsonData = null,
            actionType = ""
        ) => {
            if (isJson && jsonData) {
                setScreenshots((prev) => ({
                    ...prev,
                    [stepId]: {
                        type: "json",
                        data: jsonData,
                    },
                }));
                return;
            }

            let base64Image = img;

            if (!base64Image) {
                const result = await window.electronAPI.getScreenshot?.();
                base64Image = result?.img;
            }

            if (!base64Image) return;

            let imageSrc: any = `data:image/png;base64,${base64Image}`;

            if (box) {
                const color = getColorByAction(actionType);
                imageSrc = await drawActionLabelOnBase64Image(
                    imageSrc,
                    box,
                    actionType,
                    color
                );
            }

            setScreenshots((prev) => ({
                ...prev,
                [stepId]: {
                    type: "image",
                    data: imageSrc,
                },
            }));
        };

        for (let i = startIndex; i < steps.length; i++) {
            const step = steps[i] || null;
            const session_id = project.session_id;
            const stepId = step.step_id;
            setLoadingStepIndex(i);
            const startTime = Date.now();
            setCurrentStep(i);
            const result = await window.electronAPI.waitForPage();
            if (!result.success) {
                console.error("Page load failed:", result.message);
            }

            if (step.viewport) {
                console.log("Setting viewport size to:", step.viewport);
                const viewportResult = await window.electronAPI.setViewportSize(
                    step.viewport
                );
                if (!viewportResult.success) {
                    console.error(
                        "Failed to set viewport size:",
                        viewportResult.message
                    );
                } else {
                    console.log(
                        "Viewport size set successfully:",
                        viewportResult.message
                    );
                }
            } else {
                console.log("No viewport to set - step.viewport is missing");
            }
            if (step.action === "navigate") {
                await window.electronAPI.launchPlaywright(step?.url);
                await window.electronAPI.waitForPage();
                console.log(`Navigating to: ${step.url}`);
                const base64: any =
                    await window.electronAPI.captureScreenshot();
                console.log("Screenshot base64:", base64);
                await captureAndStoreScreenshot(
                    stepId,
                    null,
                    base64,
                    false,
                    null,
                    step.action
                );
                setLoadingStepIndex(null);
                updateStepStatusAndTime(i, "completed", startTime);
                prevUrl = step.url;
                continue;
            } else if (step.step_type === "user-input") {
                console.log("run uder");
                const base64: any =
                    await window.electronAPI.captureScreenshot();
                setLoadingStepIndex(i);
                setIsPaused(true);
                setPausedStepIndex(i);
                setIsPlaying(false);
                await captureAndStoreScreenshot(
                    stepId,
                    null,
                    base64,
                    false,
                    null,
                    step.action
                );
                return;
            } else {
                let prebase64: any =
                    await window.electronAPI.captureScreenshot();
                prevUrl = step.url;
                await window.electronAPI.waitForPage();
                const {
                    content: htmlContent,
                    width,
                    height,
                    url,
                } = await window.electronAPI.getPageContent();
                console.log(
                    "HTML Content fetched successfully",
                    width,
                    height,
                    htmlContent,
                    url
                );
                const actionObj = await getInferance(
                    session_id,
                    step,
                    stepId,
                    htmlContent,
                    url
                );
                if (step.step_type === "scrap-data") {
                    console.log("Scraping data...");

                    if (actionObj?.scrap_data) {
                        await captureAndStoreScreenshot(
                            stepId,
                            null, // no box
                            null, // no image
                            true, // isJson = true
                            actionObj.scrap_data, // the actual JSON data
                            null // optional actionType (not needed for JSON)
                        );
                    }

                    updateStepStatusAndTime(i, "completed", startTime);
                    setLoadingStepIndex(null);
                    continue;
                }

                if (step.step_type === "assert") {
                    console.log("assert data...", actionObj);

                    if (actionObj?.assertion_data) {
                        await captureAndStoreScreenshot(
                            stepId,
                            null, // no box
                            null, // no image
                            true, // isJson = true
                            actionObj.assertion_data, // the actual JSON data
                            null // optional actionType (not needed for JSON)
                        );
                    }

                    updateStepStatusAndTime(i, "completed", startTime);
                    setLoadingStepIndex(null);
                    continue;
                }
                console.log("object", actionObj);
                actionResponse = await window.electronAPI.performActionNew(
                    actionObj
                );
                console.log(actionResponse);
                if (step.action === "typed" || step.action === "type") {
                    await window.electronAPI.waitForPage();
                    const base64 = await window.electronAPI.captureScreenshot();
                    await captureAndStoreScreenshot(
                        stepId,
                        actionResponse?.elementInfo.box || null,
                        base64,
                        false,
                        null,
                        step.action
                    );
                } else {
                    await captureAndStoreScreenshot(
                        stepId,
                        actionResponse?.elementInfo.box || null,
                        prebase64,
                        false,
                        null,
                        step.action
                    );
                }
                updateStepStatusAndTime(i, "completed", startTime);
            }

            setCurrentStep(i);
            console.log(step);
            setLoadingStepIndex(null);
            setPausedStepIndex(null);
        }
        const response = await window.electronAPI.closePlaywright();
        setIsPlaying(false);
        setIsPaused(false);
    };
    console.log("steps", steps);
    console.log(screenshots);
    const handleContinue = async () => {
        const indexToRun = pausedStepIndex ?? currentStep;
        const nextIndex = indexToRun + 1;
        const startTime = Date.now();

        // Mark current step as completed
        updateStepStatusAndTime(indexToRun, "completed", startTime);

        // Update currentStep immediately to trigger card re-render
        setCurrentStep(nextIndex);

        // Clear pause states
        setIsPaused(false);
        setIsPlaying(true);
        setPausedStepIndex(null);
        setLoadingStepIndex(null);

        // Continue from next step
        runAutomation(nextIndex);
    };

    // Updated Continue button click handler
    const handleContinueClick = (e) => {
        e.stopPropagation(); // Prevent card click
        handleContinue();
    };
    const handlePlay = async () => {
        if (isSaving) return;

        if (isDirty) {
            setShowUnsavedDialog(true);
            return;
        }
        if (!isPlaying) {
            setIsPlaying(true);

            // If resuming from pause
            if (isPaused && pausedStepIndex !== null) {
                handleContinue();
            } else {
                // Fresh start
                setCurrentStep(0);
                setScreenshots([]);
                setStepStatuses(
                    steps.map((_, index) => (index === 0 ? "pending" : "idle"))
                );
                runAutomation(0);
                console.log("Starting automation...");
            }
        } else {
            // Manual stop/pause
            setLoadingStepIndex(null);
            setIsPlaying(false);
            const response = await window.electronAPI.closePlaywright();
            console.log("Pausing automation...", response);
        }
    };

    const handleStepClick = (stepIndex: number) => {
        setCurrentStep(stepIndex);
        console.log(`Jumping to step ${stepIndex + 1}`);
    };
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                session_id: project.session_id,
                session_data: steps,
            };
            const response = await updateSession(payload);

            if (response) {
                toast.success("Project saved successfully!", {
                    duration: 1000,
                });
                setIsDirty(false);
            } else {
                toast.error(response.data.error || "Failed to save project.");
            }
        } catch (error) {
            console.error("Failed to save project:", error);
            toast.error("Failed to save project. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddBlockClick = () => {
        setAddBlockModal({ ...addBlockModal, isOpen: true });
    };

    const handleAddBlockCancel = () => {
        setAddBlockModal({
            isOpen: false,
            blockType: "user-input",
            actionDescription: "",
            scrapDescription: "",
            jsonSchema: "",
        });
    };

    const handleAddBlockSubmit = () => {
        const newStepId = Math.max(...steps.map((s) => s.step_id)) + 1;
        let newBlock: ISteps;

        switch (addBlockModal.blockType) {
            case "ai-action":
                newBlock = {
                    step_type: "ai-action",
                    step_id: newStepId,
                    description: addBlockModal.actionDescription,
                };
                break;
            case "scrap-data":
                newBlock = {
                    step_type: "scrap-data",
                    step_id: newStepId,
                    description: addBlockModal.actionDescription,
                    json_schema: addBlockModal.jsonSchema,
                };
                break;
            case "assert":
                newBlock = {
                    step_type: "assert",
                    step_id: newStepId,
                    description: addBlockModal.actionDescription,
                };
                break;
            case "user-input":
                newBlock = {
                    step_type: "user-input",
                    step_id: newStepId,
                };
                break;
            default:
                newBlock = {
                    step_type: "assert",
                    step_id: newStepId,
                    description: addBlockModal.actionDescription,
                };
                break;
        }

        const updatedSteps = [
            ...steps.slice(0, currentStep + 1),
            newBlock,
            ...steps.slice(currentStep + 1),
        ];

        setSteps(updatedSteps);
        handleAddBlockCancel();
        setIsDirty(true);
    };

    const handleEdit = (index: number) => {
        setEditStepData({ ...steps[index] });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setEditStepData((prev) => (prev ? { ...prev, [name]: value } : null));
    };

    const handleEditSubmit = () => {
        if (editStepData) {
            const updatedSteps = steps.map((step) =>
                step.step_id === editStepData.step_id ? editStepData : step
            );
            setSteps(updatedSteps);
            setIsDirty(true);
            setIsEditModalOpen(false);
            setEditStepData(null);
        }
    };

    const handleDelete = (index: number) => {
        setStepToDeleteIndex(index);
        setIsDeleteModalOpen(true); // Open the delete confirmation modal
    };

    const confirmDelete = () => {
        if (stepToDeleteIndex !== null) {
            const newSteps = steps.filter((_, i) => i !== stepToDeleteIndex);
            setSteps(newSteps);
            if (currentStep >= newSteps.length) {
                setCurrentStep(Math.max(0, newSteps.length - 1));
            }
            setIsDirty(true);
            setIsDeleteModalOpen(false);
            setStepToDeleteIndex(null);
        }
    };

    const handleMove = (index: number, direction: "up" | "down") => {
        if (direction === "up" && index === 0) return;
        if (direction === "down" && index === steps.length - 1) return;

        const newSteps = [...steps];
        const newIndex = direction === "up" ? index - 1 : index + 1;
        [newSteps[index], newSteps[newIndex]] = [
            newSteps[newIndex],
            newSteps[index],
        ]; // Swap
        setSteps(newSteps);
        setCurrentStep(newIndex);
        setIsDirty(true);
    };

    const handleGenerateJson = async (mode = "add") => {
        setIsGeneratingJson(true);
        try {
            let description, setData, key;

            if (mode === "add") {
                description = addBlockModal.scrapDescription;
                setData = setAddBlockModal;
                key = "jsonSchema";
            } else {
                description = editStepData?.scrap_description;
                setData = setEditStepData;
                key = "json_schema";
            }

            const response = await generateSchema({ description });

            if (response.data.success) {
                const { schema } = response.data;

                setData((prev: any) => ({
                    ...prev,
                    [key]: JSON.stringify(schema, null, 2),
                }));

                setIsJsonValid(true);
                toast.success("JSON schema generated successfully!");
            } else {
                setIsJsonValid(false);
                toast.error(
                    response.data.error || "Failed to generate schema."
                );
            }
        } catch (error) {
            console.error("Error:", error);
            setIsJsonValid(false);
            toast.error("Failed to generate JSON schema.");
        } finally {
            setIsGeneratingJson(false);
        }
    };

    async function handleBackToDashboard() {
        navigate("/");
        const response = await window.electronAPI.closePlaywright();
        console.log("Pausing automation...", response);
    }
    const handleJsonDownload = () => {
        const json = JSON.stringify(currentShot?.data || {}, null, 2);
        const blob = new Blob([json], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `step-${currentStep + 1}-scraped-data.json`;
        document.body.appendChild(link); // optional, for Firefox
        link.click();
        document.body.removeChild(link); // optional cleanup
        URL.revokeObjectURL(url);
    };
    useEffect(() => {
        const currentRef = stepRefs.current[currentStep];
        if (currentRef) {
            currentRef.scrollIntoView({
                behavior: "smooth",
                block: "center", // or 'nearest' / 'start' / 'end'
            });
        }
    }, [currentStep]);
    return (
        <div className="h-full bg-[#f7f9fa] flex flex-col">
            {/* Project Header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBackToDashboard}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>

                        {/* Project info with platform branding */}
                        <div className="flex items-center gap-3">
                            {getPlatformIcon(project.base_url)}
                            <div>
                                <h1 className="text-lg font-semibold text-black">
                                    {project.session_name}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {project.base_url} •{" "}
                                    {project.number_of_steps} steps
                                </p>
                            </div>
                        </div>
                    </div>

                    {!isChatMode && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleSave}
                                disabled={!isDirty || isSaving}
                            >
                                {isSaving ? (
                                    <Loader />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Project
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handlePlay}
                                className={`${
                                    isPlaying
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-black hover:bg-gray-800"
                                } text-white`}
                            >
                                {isPlaying ? (
                                    <>
                                        <Pause className="w-4 h-4 mr-2" />
                                        Stop
                                    </>
                                ) : isPaused ? (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Continue
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Play
                                    </>
                                )}
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Settings className="w-4 h-4 mr-2" />
                                        Edit Project
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Download className="w-4 h-4 mr-2" />
                                        Export
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Share className="w-4 h-4 mr-2" />
                                        Share
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex px-6  gap-0 overflow-hidden">
                {/* Sticky Steps Panel */}
                {isChatMode ? (
                    <ChatModal
                        chatMessages={chatMessages}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        handleSendMessage={handleSendMessage}
                        handleCloseChat={handleCloseChat}
                        isLoading={loading}
                    />
                ) : (
                    <>
                        {" "}
                        <div className="w-96 bg-white border border-[#e4e6eb] rounded-l-lg flex flex-col sticky top-0 h-full">
                            <>
                                <div className="p-6 pb-3 border-b border-[#e4e6eb]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-black">
                                            Activity Log
                                        </h2>
                                        <div
                                            className="relative inline-block rounded-[9px] p-[2px] overflow-hidden"
                                            style={{
                                                background:
                                                    "radial-gradient(100% 707.08% at 0% 0%, #15CEBD 0%, #548AFE 33.82%, #E02FD6 72.12%, #FDB54E 100%)",
                                            }}
                                        >
                                            <Button
                                                variant="solid"
                                                size="sm"
                                                onClick={handleOpenChat}
                                                className="relative bg-white text-gray-700 overflow-hidden group w-full h-full p-1"
                                            >
                                                {/* Sliding gradient overlay */}
                                                <div
                                                    className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"
                                                    style={{
                                                        background:
                                                            "linear-gradient(90deg, #15CEBD 0%, #548AFE 33.82%, #E02FD6 72.12%, #FDB54E 100%)",
                                                        zIndex: 0,
                                                    }}
                                                ></div>

                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 20 20"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="relative z-10 transition-colors duration-300 group-hover:fill-white" // ✅ svg becomes white
                                                >
                                                    <path
                                                        d="M9.81406 5.99257C9.86818 6.01049 9.91528 6.04501 9.94866 6.09122C9.98203 6.13743 10 6.19299 10 6.25C10 6.30701 9.98203 6.36256 9.94866 6.40878C9.91528 6.45499 9.86818 6.48951 9.81406 6.50743L8.36195 6.99105C7.71462 7.20725 7.20725 7.71462 6.99106 8.36195L6.50743 9.81406C6.48951 9.86818 6.45499 9.91528 6.40878 9.94865C6.36256 9.98203 6.30701 10 6.25 10C6.19299 10 6.13743 9.98203 6.09122 9.94865C6.04501 9.91528 6.01049 9.86818 5.99257 9.81406L5.50894 8.36195C5.40292 8.0425 5.22378 7.75222 4.98578 7.51422C4.74778 7.27622 4.4575 7.09707 4.13805 6.99105L2.68593 6.50743C2.63182 6.48951 2.58472 6.45499 2.55134 6.40878C2.51797 6.36256 2.5 6.30701 2.5 6.25C2.5 6.19299 2.51797 6.13743 2.55134 6.09122C2.58472 6.04501 2.63182 6.01049 2.68593 5.99257L4.13805 5.50894C4.4575 5.40292 4.74778 5.22378 4.98578 4.98578C5.22378 4.74778 5.40292 4.4575 5.50894 4.13805L5.99257 2.68593C6.01049 2.63182 6.04501 2.58472 6.09122 2.55134C6.13743 2.51797 6.19299 2.5 6.25 2.5C6.30701 2.5 6.36257 2.51797 6.40878 2.55134C6.45499 2.58472 6.48951 2.63182 6.50743 2.68593L6.99106 4.13805C7.09708 4.4575 7.27622 4.74778 7.51422 4.98578C7.75222 5.22378 8.0425 5.40292 8.36195 5.50894L9.81406 5.99257Z"
                                                        className="group-hover:fill-white"
                                                        fill="black"
                                                    />
                                                    <path
                                                        d="M7.37422 13.9924C7.40981 14.0047 7.44067 14.0278 7.46251 14.0585C7.48436 14.0892 7.49609 14.126 7.49609 14.1636C7.49609 14.2013 7.48436 14.238 7.46251 14.2687C7.44067 14.2994 7.40981 14.3225 7.37422 14.3349L6.40672 14.6574C5.97422 14.8011 5.63547 15.1399 5.49172 15.5724L5.16921 16.5399C5.15688 16.5755 5.13375 16.6063 5.10306 16.6282C5.07237 16.65 5.03564 16.6618 4.99797 16.6618C4.96029 16.6618 4.92356 16.65 4.89287 16.6282C4.86218 16.6063 4.83905 16.5755 4.82671 16.5399L4.50421 15.5724C4.43297 15.3594 4.31323 15.1659 4.15444 15.0071C3.99566 14.8484 3.80217 14.7286 3.58921 14.6574L2.62171 14.3349C2.58612 14.3225 2.55526 14.2994 2.53342 14.2687C2.51157 14.238 2.49984 14.2013 2.49984 14.1636C2.49984 14.126 2.51157 14.0892 2.53342 14.0585C2.55526 14.0278 2.58612 14.0047 2.62171 13.9924L3.58921 13.6699C3.80217 13.5986 3.99566 13.4789 4.15444 13.3201C4.31323 13.1613 4.43297 12.9678 4.50421 12.7549L4.82671 11.7886C4.83905 11.753 4.86218 11.7222 4.89287 11.7003C4.92356 11.6785 4.96029 11.6667 4.99797 11.6667C5.03564 11.6667 5.07237 11.6785 5.10306 11.7003C5.13375 11.7222 5.15688 11.753 5.16922 11.7886L5.49172 12.7561C5.63547 13.1886 5.97422 13.5274 6.40672 13.6711L7.37422 13.9924Z"
                                                        className="group-hover:fill-white"
                                                        fill="black"
                                                    />
                                                    <path
                                                        d="M12.9915 6.0807C13.1015 5.75077 13.5674 5.75077 13.6774 6.0807L14.3223 8.01733C14.4642 8.44305 14.7034 8.82986 15.0208 9.14709C15.3382 9.46432 15.7251 9.70327 16.1509 9.84498L18.0865 10.4899C18.4165 10.5998 18.4165 11.0657 18.0865 11.1757L16.1499 11.8206C15.7242 11.9625 15.3374 12.2017 15.0201 12.5191C14.7029 12.8365 14.464 13.2234 14.3223 13.6492L13.6774 15.5849C13.6537 15.6571 13.6077 15.72 13.5462 15.7646C13.4846 15.8092 13.4105 15.8333 13.3344 15.8333C13.2584 15.8333 13.1843 15.8092 13.1227 15.7646C13.0611 15.72 13.0152 15.6571 12.9915 15.5849L12.3466 13.6482C12.2048 13.2226 11.9658 12.8359 11.6486 12.5187C11.3313 12.2014 10.9446 11.9624 10.519 11.8206L8.58237 11.1757C8.51012 11.152 8.44721 11.1061 8.4026 11.0445C8.358 10.9829 8.33398 10.9088 8.33398 10.8328C8.33398 10.7567 8.358 10.6827 8.4026 10.6211C8.44721 10.5595 8.51012 10.5136 8.58237 10.4899L10.519 9.84498C10.9446 9.70313 11.3313 9.46413 11.6486 9.14691C11.9658 8.82968 12.2048 8.44294 12.3466 8.01733L12.9915 6.0807Z"
                                                        className="group-hover:fill-white"
                                                        fill="black"
                                                    />
                                                </svg>

                                                <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                                                    AI Chat
                                                </span>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                                            onClick={handleAddBlockClick}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() =>
                                                handleEdit(currentStep)
                                            }
                                            disabled={
                                                currentStep === 0 ||
                                                !(
                                                    steps[currentStep]
                                                        ?.step_type ===
                                                        "ai-action" ||
                                                    steps[currentStep]
                                                        ?.step_type ===
                                                        "scrap-data" ||
                                                    steps[currentStep]
                                                        ?.step_type === "assert"
                                                )
                                            }
                                        >
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                                handleMove(currentStep, "up")
                                            }
                                            disabled={
                                                currentStep === 0 ||
                                                currentStep === 1
                                            }
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                                handleMove(currentStep, "down")
                                            }
                                            disabled={
                                                currentStep === 0 ||
                                                currentStep === steps.length - 1
                                            }
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                                handleDelete(currentStep)
                                            }
                                            disabled={currentStep === 0}
                                            className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Zap
                                                className={`w-4 h-4 ${
                                                    useCachedInference
                                                        ? "text-yellow-500"
                                                        : "text-gray-400"
                                                } transition-colors`}
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                Cached Inference
                                            </span>
                                            <div className="group relative">
                                                <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none min-w-[400px] max-w-sm break-words whitespace-normal z-10 shadow-lg">
                                                    <div>
                                                        <p className="font-medium mb-1">
                                                            ⚡ Cached Inference
                                                        </p>
                                                        <p>
                                                            Enabling cached
                                                            inference will run
                                                            the session faster
                                                            than regular
                                                            inference.
                                                        </p>
                                                        <p className="mt-1">
                                                            Uses cached results
                                                            for regular actions
                                                            (click, type,
                                                            navigate).
                                                        </p>
                                                        <p className="mt-1">
                                                            AI-actions, scrap,
                                                            and assert blocks
                                                            always run fresh for
                                                            accuracy.
                                                        </p>
                                                    </div>
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setUseCachedInference(
                                                    !useCachedInference
                                                )
                                            }
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                                useCachedInference
                                                    ? "bg-yellow-500"
                                                    : "bg-gray-300"
                                            }`}
                                            title="Toggle cached inference"
                                        >
                                            <span
                                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                                    useCachedInference
                                                        ? "translate-x-5"
                                                        : "translate-x-1"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {steps.length &&
                                        steps?.map((step, index) => {
                                            const status = stepStatuses[index];
                                            return (
                                                <StepCard
                                                    key={step.step_id}
                                                    step={step}
                                                    index={index}
                                                    currentStep={currentStep}
                                                    status={status}
                                                    onClick={handleStepClick}
                                                    stepRef={(el: any) =>
                                                        (stepRefs.current[
                                                            index
                                                        ] = el)
                                                    }
                                                    onContinueClick={
                                                        handleContinueClick
                                                    }
                                                    isPaused={isPaused}
                                                    stepLodingIndex={
                                                        loadingStepIndex
                                                    }
                                                />
                                            );
                                        })}
                                </div>
                            </>
                        </div>
                        {/* Preview Panel */}
                        <StepPreview
                            steps={steps}
                            currentStep={currentStep}
                            setCurrentStep={setCurrentStep}
                            stepStatuses={stepStatuses}
                            stepTimes={stepTimes}
                            currentShot={currentShot}
                            getActionIcon={getActionIcon}
                            getActionLabel={getActionLabel}
                            handleJsonDownload={handleJsonDownload}
                        />
                    </>
                )}
            </div>

            <DeleteConfirmationModal
                deleteConfirmation={{
                    isOpen: isDeleteModalOpen,
                    projectTitle:
                        steps[currentStep]?.element_name || "Selected Step",
                }}
                onCancel={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
            />

            <Dialog
                open={addBlockModal.isOpen}
                onOpenChange={handleAddBlockCancel}
            >
                <DialogContent
                    className={`sm:max-w-2xl ${
                        addBlockModal?.blockType === "scrap-data"
                            ? "lg:max-w-6xl"
                            : ""
                    }`}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Block
                        </DialogTitle>
                        <DialogDescription>
                            This block will be added after step{" "}
                            {currentStep + 1}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* Block Type Selection */}
                        <div>
                            <Label className="text-sm font-medium">
                                Block Type
                            </Label>
                            <Select
                                value={addBlockModal.blockType}
                                onValueChange={(value) =>
                                    setAddBlockModal({
                                        ...addBlockModal,
                                        blockType: value,
                                    })
                                }
                            >
                                <SelectTrigger className="mt-2">
                                    <SelectValue>
                                        {addBlockModal.blockType ===
                                            "user-input" && (
                                            <div className="flex items-center gap-2">
                                                <ShieldUser className="w-4 h-4 text-gray-500" />
                                                <span>User Input Block</span>
                                            </div>
                                        )}
                                        {addBlockModal.blockType ===
                                            "ai-action" && (
                                            <div className="flex items-center gap-2">
                                                <Bot className="w-4 h-4 text-gray-500" />
                                                <span>AI Action Block</span>
                                            </div>
                                        )}
                                        {addBlockModal.blockType ===
                                            "scrap-data" && (
                                            <div className="flex items-center gap-2">
                                                <FileCode2 className="w-4 h-4 text-gray-500" />
                                                <span>Scrap Data Block</span>
                                            </div>
                                        )}
                                        {addBlockModal.blockType ===
                                            "assert" && (
                                            <div className="flex items-center gap-2">
                                                <CircleCheckBig className="w-4 h-4 text-gray-500" />
                                                <span>Assert Block</span>
                                            </div>
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    <SelectItem value="user-input">
                                        <div className="flex items-center gap-2">
                                            <ShieldUser className="w-4 h-4 text-gray-500" />
                                            <span>User Input Block</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="ai-action">
                                        <div className="flex items-center gap-2">
                                            <Bot className="w-4 h-4 text-gray-500" />
                                            <span>AI Action Block</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="scrap-data">
                                        <div className="flex items-center gap-2">
                                            <FileCode2 className="w-4 h-4 text-gray-500" />
                                            <span>Scrap Data Block</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="assert">
                                        <div className="flex items-center gap-2">
                                            <CircleCheckBig className="w-4 h-4 text-gray-500" />
                                            <span>Assert Block</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Conditional Fields */}
                        {addBlockModal.blockType === "ai-action" && (
                            <div>
                                <Label className="text-sm font-medium">
                                    Action Description
                                </Label>
                                <Textarea
                                    id="action-description"
                                    placeholder="Describe what the AI should do..."
                                    value={addBlockModal.actionDescription}
                                    onChange={(e) =>
                                        setAddBlockModal({
                                            ...addBlockModal,
                                            actionDescription: e.target.value,
                                        })
                                    }
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>
                        )}

                        {addBlockModal.blockType === "scrap-data" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label className="text-sm font-medium">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="action-description"
                                        placeholder="Describe what the AI should do..."
                                        value={addBlockModal.actionDescription}
                                        onChange={(e) =>
                                            setAddBlockModal({
                                                ...addBlockModal,
                                                actionDescription:
                                                    e.target.value,
                                            })
                                        }
                                        className="mt-1"
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium">
                                            What do you want to scrap?
                                            (optional)
                                        </Label>
                                        <Textarea
                                            id="scrap-description"
                                            placeholder="e.g., all the links on the page"
                                            value={
                                                addBlockModal.scrapDescription
                                            }
                                            onChange={(e) =>
                                                setAddBlockModal({
                                                    ...addBlockModal,
                                                    scrapDescription:
                                                        e.target.value,
                                                })
                                            }
                                            className="mt-1"
                                            rows={13}
                                        />
                                    </div>
                                    <div className="w-full  ml-auto flex justify-end">
                                        <Button
                                            onClick={() =>
                                                handleGenerateJson("add")
                                            }
                                            disabled={isGeneratingJson}
                                        >
                                            {isGeneratingJson ? (
                                                <Loader />
                                            ) : (
                                                "Generate"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium">
                                            JSON Schema
                                        </Label>
                                        <div className="border rounded">
                                            <CodeMirror
                                                value={
                                                    addBlockModal?.jsonSchema ||
                                                    ""
                                                }
                                                height="300px"
                                                extensions={[json()]}
                                                theme="light"
                                                basicSetup={{
                                                    lineNumbers: true,
                                                    foldGutter: true,
                                                    highlightActiveLine: true,
                                                }}
                                                onChange={(e: any) => {
                                                    setAddBlockModal({
                                                        ...addBlockModal,
                                                        jsonSchema:
                                                            e.target.value,
                                                    });
                                                    try {
                                                        JSON.parse(
                                                            e.target.value
                                                        );
                                                        setIsJsonValid(true);
                                                    } catch (error) {
                                                        setIsJsonValid(false);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {addBlockModal.blockType === "assert" && (
                            <div>
                                <Label className="text-sm font-medium">
                                    Description
                                </Label>
                                <Textarea
                                    id="assert-description"
                                    placeholder="Describe what to assert or validate..."
                                    value={addBlockModal.actionDescription}
                                    onChange={(e) =>
                                        setAddBlockModal({
                                            ...addBlockModal,
                                            actionDescription: e.target.value,
                                        })
                                    }
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>
                        )}

                        {addBlockModal.blockType === "user-input" && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    No additional configuration required for
                                    User Input blocks.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            onClick={handleAddBlockCancel}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddBlockSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={
                                (addBlockModal.blockType === "ai-action" &&
                                    !addBlockModal.actionDescription.trim()) ||
                                (addBlockModal.blockType === "assert" &&
                                    !addBlockModal.actionDescription.trim()) ||
                                (addBlockModal.blockType === "scrap-data" &&
                                    (!addBlockModal.actionDescription.trim() ||
                                        !addBlockModal.jsonSchema.trim() ||
                                        !isJsonValid))
                            }
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Block
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent
                    className={`sm:max-w-2xl ${
                        editStepData?.step_type === "scrap-data"
                            ? "lg:max-w-6xl"
                            : ""
                    }`}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="w-5 h-5" />
                            Edit Step
                        </DialogTitle>
                        <DialogDescription>
                            Edit the details of the selected step.
                        </DialogDescription>
                    </DialogHeader>

                    {editStepData && (
                        <div className="space-y-4 mt-4">
                            {editStepData.step_type === "ai-action" ||
                            editStepData.step_type === "assert" ? (
                                <div>
                                    <Label className="text-sm font-medium">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder="Describe the step..."
                                        value={editStepData.description || ""}
                                        onChange={handleEditChange}
                                        className="mt-1"
                                        rows={3}
                                    />
                                </div>
                            ) : editStepData.step_type === "scrap-data" ? (
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            placeholder="Describe what data to scrape..."
                                            value={
                                                editStepData.description || ""
                                            }
                                            onChange={handleEditChange}
                                            className="mt-1"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-sm font-medium">
                                                    What do you want to scrap?
                                                    (optional)
                                                </Label>
                                                <Textarea
                                                    id="scrap_description"
                                                    name="scrap_description"
                                                    placeholder="e.g., all the links on the page"
                                                    value={
                                                        editStepData.scrap_description ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setEditStepData(
                                                            (prev: any) => ({
                                                                ...prev,
                                                                scrap_description:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    className="mt-1"
                                                    rows={13}
                                                />
                                            </div>
                                            <div className="w-full  ml-auto flex justify-end">
                                                <Button
                                                    onClick={() =>
                                                        handleGenerateJson(
                                                            "edit"
                                                        )
                                                    }
                                                    disabled={isGeneratingJson}
                                                >
                                                    {isGeneratingJson ? (
                                                        <Loader />
                                                    ) : (
                                                        "Generate"
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium">
                                                JSON Schema
                                            </Label>
                                            <div className="border rounded">
                                                <CodeMirror
                                                    value={
                                                        editStepData.json_schema ||
                                                        ""
                                                    }
                                                    height="300px"
                                                    extensions={[json()]}
                                                    theme="light"
                                                    basicSetup={{
                                                        lineNumbers: true,
                                                        foldGutter: true,
                                                        highlightActiveLine:
                                                            true,
                                                    }}
                                                    onChange={(value) => {
                                                        setEditStepData(
                                                            (prev: any) => ({
                                                                ...prev,
                                                                json_schema:
                                                                    value,
                                                            })
                                                        );
                                                        try {
                                                            JSON.parse(value);
                                                            setIsJsonValid(
                                                                true
                                                            );
                                                        } catch {
                                                            setIsJsonValid(
                                                                false
                                                            );
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : editStepData.step_type === "typed" ? (
                                <div>
                                    <Label className="text-sm font-medium">
                                        Keyboard Input
                                    </Label>
                                    <Textarea
                                        id="keyboard_input"
                                        name="keyboard_input"
                                        placeholder="Enter keyboard input..."
                                        value={
                                            editStepData.keyboard_input || ""
                                        }
                                        onChange={handleEditChange}
                                        className="mt-1"
                                        rows={2}
                                    />
                                </div>
                            ) : (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        No editable fields for this block type.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            onClick={() => setIsEditModalOpen(false)}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={
                                (editStepData?.step_type === "ai-action" &&
                                    (!editStepData.description ||
                                        editStepData.description.trim() ===
                                            "")) ||
                                (editStepData?.step_type === "assert" &&
                                    (!editStepData.description ||
                                        editStepData.description.trim() ===
                                            "")) ||
                                (editStepData?.step_type === "scrap-data" &&
                                    (!editStepData.description ||
                                        editStepData.description.trim() ===
                                            "" ||
                                        !editStepData.json_schema ||
                                        editStepData.json_schema.trim() ===
                                            "")) ||
                                (editStepData?.step_type === "typed" &&
                                    (!editStepData.keyboard_input ||
                                        editStepData.keyboard_input.trim() ===
                                            ""))
                            }
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog
                open={showUnsavedDialog}
                onOpenChange={setShowUnsavedDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unsaved Changes</DialogTitle>
                        <DialogDescription>
                            You have unsaved changes. What would you like to do
                            before starting playback?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="secondary"
                            onClick={async () => {
                                setShowUnsavedDialog(false);
                                await handleSave();
                            }}
                        >
                            Save
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setSteps(initialSteps);
                                setIsDirty(false);
                                setShowUnsavedDialog(false);
                            }}
                        >
                            Discard
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
