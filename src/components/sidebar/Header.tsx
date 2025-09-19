import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "../ui/button";

function SidebarHeader({ externalCollapsed, setInternalCollapsed, internalCollapsed, isCollapsed }: {
    externalCollapsed?: boolean; isCollapsed: boolean; setInternalCollapsed: (collapsed: boolean) => void; internalCollapsed?: boolean;
}) {
    return (
        <div className="p-4">
            <div className="flex items-center gap-2">
                {/* <div className="w-6 h-6 bg-black flex items-center justify-center">
            <div className="w-3 h-3 bg-white"></div>
          </div> */}
                {isCollapsed ? <img src="/logo-2.svg" alt="agentAct logo" /> : <img src="/logo.svg" alt="agentAct logo" />}
                {/* {!isCollapsed && <h2 className="text-lg font-semibold text-black">agentAct.</h2>} */}
                {externalCollapsed === undefined && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setInternalCollapsed(!internalCollapsed)}
                        className={cn("ml-auto", isCollapsed && "ml-0")}
                    >
                        {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                    </Button>
                )}
            </div>
        </div>
    )
}
export default SidebarHeader;