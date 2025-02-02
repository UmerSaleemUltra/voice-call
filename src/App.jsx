import React, { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const VoiceCall = () => {
  const [client, setClient] = useState(null);
  const [joined, setJoined] = useState(false);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);

  useEffect(() => {
    // Create an Agora client
    const clientInstance = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    setClient(clientInstance);

    return () => {
      if (client) {
        client.leave().catch(console.error); // No need to call client.close()
      }
    };
  }, []);

  const joinChannel = async () => {
    if (client) {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
  
        await client.join("0bbc69f7ace547c1b26c3a60d07eb405", "test-channel", null, 0);
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([audioTrack]);
  
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
