import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function JoinForm({ name, setName, roomId, setRoomId, joinRoom }) {
    const handleSubmit = (e) => {
        e.preventDefault();
        joinRoom();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 bg-gray-50">
            <Card className="w-full max-w-sm rounded-lg shadow-lg bg-white p-6">
                <CardContent className="p-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-800">Join a Room</h2>
                            <p className="text-sm text-gray-500 mt-1">Enter your details to start the call.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 sr-only">Your Name</label>
                                <Input
                                    id="name"
                                    placeholder="Your Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 sr-only">Room ID</label>
                                <Input
                                    id="roomId"
                                    placeholder="Room ID"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                />
                            </div>
                        </div>
                        <Button
                            size="lg"
                            className="w-full font-semibold text-lg py-3 rounded-lg bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
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