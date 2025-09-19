import {
    Bot,
    CircleCheckBig,
    Clock,
    CornerDownLeft,
    FileCode2,
    Globe,
    Keyboard,
    Mouse,
    ShieldUser,
} from "lucide-react";

export const getActionIcon = (type: string) => {
    switch (type) {
        case "navigate":
            return <Globe className="w-4 h-4 text-gray-600" />;
        case "click":
            return <Mouse className="w-4 h-4 text-gray-600" />;
        case "typed":
            return <Keyboard className="w-4 h-4 text-gray-600" />;
        case "enter":
            return <CornerDownLeft className="w-4 h-4 text-gray-600" />;
        case "wait":
            return <Clock className="w-4 h-4 text-gray-600" />;
        case "ai-action":
            return <Bot className="w-4 h-4 text-gray-600" />;
        case "scrap-data":
            return <FileCode2 className="w-4 h-4 text-gray-600" />;
        case "assert":
            return <CircleCheckBig className="w-4 h-4 text-gray-600" />;
        case "user-input":
            return <ShieldUser className="w-4 h-4 text-gray-600" />;
        default:
            return <Mouse className="w-4 h-4 text-gray-600" />;
    }
};

export const getActionLabel = (type: string): string => {
    switch (type) {
        case "navigate":
            return "NAVIGATE";
        case "click":
            return "CLICK";
        case "type":
        case "typed":
            return "TYPED";
        case "enter":
            return "ENTER";
        case "wait":
            return "WAIT";
        case "ai-action":
            return "AI ACTION";
        case "scrap-data":
            return "SCRAP DATA";
        case "assert":
            return "ASSERT";
        case "user-input":
            return "USER INPUT";
        default:
            return "ACTION";
    }
};

export function drawActionLabelOnBase64Image(
    base64Image: string,
    box: never,
    name = "Click",
    bgColor = "#E76F00",
    textColor = "#fff",
    scale = 1
): any {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx: any = canvas.getContext("2d");

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw base image
            ctx.drawImage(img, 0, 0);

            // Scale context if needed
            if (scale !== 1) {
                ctx.scale(scale, scale);
            }

            // Translate context to box position
            const offsetX = box.x + box.width / 2;
            const offsetY = box.y + box.height / 2;
            ctx.save();
            ctx.translate(offsetX, offsetY);

            // Draw arrow shadow
            ctx.save();
            ctx.translate(0, 1);
            ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
            ctx.shadowBlur = 2;

            ctx.beginPath();
            ctx.moveTo(11.8924, 23.7113);
            ctx.lineTo(7.33378, 7.71982);
            ctx.bezierCurveTo(
                7.0984,
                6.89409,
                7.95602,
                6.18106,
                8.73584,
                6.55413
            );
            ctx.lineTo(23.8385, 13.7792);
            ctx.bezierCurveTo(
                24.6416,
                14.1634,
                24.5812,
                15.3159,
                23.7425,
                15.6131
            );
            ctx.lineTo(17.5312, 17.8139);
            ctx.bezierCurveTo(
                17.3056,
                17.8938,
                17.1164,
                18.0511,
                16.9978,
                18.2574
            );
            ctx.lineTo(13.7318, 23.9361);
            ctx.bezierCurveTo(
                13.2908,
                24.7029,
                12.1347,
                24.5616,
                11.8924,
                23.7113
            );
            ctx.closePath();
            ctx.fillStyle = "#DC6803";
            ctx.fill();
            ctx.restore();

            // Draw arrow main shape
            ctx.beginPath();
            ctx.moveTo(11.8924, 23.7113);
            ctx.lineTo(7.33378, 7.71982);
            ctx.bezierCurveTo(
                7.0984,
                6.89409,
                7.95602,
                6.18106,
                8.73584,
                6.55413
            );
            ctx.lineTo(23.8385, 13.7792);
            ctx.bezierCurveTo(
                24.6416,
                14.1634,
                24.5812,
                15.3159,
                23.7425,
                15.6131
            );
            ctx.lineTo(17.5312, 17.8139);
            ctx.bezierCurveTo(
                17.3056,
                17.8938,
                17.1164,
                18.0511,
                16.9978,
                18.2574
            );
            ctx.lineTo(13.7318, 23.9361);
            ctx.bezierCurveTo(
                13.2908,
                24.7029,
                12.1347,
                24.5616,
                11.8924,
                23.7113
            );
            ctx.closePath();
            ctx.fillStyle = bgColor;
            ctx.fill();

            // Stroke the arrow
            ctx.strokeStyle = bgColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(11.4093, 23.8463);
            ctx.lineTo(6.85075, 7.8544);
            ctx.bezierCurveTo(
                6.49768,
                6.61583,
                7.78362,
                5.54674,
                8.95335,
                6.10628
            );
            ctx.lineTo(24.0564, 13.3314);
            ctx.bezierCurveTo(
                25.2607,
                13.9078,
                25.1699,
                15.6359,
                23.9119,
                16.0816
            );
            ctx.lineTo(17.7012, 18.2825);
            ctx.bezierCurveTo(
                17.5885,
                18.3224,
                17.4939,
                18.4012,
                17.4346,
                18.5041
            );
            ctx.lineTo(14.1679, 24.1829);
            ctx.bezierCurveTo(
                13.5065,
                25.3329,
                11.7731,
                25.1214,
                11.4093,
                23.8463
            );
            ctx.closePath();
            ctx.stroke();

            // Draw the rounded rectangle label
            const buttonX = 23;
            const buttonY = 23;
            const buttonWidth = 77;
            const buttonHeight = 38;
            const cornerRadius = 19;

            ctx.beginPath();
            ctx.moveTo(buttonX + cornerRadius, buttonY);
            ctx.lineTo(buttonX + buttonWidth - cornerRadius, buttonY);
            ctx.arcTo(
                buttonX + buttonWidth,
                buttonY,
                buttonX + buttonWidth,
                buttonY + cornerRadius,
                cornerRadius
            );
            ctx.lineTo(
                buttonX + buttonWidth,
                buttonY + buttonHeight - cornerRadius
            );
            ctx.arcTo(
                buttonX + buttonWidth,
                buttonY + buttonHeight,
                buttonX + buttonWidth - cornerRadius,
                buttonY + buttonHeight,
                cornerRadius
            );
            ctx.lineTo(buttonX + cornerRadius, buttonY + buttonHeight);
            ctx.arcTo(
                buttonX,
                buttonY + buttonHeight,
                buttonX,
                buttonY + buttonHeight - cornerRadius,
                cornerRadius
            );
            ctx.lineTo(buttonX, buttonY + cornerRadius);
            ctx.arcTo(
                buttonX,
                buttonY,
                buttonX + cornerRadius,
                buttonY,
                cornerRadius
            );
            ctx.closePath();

            ctx.fillStyle = bgColor;
            ctx.fill();
            ctx.strokeStyle = bgColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label text
            ctx.fillStyle = textColor;
            ctx.font = "bold 12px Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                name,
                buttonX + buttonWidth / 2,
                buttonY + buttonHeight / 2
            );

            // Restore context to original state
            ctx.restore();

            // Return modified image
            resolve(canvas.toDataURL("image/png"));
        };

        img.src = base64Image;
    });
}
