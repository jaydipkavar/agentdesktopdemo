"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getActionIcon, getActionLabel } from "@/lib/actionUtils";
import { Loader2 } from "lucide-react";

interface StepCardProps {
    step: {
        id?: number;
        step_id?: number;
        action?: string;
        step_type?: string;
        element?: string;
        element_name?: any;
        description?: string;
        keyboard_input?: string | null;
        status?: "suggested" | "completed" | "failed" | "current";
    };
    index: number;
    currentStep?: number;
    status?: "suggested" | "completed" | "failed" | "current";
    onClick?: (index: number) => void;
    stepRef?: (el: HTMLDivElement | null) => void;
    onContinueClick?: (e: React.MouseEvent) => void;
    isPaused?: boolean;
    stepLodingIndex?: any;
}

export const StepCard: React.FC<StepCardProps> = ({
    step,
    index,
    currentStep,
    status,
    onClick,
    stepRef,
    onContinueClick,
    isPaused,
    stepLodingIndex,
}) => {
    const actionType = step.action || step.step_type || "";
    const elementName = step.element || step.element_name || step.url || "";
    return (
        <Card
            key={step.id || step.step_id}
            onClick={() => onClick(index)}
            ref={stepRef}
            className={`p-4 cursor-pointer transition-all duration-200 border relative ${
                currentStep === index
                    ? "border-blue-200 bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
            }`}
        >
            <div className="flex items-start gap-4">
                {/* Step number */}
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-1
                    ${
                        status === "current"
                            ? "bg-blue-100 text-blue-700"
                            : status === "completed"
                            ? "bg-green-100 text-green-700"
                            : status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                    }`}
                >
                    {stepLodingIndex === index ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        index + 1
                    )}
                </div>

                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                    {getActionIcon(actionType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-nowrap overflow-hidden">
                        <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
                            <span className="font-semibold text-sm text-black whitespace-nowrap">
                                {getActionLabel(actionType)}
                            </span>

                            <span className="text-sm text-gray-500 font-mono truncate min-w-0">
                                {elementName}
                            </span>
                        </div>
                        {step.step_type === "user-input" && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onContinueClick}
                                disabled={!(currentStep === index && isPaused)}
                            >
                                Continue
                            </Button>
                        )}
                    </div>

                    {step.description && (
                        <div className="text-sm text-gray-600">
                            <span className="text-gray-500">Description:</span>{" "}
                            <span className="font-mono max-w-[120px] inline-block truncate align-middle overflow-hidden">
                                {step.description}
                            </span>
                        </div>
                    )}

                    {step.keyboard_input && (
                        <div className="text-sm text-gray-600">
                            <span className="text-gray-500">Input:</span>{" "}
                            <span className="font-mono">
                                {step.keyboard_input}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
