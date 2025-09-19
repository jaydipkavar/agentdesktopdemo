import { Chrome, Sparkles, Zap } from "lucide-react";
import { Button } from "./ui/button";

function Banneer({
    handleHowToCreate,
    handleExtensionDownload,
}: {
    handleHowToCreate: () => void;
    handleExtensionDownload: () => void;
}) {
    return (
        <div className="mx-6 mb-6 -mt-2">
            <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-6 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute right-0 top-0 w-1/3 h-full opacity-20">
                    <div className="absolute top-4 right-8">
                        <Zap className="w-8 h-8 text-yellow-400 transform rotate-12" />
                    </div>
                    <div className="absolute top-12 right-16">
                        <Sparkles className="w-6 h-6 text-orange-400 transform -rotate-12" />
                    </div>
                    <div className="absolute top-8 right-24">
                        <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                    </div>
                    <div className="absolute top-16 right-12">
                        <div className="w-3 h-3 bg-yellow-400 rounded-sm transform rotate-45"></div>
                    </div>
                    <div className="absolute top-20 right-20">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    </div>
                    <div className="absolute bottom-8 right-8">
                        <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg transform rotate-12"></div>
                    </div>
                    <div className="absolute bottom-12 right-16">
                        <Sparkles className="w-5 h-5 text-yellow-400 transform rotate-45" />
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Create Your First Automation
                    </h2>
                    <p className="text-blue-100 mb-4 max-w-md">
                        Start recording web automations in minutes with our
                        Chrome extension
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleHowToCreate}
                            className="bg-white text-slate-900 hover:bg-gray-100 font-medium px-6 py-2 rounded-lg border-2 border-transparent hover:border-white/20 transition-all"
                        >
                            Get Started
                        </Button>
                        <Button
                            onClick={handleExtensionDownload}
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/10 font-medium px-4 py-2 rounded-lg transition-all bg-transparent"
                        >
                            <Chrome className="w-4 h-4 mr-2" />
                            Chrome Store
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Banneer;
