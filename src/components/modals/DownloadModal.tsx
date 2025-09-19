import { Chrome, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { DialogHeader } from "../ui/dialog";

function DownloadModal({
    isOpen,
    setIsOpen,
    handleExtensionDownload,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    handleExtensionDownload: () => void;
}) {
    return (
        <Dialog
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Chrome className="w-5 h-5" />
                        How to Create Automation
                    </DialogTitle>
                    <DialogDescription>
                        Start recording web automations in 4 simple steps
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Step 1 */}
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                            1
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">
                                Download & install extension
                            </p>
                        </div>
                        <Button
                            onClick={handleExtensionDownload}
                            size="sm"
                            className="bg-black hover:bg-gray-800 text-white"
                        >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Install
                        </Button>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                            2
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">
                                Pin extension to toolbar
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                            3
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">
                                Click extension → Start recording
                            </p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                            4
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">
                                Navigate web → Save → Play here
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        Need help?{" "}
                        <a href="#" className="text-black hover:underline">
                            View docs
                        </a>
                    </p>
                    <Button
                        onClick={() => setIsOpen(false)}
                        variant="outline"
                        size="sm"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default DownloadModal;