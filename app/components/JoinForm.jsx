"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Hash } from "lucide-react";

export default function JoinForm({ name, setName, roomId, setRoomId, joinRoom }) {
    const handleSubmit = (e) => {
        e.preventDefault();
        joinRoom();
    };

    return (
        <div className="flex justify-center items-center min-h-[60vh] px-4">
            <Card className="w-full max-w-sm backdrop-blur-xl bg-white/60 dark:bg-zinc-900/60 border border-white/30 shadow-xl rounded-2xl">
                <CardContent className="p-6">
                    
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                            Join a Room
                        </h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Enter your details to start the call.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Room ID */}
                        <div className="space-y-2">
                            <Label htmlFor="roomId">Room ID</Label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="roomId"
                                    placeholder="Enter room code"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    required
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="w-full text-lg rounded-xl mt-2 bg-blue-600 hover:bg-blue-700 transition-all"
                            type="submit"
                        >
                            Start Call
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
