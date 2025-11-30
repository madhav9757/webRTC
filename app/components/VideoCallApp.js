"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Copy, 
  Check,
  User,
  Loader, // Added for loading state
  LogOut // Added for end call button
} from "lucide-react";

let socket;
let peerConnection;

// Helper to get initials
const getInitials = (name) => {
  return name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || '?';
};

export default function VideoCallApp() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [remoteName, setRemoteName] = useState("");
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [copied, setCopied] = useState(false);
  const [remoteVideoAvailable, setRemoteVideoAvailable] = useState(false); // New state for remote stream
  const [isConnecting, setIsConnecting] = useState(false); // New state for media/WebRTC connection
  const [connectionStatus, setConnectionStatus] = useState("idle"); // 'idle', 'connecting', 'connected', 'disconnected'

  // --- Utility Functions ---

  const endCall = useCallback(() => {
    setConnectionStatus("disconnected");
    setRemoteName("");
    setRemoteVideoAvailable(false);
    
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    
    // Notify peer if socket is still active
    if (socket) {
      socket.emit("leave-room", { roomId });
      socket.disconnect();
    }
    
    if (peerConnection) {
      peerConnection.close();
    }

    setJoined(false);
    setLocalStream(null);
    setIsConnecting(false);
    // Force cleanup of video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, [localStream, roomId]);


  const joinRoom = async () => {
    if (!name.trim() || !roomId.trim()) {
      alert("Please enter your name and room ID");
      return;
    }
    setIsConnecting(true);
    setConnectionStatus("connecting");
    setRemoteName("Other User"); // Default while trying to connect

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
      setJoined(true);
      // Setup WebRTC and Socket.io after getting stream
      initializeCall(stream);

    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Could not access camera/microphone. Please check permissions.");
      setIsConnecting(false);
      setConnectionStatus("idle");
    }
  };


  const initializeCall = (stream) => {
    // 1. Initialize Socket.io
    socket = io("http://localhost:4000", { path: "/api/socketio" });

    // 2. Initialize RTCPeerConnection
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    // --- WebRTC Listeners ---

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, roomId });
      }
    };
    
    peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
            setConnectionStatus('connected');
            setIsConnecting(false);
        } else if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
            setConnectionStatus('disconnected');
            setRemoteName("Participant left");
            setRemoteVideoAvailable(false);
        }
    };


    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteVideoAvailable(true);
      }
    };

    // --- Socket.io Listeners ---

    socket.on("user-connected", async ({ name: otherName }) => {
      setRemoteName(otherName || "Other User");
      // Initiator creates offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("offer", { offer, roomId, name }); // Send local name
    });

    socket.on("offer", async ({ offer, name: otherName }) => {
      setRemoteName(otherName || "Other User");
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      // Receiver creates answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer", { answer, roomId, name }); // Send local name
    });

    socket.on("answer", async ({ answer, name: otherName }) => {
      setRemoteName(otherName || "Other User");
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      // Connection is established (or close to it)
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });
    
    socket.on("user-left", () => {
        setRemoteName("Participant left");
        setRemoteVideoAvailable(false);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    });


    // 3. Emit join-room
    socket.emit("join-room", { roomId, name });
  };


  // Cleanup Effect: Ensures resources are released on unmount or dependency change
  useEffect(() => {
    // This effect only cleans up when the component unmounts
    return () => {
        if (socket) {
            socket.emit("leave-room", { roomId });
            socket.disconnect();
        }
        if (peerConnection) {
            peerConnection.close();
        }
    };
  }, [roomId]);


  // Local Stream Effect: Display local video once stream is available
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // --- Control Functions ---

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn((prev) => !prev);
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // --- Rendering ---

  // Join Form (Updated styling for dark theme)
  if (!joined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Card className="w-full max-w-md p-8 shadow-2xl border-slate-800 bg-slate-900 text-white">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4 border border-slate-700">
                <Video className="w-8 h-8 text-white/90" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Join Call</h1>
              <p className="text-sm text-slate-400">
                Enter your details to start or join a video call
              </p>
            </div>

            <Separator className="bg-slate-700" />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-300">
                  Your Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-slate-500"
                  disabled={isConnecting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomId" className="text-sm font-medium text-slate-300">
                  Room ID
                </Label>
                <Input
                  id="roomId"
                  placeholder="Enter or create room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-slate-500"
                  disabled={isConnecting}
                />
              </div>
            </div>

            <Button
              onClick={joinRoom}
              className="w-full h-11 text-base font-medium bg-white text-slate-900 hover:bg-slate-200"
              size="lg"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Connecting...
                </div>
              ) : (
                "Start Call"
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Video Call Interface (Main View)
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-4">
          <Badge 
            variant="default" 
            className="gap-2 px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700"
          >
            <div 
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`} 
            />
            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </Badge>
          
          <div className="flex items-center text-sm text-slate-400">
            Room ID: <span className="font-semibold ml-1 text-white">{roomId}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={copyRoomId}
            className="gap-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Invite"}
          </Button>
        </div>
        
        <Badge className="gap-2 px-3 py-1.5 bg-slate-700 text-white">
          <User className="w-3 h-3" />
          {name} (You)
        </Badge>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Remote Video */}
        <Card className="relative overflow-hidden bg-slate-900 border-slate-800 shadow-xl aspect-video lg:min-h-[40vh]">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-500 ${remoteVideoAvailable ? 'opacity-100' : 'opacity-0'}`}
          />
          
          {(!remoteVideoAvailable || connectionStatus !== 'connected') && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
              <div className="text-center space-y-4">
                <Avatar className={`w-20 h-20 mx-auto ${remoteName ? 'bg-slate-800' : 'bg-slate-700'}`}>
                  <AvatarFallback className="bg-slate-800 text-slate-300 text-2xl">
                    {remoteName && remoteName !== 'Participant left' ? getInitials(remoteName) : <User className="w-10 h-10" />}
                  </AvatarFallback>
                </Avatar>
                <p className={`text-base font-medium ${connectionStatus === 'disconnected' ? 'text-red-400' : 'text-slate-400'}`}>
                  {remoteName === 'Participant left' ? 'Participant has left.' : 
                   connectionStatus === 'connected' ? 'Waiting for video stream...' : 
                   (remoteName || "Waiting for participant...")}
                </p>
              </div>
            </div>
          )}
          
          {remoteName && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-black/60 backdrop-blur-sm border-0 font-medium text-white/90">
                {remoteName}
              </Badge>
            </div>
          )}
        </Card>

        {/* Local Video */}
        <Card className="relative overflow-hidden bg-slate-900 border-slate-800 shadow-xl aspect-video lg:min-h-[40vh]">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}
          />
          
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-slate-800 text-slate-300 text-2xl">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          <div className="absolute top-4 left-4">
            <Badge className="bg-black/60 backdrop-blur-sm border-0 font-medium text-white/90">
              You
            </Badge>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="px-6 py-6 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center justify-center gap-4">
          
          {/* Mic Button */}
          <Button
            variant={isMuted ? "default" : "secondary"}
            size="lg"
            onClick={toggleMic}
            className={`w-14 h-14 rounded-full shadow-lg ${isMuted ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          {/* Camera Button */}
          <Button
            variant={isCameraOn ? "secondary" : "default"}
            size="lg"
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full shadow-lg ${!isCameraOn ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
          >
            {isCameraOn ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </Button>

          {/* End Call Button */}
          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            className="w-16 h-14 rounded-full bg-red-600 hover:bg-red-700 shadow-lg"
          >
            <LogOut className="w-5 h-5 mr-1" />
            <span className="sr-only">End Call</span>
          </Button>
        </div>
      </div>
    </div>
  );
}