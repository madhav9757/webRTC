import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react'; // Assuming you have lucide-react or a similar icon library

export default function VideoGrid({ localVideoRef, remoteVideoRef, name, remoteName }) {
    const [isRemoteVideoPlaying, setIsRemoteVideoPlaying] = useState(false);

    useEffect(() => {
        // Check if the remote video element is playing to show/hide the placeholder
        const remoteVideoElement = remoteVideoRef.current;
        if (remoteVideoElement) {
            const handlePlay = () => setIsRemoteVideoPlaying(true);
            const handlePause = () => setIsRemoteVideoPlaying(false);
            remoteVideoElement.addEventListener('play', handlePlay);
            remoteVideoElement.addEventListener('pause', handlePause);
            return () => {
                remoteVideoElement.removeEventListener('play', handlePlay);
                remoteVideoElement.removeEventListener('pause', handlePause);
            };
        }
    }, [remoteVideoRef]);

    // A helper to get initials from a name
    const getInitials = (userName) => {
        return userName?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[40vh] py-4">
            {/* Local Video - Always visible */}
            <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                />
                <div className="absolute top-2 left-2 flex items-center gap-2 p-1.5 bg-black/50 text-white rounded-md backdrop-blur-sm">
                    <Avatar className="w-6 h-6 border-2 border-white">
                        <AvatarFallback className="text-sm font-medium bg-blue-600 text-white">
                            {getInitials(name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs sm:text-sm font-medium">{name} (You)</span>
                </div>
            </div>

            {/* Remote Video - Dynamic content based on connection status */}
            <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
                {!isRemoteVideoPlaying && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white p-4">
                        <Avatar className="w-16 h-16 bg-gray-700">
                            <AvatarFallback className="bg-gray-600 text-gray-300">
                                <User className="w-10 h-10" />
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm md:text-md text-gray-300 font-medium text-center">
                            {remoteName ? `${remoteName} is connecting...` : "Waiting for another user..."}
                        </span>
                    </div>
                )}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-300 ${isRemoteVideoPlaying ? 'opacity-100' : 'opacity-0'}`}
                />
                {isRemoteVideoPlaying && (
                    <div className="absolute top-2 left-2 flex items-center gap-2 p-1.5 bg-black/50 text-white rounded-md backdrop-blur-sm">
                        <Avatar className="w-6 h-6 border-2 border-white">
                            <AvatarFallback className="text-sm font-medium bg-green-600 text-white">
                                {getInitials(remoteName)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs sm:text-sm font-medium">{remoteName}</span>
                    </div>
                )}
            </div>
        </div>
    );
}