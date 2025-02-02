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
      console.log(`User ${user.uid} published ${mediaType}`);
      await clientInstance.subscribe(user, mediaType);

      if (mediaType === "video") {
        setRemoteUsers((prevUsers) => {
          if (!prevUsers.find((u) => u.uid === user.uid)) {
            return [...prevUsers, user];
          }
          return prevUsers;
        });

        setTimeout(() => {
          const remoteContainer = document.getElementById(`remote-video-${user.uid}`);
          if (!remoteContainer) {
            console.error(`Remote video container not found for user ${user.uid}`);
            return;
          }
          user.videoTrack.play(`remote-video-${user.uid}`);
        }, 1000);
      }

      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    });

    clientInstance.on("user-unpublished", (user, mediaType) => {
      console.log(`User ${user.uid} unpublished ${mediaType}`);
      if (mediaType === "video") {
        setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
      }
    });

    return () => {
      if (clientInstance) {
        clientInstance.leave().catch(console.error);
      }
    };
  }, []);

  const generateRoomId = () => {
    setRoomId(Math.random().toString(36).substring(2, 10));
  };

  const joinRoom = async () => {
    if (client && roomId) {
      try {
        // Check if camera permissions are granted
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("Camera and microphone access granted.");

        await client.join("0bbc69f7ace547c1b26c3a60d07eb405", roomId, null, 0);

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        if (!videoTrack) {
          console.error("Video track creation failed!");
          return;
        }

        console.log("Video track created:", videoTrack);

        await client.publish([audioTrack, videoTrack]);

        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        setJoined(true);

        // Ensure the local video div exists before playing
        setTimeout(() => {
          const videoContainer = document.getElementById("local-video");
          if (!videoContainer) {
            console.error("Local video container not found!");
            return;
          }
          videoTrack.play("local-video");
        }, 500);
      } catch (error) {
        console.error("Error joining room:", error);
      }
    }
  };

  const leaveRoom = async () => {
    if (client) {
      console.log("Leaving room...");
      await client.leave();
      if (localAudioTrack) localAudioTrack.close();
      if (localVideoTrack) localVideoTrack.close();
      setJoined(false);
      setRemoteUsers([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          Agora Audio & Video Room
        </h1>

        {!joined ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter Room ID"
                className="px-4 py-2 rounded-lg text-black"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
              <button
                onClick={generateRoomId}
                className="bg-blue-500 hover:bg-blue-600 transition px-4 py-2 rounded-lg"
              >
                Create Room
              </button>
            </div>
            <button
              onClick={joinRoom}
              className="bg-green-500 hover:bg-green-600 transition px-6 py-2 rounded-lg"
            >
              Join Room
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <button
              onClick={leaveRoom}
              className="bg-red-500 hover:bg-red-600 transition px-6 py-2 rounded-lg"
            >
              Leave Room
            </button>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Local Video Container */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <div id="local-video" className="w-full h-64 bg-gray-800"></div>
                <p className="absolute bottom-0 left-0 bg-gray-800 text-xs px-2 py-1">
                  You
                </p>
              </div>

              {/* Remote Users Video Containers */}
              {remoteUsers.map((user) => (
                <div
                  key={user.uid}
                  className="relative bg-gray-800 rounded-lg overflow-hidden"
                >
                  <div
                    id={`remote-video-${user.uid}`}
                    className="w-full h-64 bg-gray-800"
                  ></div>
                  <p className="absolute bottom-0 left-0 bg-gray-800 text-xs px-2 py-1">
                    User: {user.uid}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgoraRoom;
