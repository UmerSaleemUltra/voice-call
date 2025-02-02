import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const AgoraRoom = () => {
  const [client, setClient] = useState(null);
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);

  useEffect(() => {
    const clientInstance = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    setClient(clientInstance);

    clientInstance.on("user-published", async (user, mediaType) => {
      await clientInstance.subscribe(user, mediaType);

      if (mediaType === "video") {
        setRemoteUsers((prevUsers) => [...prevUsers, user]);
        setTimeout(() => {
          document.getElementById(`remote-video-${user.uid}`)?.appendChild(user.videoTrack.getMediaStreamTrack());
        }, 1000);
      }
      if (mediaType === "audio") user.audioTrack.play();
    });

    clientInstance.on("user-unpublished", (user) => {
      setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
    });

    return () => clientInstance.leave().catch(console.error);
  }, []);

  const generateRoomId = () => {
    setRoomId(Math.random().toString(36).substring(2, 10));
  };

  const joinRoom = async () => {
    if (client && roomId) {
      try {
        await client.join("0bbc69f7ace547c1b26c3a60d07eb405", roomId, null, 0);
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        await client.publish([audioTrack, videoTrack]);
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        setJoined(true);

        setTimeout(() => {
          document.getElementById("local-video")?.appendChild(videoTrack.getMediaStreamTrack());
        }, 500);
      } catch (error) {
        console.error("Error joining room:", error);
      }
    }
  };

  const leaveRoom = async () => {
    if (client) {
      await client.leave();
      localAudioTrack?.close();
      localVideoTrack?.close();
      setJoined(false);
      setRemoteUsers([]);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-center mb-6">Agora Video Chat</h1>

      {!joined ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-2">
            <input
              type="text"
              placeholder="Enter Room ID"
              className="px-4 py-2 rounded-lg border border-gray-300 w-full md:w-60"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button
              onClick={generateRoomId}
              className="bg-blue-500 hover:bg-blue-600 text-white transition px-4 py-2 rounded-lg w-full md:w-auto"
            >
              Create Room
            </button>
          </div>
          <button
            onClick={joinRoom}
            className="bg-green-500 hover:bg-green-600 text-white transition px-6 py-2 rounded-lg w-full md:w-auto"
          >
            Join Room
          </button>
        </div>
      ) : (
        <div className="w-full max-w-5xl">
          <button
            onClick={leaveRoom}
            className="bg-red-500 hover:bg-red-600 text-white transition px-6 py-2 rounded-lg w-full md:w-auto mb-6"
          >
            Leave Room
          </button>

          {/* Video Containers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Video */}
            <div className="relative bg-gray-100 border border-gray-300 rounded-lg overflow-hidden shadow-md">
              <div id="local-video" className="w-full h-64 bg-gray-200"></div>
              <p className="absolute bottom-0 left-0 bg-gray-300 text-xs px-2 py-1">
                You
              </p>
            </div>

            {/* Remote Users */}
            {remoteUsers.length > 0 ? (
              remoteUsers.map((user) => (
                <div
                  key={user.uid}
                  className="relative bg-gray-100 border border-gray-300 rounded-lg overflow-hidden shadow-md"
                >
                  <div id={`remote-video-${user.uid}`} className="w-full h-64 bg-gray-200"></div>
                  <p className="absolute bottom-0 left-0 bg-gray-300 text-xs px-2 py-1">
                    User: {user.uid}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 col-span-1 md:col-span-2">
                No remote users yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgoraRoom;
