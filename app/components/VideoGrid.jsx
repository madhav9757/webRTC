import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card'; // Using Card for the container
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react'; 
import { Badge } from '@/components/ui/badge'; // Added Badge for clean name display

export default function VideoGrid({ localVideoRef, remoteVideoRef, name, remoteName }) {
    const [isRemoteVideoPlaying, setIsRemoteVideoPlaying] = useState(false);

    useEffect(() => {
        // Check if the remote video element is playing to show/hide the placeholder
        const remoteVideoElement = remoteVideoRef.current;
        if (remoteVideoElement) {
            const handlePlay = () => setIsRemoteVideoPlaying(true);
            const handlePause = () => setIsRemoteVideoPlaying(false);
            
            // Wait for media to load and play before considering it "playing"
            remoteVideoElement.addEventListener('loadeddata', handlePlay); 
            remoteVideoElement.addEventListener('play', handlePlay);
            remoteVideoElement.addEventListener('pause', handlePause);
            
            return () => {
                remoteVideoElement.removeEventListener('loadeddata', handlePlay);
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
        // Grid container with a dark background and spacing
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 pb-8">
            
            {/* Local Video - Always visible */}
            <div className="relative aspect-video bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    // Mirror local video and ensure it covers the area
                    className="absolute inset-0 w-full h-full object-cover rounded-xl scale-x-[-1]"
                />
                
                {/* Local Name Badge */}
                <div className="absolute top-4 left-4 z-10">
                    <Badge 
                        className="bg-black/60 backdrop-blur-sm border border-white/20 text-white/90 font-medium px-3 py-1.5 flex items-center gap-2"
                    >
                        {/* Monochromatic Avatar Fallback */}
                        <Avatar className="w-5 h-5 border border-white">
                            <AvatarFallback className="text-xs font-medium bg-slate-700 text-white">
                                {getInitials(name)}
                            </AvatarFallback>
                        </Avatar>
                        {name} (You)
                    </Badge>
                </div>
            </div>

            {/* Remote Video - Dynamic content based on stream status */}
            <div className="relative aspect-video bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
                
                {/* Remote Video Element */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-500 ${isRemoteVideoPlaying ? 'opacity-100' : 'opacity-0'}`}
                />
                
                {/* Placeholder/Status Overlay */}
                {!isRemoteVideoPlaying && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 p-4 transition-opacity duration-500">
                        {/* Monochromatic Avatar */}
                        <Avatar className="w-16 h-16 bg-slate-800 border border-slate-700 shadow-lg">
                            <AvatarFallback className="bg-slate-800 text-slate-400 text-2xl">
                                {remoteName ? getInitials(remoteName) : <User className="w-10 h-10" />}
                            </AvatarFallback>
                        </Avatar>
                        
                        <span className="text-base text-slate-400 font-semibold text-center">
                            {/* Use remoteName in the waiting message */}
                            {remoteName && remoteName !== 'Other User' 
                                ? `${remoteName} is connecting...` 
                                : "Waiting for another user..."
                            }
                        </span>
                    </div>
                )}
                
                {/* Remote Name Badge (Only visible when stream is playing) */}
                {isRemoteVideoPlaying && (
                    <div className="absolute top-4 left-4 z-10">
                        <Badge 
                            className="bg-black/60 backdrop-blur-sm border border-white/20 text-white/90 font-medium px-3 py-1.5 flex items-center gap-2"
                        >
                            <Avatar className="w-5 h-5 border border-white">
                                <AvatarFallback className="text-xs font-medium bg-slate-700 text-white">
                                    {getInitials(remoteName)}
                                </AvatarFallback>
                            </Avatar>
                            {remoteName}
                        </Badge>
                    </div>
                )}
            </div>
        </div>
    );
}