import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { DialogHeader } from "../ui/dialog";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";

function DeleteConfirmationModal({
    deleteConfirmation,
    onCancel,
    onConfirm,
    modalText,
    content,
}: {
    deleteConfirmation: {
        isOpen: boolean;
        projectTitle: string;
    };
    modalText?: string;
    content?: string;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={deleteConfirmation.isOpen} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        Delete {modalText}
                    </DialogTitle>
                    <DialogDescription>{content}</DialogDescription>
                </DialogHeader>

                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-red-600 text-xs font-bold">
                                !
                            </span>
                        </div>
                        <div>
                            <h5 className="font-medium text-red-900 mb-1">
                                You're about to delete:
                            </h5>
                            <p className="text-sm text-red-800 font-medium">
                                "{deleteConfirmation.projectTitle}"
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button onClick={onCancel} variant="outline">
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete {modalText}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default DeleteConfirmationModal;
