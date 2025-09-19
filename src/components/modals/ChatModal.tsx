import React, { useEffect, useRef, useState } from "react";
import { Bot, X, Send, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepCard } from "@/components/common/StepCard";
import {
    drawActionLabelOnBase64Image,
    getActionIcon,
    getActionLabel,
} from "@/lib/actionUtils";
import StepPreview from "../project/StepPreview";
import { motion } from "framer-motion";
import { AiIcon } from "../ui/lucideIcon";
type MessageType = "user" | "ai";

interface Action {
    id: number;
    type: string;
    step_id: number;
    element: string;
    action: string;
    status?: "suggested" | "completed" | "failed" | "current";
    keyboard_input?: string | null;
    url?: string | null;
    description?: string;
}

interface ChatMessage {
    id: number;
    type: MessageType;
    message: string;
    timestamp: Date;
    actions?: Action[];
}

interface ChatModalProps {
    chatMessages: ChatMessage[];
    chatInput: string;
    setChatInput: (value: string) => void;
    handleSendMessage: () => void;
    handleCloseChat: () => void;
    isLoading: boolean;
}

// === Component ===
export const ChatModal: React.FC<ChatModalProps> = ({
    chatMessages,
    chatInput,
    setChatInput,
    handleSendMessage,
    handleCloseChat,
    isLoading,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [stepStatuses, setStepStatuses] = useState(
        Array(chatMessages.length).fill("pending")
    );
    const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
    const steps: any =
        [...chatMessages].reverse().find((msg) => msg.actions)?.actions || [];
    const [stepTimes, setStepTimes] = useState(
        Array(chatMessages.length).fill(null)
    );
    const [pausedStepIndex, setPausedStepIndex] = useState(null);
    const [screenshots, setScreenshots] = useState<{
        [step_id: string]: {
            type: "image" | "json";
            data: string | object;
        };
    }>({});
    const currentStepId = steps?.[currentStep]?.id ?? null;
    const currentShot = screenshots[currentStepId];
    const [isPaused, setIsPaused] = useState(false);
    const [loadingStepIndex, setLoadingStepIndex] = useState<number | null>(
        null
    );
    const [shouldStartAutomation, setShouldStartAutomation] = useState(false);
    const lastAiMessage = [...chatMessages]
        .reverse()
        .find((msg) => msg.type === "ai" && msg.actions);
    // useEffect to automatically start automation when loading completes
    useEffect(() => {
        // Only call handlePlay if loading just finished and we're not already playing
        if (!isLoading && !isPlaying && shouldStartAutomation) {
            handlePlay();
            setShouldStartAutomation(false); // Reset flag
        }
    }, [isLoading, isPlaying, shouldStartAutomation]);

    const handleStepClick = (stepIndex: number) => {
        setCurrentStep(stepIndex);
        console.log(`Jumping to step ${stepIndex + 1}`);
    };

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
            const stepId = step.id;
            setCurrentStep(i);
            setLoadingStepIndex(i);
            const startTime = Date.now();
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
            } else if (step.action === "user-input") {
                setIsPaused(true);
                setPausedStepIndex(i);
                setIsPlaying(false);
                actionObj = {
                    action: step.action,
                    url: step.url,
                };
                actionResponse = await window.electronAPI.performActionNew(
                    actionObj
                );
                console.log("Action Response:", actionResponse);

                if (actionResponse.img) {
                    await captureAndStoreScreenshot(
                        stepId,
                        actionResponse.elementInfo?.box,
                        actionResponse.img,
                        false,
                        null,
                        step.action // Pass action for label color & text
                    );
                }
                console.log("Paused at user-input step", i);
                return;
            } else {
                let prebase64: any =
                    await window.electronAPI.captureScreenshot();
                prevUrl = step.url;
                await window.electronAPI.waitForPage();
                let updatedActionObj: any = {};
                let success;
                console.log(step);
                for (let j = 0; j < step.xpath.length; j++) {
                    console.log(`Trying xpath[${j}]: ${step.xpath[j]}`);

                    updatedActionObj = {
                        action: step.action,
                        count: 1,
                        xpath: "xpath=" + step.xpath[j],
                        final_xpath: "xpath=" + step.xpath[j],
                        keyboard_input: step.keyboard_input || null,
                        optimized: true,
                        processing_time: 1.653,
                        success: true,
                    };

                    console.log(updatedActionObj);

                    const result = await window.electronAPI.performActionNew(
                        updatedActionObj
                    );
                    console.log("-----", result);
                    if (result?.success) {
                        console.log(
                            "✅ Action succeeded with xpath:",
                            step.xpath[j]
                        );

                        if (result?.img) {
                            await captureAndStoreScreenshot(
                                stepId,
                                result?.elementInfo?.box || null,
                                result.img,
                                false,
                                null,
                                step.action
                            );
                        } else if (
                            step.action === "typed" ||
                            step.action === "type"
                        ) {
                            await window.electronAPI.waitForPage();
                            const base64: any =
                                await window.electronAPI.captureScreenshot();
                            await captureAndStoreScreenshot(
                                stepId,
                                result?.elementInfo?.box || null,
                                base64,
                                false,
                                null,
                                step.action
                            );
                        } else {
                            await captureAndStoreScreenshot(
                                stepId,
                                result?.elementInfo?.box || null,
                                prebase64,
                                false,
                                null,
                                step.action
                            );
                        }

                        updateStepStatusAndTime(i, "completed", startTime);
                        success = true;
                        break; // stop trying further xpaths
                    } else {
                        console.error(
                            `❌ Step ${j + 1} failed:`,
                            result?.message
                        );
                    }
                }

                if (!success) {
                    console.error(`All xpaths failed for step ${i}`);
                    updateStepStatusAndTime(i, "failed", startTime);
                }

                await new Promise((res) => setTimeout(res, 500));
            }
        }
        const response = await window.electronAPI.closePlaywright();
        setLoadingStepIndex(null);
        setIsPlaying(false);
        setIsPaused(false);
        setPausedStepIndex(null);
    };
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

    const handlePlay = async () => {
        if (!isPlaying && steps) {
            setIsPlaying(true);

            // If resuming from pause
            if (isPaused && pausedStepIndex !== null) {
                handleContinue();
            } else {
                // Fresh start
                setCurrentStep(0);
                setScreenshots({});
                setStepStatuses(
                    steps.map((_, index: any) =>
                        index === 0 ? "pending" : "idle"
                    )
                );
                runAutomation(0);
                console.log("Starting automation...");
            }
        } else {
            // Manual stop/pause
            setIsPlaying(false);
            setLoadingStepIndex(null);
            const response = await window.electronAPI.closePlaywright();
            console.log("Pausing automation...", response);
        }
    };

    const handleSendMsg = () => {
        setShouldStartAutomation(true);
        handleSendMessage();
    };

    // Button click handler for dual functionality
    const handleButtonClick = () => {
        if (isPlaying) {
            handlePlay(); // Stop automation
        } else if (!isLoading) {
            handleSendMsg(); // Send message, useEffect will handle automation start
        }
    };
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
        <div className="flex-1 flex   gap-0 overflow-hidden">
            {" "}
            <motion.div
                initial={{ x: 40, opacity: 0 }} // open from left
                animate={{ x: 0, opacity: 1 }} // slide in
                exit={{ x: 400, opacity: 0 }} // close to right
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-96 bg-white border border-[#e4e6eb] rounded-l-lg flex flex-col sticky top-0 h-full shadow-lg z-50"
            >
                {/* Header */}
                <div className="p-4 border-b border-[#e4e6eb]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* <Bot className="w-5 h-5 text-blue-600" /> */}
                            <AiIcon />
                            <h2 className="text-xl font-semibold text-black">
                                AI Chat
                            </h2>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCloseChat}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4  border-[#e4e6eb]">
                        {chatMessages.length === 0 ? (
                            <div className="flex justify-center flex-col text-center items-center gap-3 text-gray-500 mt-8 w-full ">
                                <AiIcon width={40} height={36} />
                                <p className="text-sm">
                                    Ask me anything about your automation!
                                </p>
                            </div>
                        ) : (
                            chatMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${
                                        msg.type === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-[90%] ${
                                            msg.type === "user"
                                                ? "text-right"
                                                : "text-left"
                                        }`}
                                    >
                                        {/* Message bubble */}
                                        <div
                                            className={`inline-block p-3 rounded-lg mb-2 ${
                                                msg.type === "user"
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-100 text-black"
                                            }`}
                                        >
                                            <p className="text-sm">
                                                {msg.message}
                                            </p>
                                            <p
                                                className={`text-xs mt-1 ${
                                                    msg.type === "user"
                                                        ? "text-blue-100"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                {msg.timestamp.toLocaleTimeString(
                                                    [],
                                                    {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    }
                                                )}
                                            </p>
                                        </div>

                                        {/* AI Action Cards */}
                                        {msg.type === "ai" && msg.actions && (
                                            <div className="space-y-2 mt-3">
                                                {msg.id === lastAiMessage?.id
                                                    ? // Render interactive step cards only for the latest AI message
                                                      msg.actions.map(
                                                          (action, index) => {
                                                              const status =
                                                                  stepStatuses[
                                                                      index
                                                                  ];
                                                              return (
                                                                  <StepCard
                                                                      key={
                                                                          action.id
                                                                      }
                                                                      step={
                                                                          action
                                                                      }
                                                                      index={
                                                                          index
                                                                      }
                                                                      currentStep={
                                                                          currentStep
                                                                      }
                                                                      status={
                                                                          status
                                                                      }
                                                                      onClick={
                                                                          handleStepClick
                                                                      }
                                                                      stepLodingIndex={
                                                                          loadingStepIndex
                                                                      }
                                                                      stepRef={(
                                                                          el: any
                                                                      ) =>
                                                                          (stepRefs.current[
                                                                              index
                                                                          ] =
                                                                              el)
                                                                      }
                                                                  />
                                                              );
                                                          }
                                                      )
                                                    : msg.actions.map(
                                                          (action, index) => (
                                                              <StepCard
                                                                  key={
                                                                      action.id
                                                                  }
                                                                  index={index}
                                                                  step={action}
                                                              />
                                                          )
                                                      )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Input */}
                <div className="p-[19px] border-t border-[#e4e6eb]">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleButtonClick()
                            }
                            placeholder="Ask about your automation..."
                            className="flex-1 h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            onClick={handleButtonClick}
                            className="h-10 w-10 flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                            disabled={isLoading}
                            aria-label={
                                isLoading
                                    ? "Sending message..."
                                    : isPlaying
                                    ? "Stop automation"
                                    : "Send message"
                            }
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : isPlaying ? (
                                <StopCircle className="w-5 h-5" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
            <div className="relative z-[999] flex-1">
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
            </div>
        </div>
    );
};
