"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check, User, VideoIcon
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

let socket;
let peerConnection;

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
  const [isConnected, setIsConnected] = useState(false);

  /* -------------------------------------------
      SOCKET & WEBRTC SETUP
  ------------------------------------------- */
  useEffect(() => {
    socket = io("http://localhost:4000", { path: "/api/socketio" });
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate)
        socket.emit("ice-candidate", { candidate: event.candidate, roomId });
    };

    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsConnected(true);
      }
    };

    socket.on("user-connected", async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("offer", { offer, roomId });
    });

    socket.on("offer", async ({ offer, name: otherName }) => {
      setRemoteName(otherName || "Guest");
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer", { answer, roomId });
    });

    socket.on("answer", async ({ answer }) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    });

    return () => {
      socket.disconnect();
      peerConnection.close();
    };
  }, [roomId]);

  useEffect(() => {
    if (localVideoRef.current && localStream)
      localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  /* -------------------------------------------
      JOIN ROOM
  ------------------------------------------- */
  const joinRoom = async () => {
    if (!name.trim() || !roomId.trim()) return alert("Enter name & room ID");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      stream.getTracks().forEach((track) =>
        peerConnection.addTrack(track, stream)
      );

      setLocalStream(stream);
      socket.emit("join-room", { roomId, name });
      setJoined(true);
    } catch {
      alert("Camera/Mic permission denied.");
    }
  };

  /* -------------------------------------------
      TOGGLES
  ------------------------------------------- */
  const toggleMic = () => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMuted((p) => !p);
  };

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsCameraOn((p) => !p);
  };

  const endCall = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    peerConnection.close();
    setJoined(false);
    setLocalStream(null);
    setIsConnected(false);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  /* -------------------------------------------
      JOIN SCREEN (BEFORE CONNECT)
  ------------------------------------------- */
  if (!joined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <Card className="w-full max-w-md p-8 border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl rounded-2xl">
          <div className="space-y-6">

            {/* Icon */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <VideoIcon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">
                Join a Call
              </h1>
              <p className="text-slate-400 text-sm">
                Enter your details to start a secure 1-1 call.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* NAME */}
            <div className="space-y-2">
              <Label className="text-white/90">Your Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="h-12 bg-white/10 border-white/20 text-white"
              />
            </div>

            {/* ROOM */}
            <div className="space-y-2">
              <Label className="text-white/90">Room ID</Label>
              <Input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter or create room ID"
                className="h-12 bg-white/10 border-white/20 text-white"
              />
            </div>

            <Button
              onClick={joinRoom}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-medium shadow-lg"
            >
              Join Room
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  /* -------------------------------------------
      CALL SCREEN
  ------------------------------------------- */
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3">
          <Badge className="px-3 py-1.5 bg-blue-600/20 border-blue-600/30 text-blue-300">
            Room: {roomId}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={copyRoomId}
            className="text-white/70 hover:text-white gap-2"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <Badge variant="outline" className="border-white/20 text-white/80 gap-2">
          <User size={14} /> {name}
        </Badge>
      </div>

      {/* VIDEO GRID */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* REMOTE */}
        <Card className="relative aspect-video overflow-hidden bg-black/40 border border-white/10 rounded-2xl backdrop-blur-xl">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md">
              <div className="text-center space-y-3">
                <Avatar className="w-20 h-20 mx-auto">
                  <AvatarFallback className="bg-slate-800 text-slate-300 text-2xl">
                    {getInitials(remoteName)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-slate-400">{remoteName || "Waiting..."}</p>
              </div>
            </div>
          )}
        </Card>

        {/* LOCAL */}
        <Card className="relative aspect-video overflow-hidden bg-black/40 border border-white/10 rounded-2xl backdrop-blur-xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />

          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md">
              <Avatar className="w-20 h-20">
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
            </div>
          )}

          <div className="absolute bottom-4 left-4">
            <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              You
            </Badge>
          </div>
        </Card>
      </div>

      {/* CONTROLS */}
      <div className="flex justify-center py-6 bg-slate-900/80 border-t border-white/10 backdrop-blur-xl">

        <div className="flex gap-6 bg-white/5 px-8 py-4 rounded-full border border-white/10 shadow-xl backdrop-blur-2xl">

          <Button
            onClick={toggleMic}
            size="icon"
            className={`w-14 h-14 rounded-full shadow-lg backdrop-blur-md
            ${isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"}`}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Button>

          <Button
            onClick={toggleCamera}
            size="icon"
            className={`w-14 h-14 rounded-full shadow-lg backdrop-blur-md
            ${!isCameraOn ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"}`}
          >
            {isCameraOn ? <Video /> : <VideoOff />}
          </Button>

          <Button
            onClick={endCall}
            size="icon"
            className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl hover:scale-110 transition"
          >
            <PhoneOff />
          </Button>
        </div>

      </div>
    </div>
  );
}
