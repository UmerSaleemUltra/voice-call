import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const VoiceCall = () => {
  const [client, setClient] = useState(null);
  const [joined, setJoined] = useState(false);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);

  useEffect(() => {
    AgoraRTC.setLogLevel(0); // Enable debugging logs
    const clientInstance = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    setClient(clientInstance);

    clientInstance.on("user-published", async (user, mediaType) => {
      if (mediaType === "audio") {
        await clientInstance.subscribe(user, mediaType);
        const remoteAudioTrack = user.audioTrack;
        remoteAudioTrack.play(); // Play the remote user's audio
      }
    });

    return () => {
      if (client) {
        client.leave().catch(console.error);
      }
    };
  }, []);

  const joinChannel = async () => {
    if (client) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission

        await client.join(
          "0bbc69f7ace547c1b26c3a60d07eb405",
          "test-channel",
          null,
          0
        );
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        audioTrack.setEnabled(true);

        await client.publish(audioTrack);
        console.log("Audio track published:", audioTrack);

        setLocalAudioTrack(audioTrack);
        setJoined(true);
      } catch (error) {
        console.error("Error joining channel:", error);
      }
    }
  };

  const leaveChannel = async () => {
    if (client && localAudioTrack) {
      try {
        await client.leave();
        localAudioTrack.stop();
        localAudioTrack.close();
        setJoined(false);
      } catch (error) {
        console.error("Error leaving channel:", error);
      }
    }
  };

  return (
    <div>
      {!joined ? (
        <button onClick={joinChannel}>Join Voice Call</button>
      ) : (
        <button onClick={leaveChannel}>Leave Voice Call</button>
      )}
    </div>
  );
};

export default VoiceCall;
