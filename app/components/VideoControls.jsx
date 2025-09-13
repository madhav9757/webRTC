import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

export default function VideoControls({
    isMuted,
    isCameraOn,
    toggleMic,
    toggleCamera,
    endCall,
    roomId,
}) {
    return (
        <div className="mt-8 flex flex-col items-center">
            {/* Connection Status */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
                <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Connected to room <span className="font-semibold ml-1 text-gray-700">{roomId}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 bg-white/70 backdrop-blur-md px-5 py-3 rounded-full shadow-lg border border-gray-100">
                {/* Mic Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMic}
                    className={`rounded-full transition-colors duration-200 ${isMuted ? "bg-red-500 hover:bg-red-600 text-white" : "hover:bg-gray-200 text-gray-700"
                        }`}
                >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                {/* Camera Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCamera}
                    className={`rounded-full transition-colors duration-200 ${!isCameraOn ? "bg-red-500 hover:bg-red-600 text-white" : "hover:bg-gray-200 text-gray-700"
                        }`}
                >
                    {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>

                {/* End Call Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={endCall}
                    className="rounded-full bg-red-500 hover:bg-red-600 text-white transition-transform duration-200 scale-100 hover:scale-110"
                >
                    <PhoneOff className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}