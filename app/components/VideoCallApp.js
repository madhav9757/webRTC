"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import JoinForm from "./JoinForm";
import VideoGrid from "./VideoGrid";
import VideoControls from "./VideoControls";

let socket;
let peerConnection;

export default function VideoCallApp() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [remoteName, setRemoteName] = useState("Other User");
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [localStream, setLocalStream] = useState(null);

  useEffect(() => {
    socket = io("http://localhost:4000", { path: "/api/socketio" });
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, roomId });
      }
    };

    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    socket.on("user-connected", async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("offer", { offer, roomId });
    });

    socket.on("offer", async ({ offer, name: otherName }) => {
      setRemoteName(otherName || "Other User");
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer", { answer, roomId });
    });

    socket.on("answer", async ({ answer }) => {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    return () => {
      socket.disconnect();
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [roomId]);

  // Add this new useEffect hook to handle the local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const joinRoom = async () => {
    if (!name.trim() || !roomId.trim()) {
      alert("Please enter your name and room ID");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));

      setLocalStream(stream); // This will trigger the new useEffect to display the video
      socket.emit("join-room", { roomId, name });
      setJoined(true);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Could not access camera/microphone. Please check permissions.");
    }
  };

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

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    peerConnection.close();
    setJoined(false);
    setLocalStream(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            🎥 WebRTC Video Call
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!joined ? (
            <JoinForm
              name={name}
              setName={setName}
              roomId={roomId}
              setRoomId={setRoomId}
              joinRoom={joinRoom}
            />
          ) : (
            <>
              <VideoGrid
                localVideoRef={localVideoRef}
                remoteVideoRef={remoteVideoRef}
                name={name}
                remoteName={remoteName}
                roomId={roomId}
              />
              <VideoControls
                isMuted={isMuted}
                isCameraOn={isCameraOn}
                toggleMic={toggleMic}
                toggleCamera={toggleCamera}
                endCall={endCall}
                roomId={roomId}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
