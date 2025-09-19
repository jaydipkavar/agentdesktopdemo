import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import ReactJsonPretty from "react-json-pretty";

interface StepPreviewProps {
    steps: any[];
    currentStep: number;
    setCurrentStep: (index: number) => void;
    stepStatuses: string[];
    stepTimes: (number | null)[];
    currentShot: { type: string; data: any } | null;
    getActionIcon: (action: string) => React.ReactNode;
    getActionLabel: (action: string) => string;
    handleJsonDownload: () => void;
}

const StepPreview: React.FC<StepPreviewProps> = ({
    steps = [],
    currentStep = 0,
    setCurrentStep,
    stepStatuses = [],
    stepTimes = [],
    currentShot,
    getActionIcon,
    getActionLabel,
    handleJsonDownload,
}) => {
    const currentStepData = steps?.[currentStep] ?? {};
    return (
        <div className="flex-1 bg-white border-t border-r border-b border-[#e4e6eb] rounded-r-lg flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-[#e4e6eb]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-black">Step Preview</h3>
                    <div className="text-sm text-gray-500">
                        Step {currentStep + 1} of {steps.length || 0}
                    </div>
                </div>

                {/* Action + Status */}
                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                        {getActionIcon(
                            currentStepData?.action ||
                                currentStepData?.step_type
                        )}
                        <h4 className="font-semibold text-black">
                            {getActionLabel(
                                currentStepData?.action ||
                                    currentStepData?.step_type
                            )}
                        </h4>

                        {steps.map((step, index) => {
                            if (index !== currentStep) return null;

                            const status = stepStatuses[index] || "pending";
                            const statusClass =
                                status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : status === "failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-600";
                            const statusLabel =
                                status === "completed"
                                    ? "Successful"
                                    : status === "failed"
                                    ? "Failed"
                                    : "Pending";

                            return (
                                <React.Fragment key={index}>
                                    <div
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
                                    >
                                        {statusLabel}
                                    </div>
                                    <div className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {stepTimes[index] != null
                                            ? `${stepTimes[index]}s`
                                            : "--"}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Step Details */}
                    <div className="space-y-2 text-sm">
                        {currentStepData?.description && (
                            <div>
                                <span className="text-gray-500">
                                    Description:
                                </span>
                                <span className="ml-2 font-mono text-black bg-gray-100 px-2 py-1 rounded text-xs">
                                    {(currentStepData.description || "").slice(
                                        0,
                                        130
                                    )}
                                    {currentStepData.description.length > 130
                                        ? "..."
                                        : ""}
                                </span>
                            </div>
                        )}
                        {currentStepData?.json_schema && (
                            <div>
                                <span className="text-gray-500">
                                    Json_schema:
                                </span>
                                <span className="ml-2 font-mono text-black bg-gray-100 px-2 py-1 rounded text-xs">
                                    {(currentStepData.json_schema || "").slice(
                                        0,
                                        130
                                    )}
                                    {currentStepData.json_schema.length > 130
                                        ? "..."
                                        : ""}
                                </span>
                            </div>
                        )}
                        {currentStepData?.element_name && (
                            <div>
                                <span className="text-gray-500">Element:</span>
                                <span className="ml-2 font-mono text-black bg-gray-100 px-2 py-1 rounded text-xs">
                                    {currentStepData.element_name}
                                </span>
                            </div>
                        )}
                        {currentStepData?.keyboard_input && (
                            <div>
                                <span className="text-gray-500">
                                    Input Value:
                                </span>
                                <span className="ml-2 font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
                                    {currentStepData.keyboard_input}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
                {currentShot ? (
                    currentShot.type === "json" ? (
                        <div className="rounded shadow p-4 border bg-white h-full flex flex-col w-full max-w-full">
                            {/* Header */}
                            <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2">
                                <p className="text-xs text-gray-500">
                                    Step {currentStep + 1} - Scraped Data
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleJsonDownload}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                            </div>

                            {/* JSON Viewer */}
                            <div className="overflow-y-auto flex-1 w-full max-w-full">
                                <ReactJsonPretty
                                    data={currentShot?.data || {}}
                                    theme="monikai"
                                    className="json-pretty-wrap"
                                    style={{
                                        fontSize: "12px",
                                        width: "100%",
                                        maxWidth: "100%",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                        overflowWrap: "anywhere",
                                        display: "block",
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded shadow p-2 border max-w-full">
                            <p className="text-xs text-gray-500 mb-1">
                                Step {currentStep + 1}
                            </p>
                            <img
                                src={currentShot.data}
                                alt={`Step ${currentStep + 1}`}
                                className="w-full h-[550px] object-contain rounded bg-white"
                            />
                        </div>
                    )
                ) : (
                    <div className="rounded shadow p-2 border max-w-full flex items-center justify-center bg-white text-gray-400">
                        No data or screenshot available for Step{" "}
                        {currentStep + 1}
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between p-[23px] border-t border-[#e4e6eb] bg-white">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                >
                    Previous
                </Button>
                <div className="text-sm text-gray-500">
                    {currentStep + 1} / {steps.length || 0}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        setCurrentStep(
                            Math.min((steps.length || 1) - 1, currentStep + 1)
                        )
                    }
                    disabled={currentStep >= (steps.length || 1) - 1}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default StepPreview;
