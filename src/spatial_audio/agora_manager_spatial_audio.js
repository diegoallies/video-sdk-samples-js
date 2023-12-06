import AgoraManager from "../agora_manager/agora_manager.js";
import AgoraRTC from "agora-rtc-sdk-ng";
import { SpatialAudioExtension } from "agora-extension-spatial-audio";

const AgoraManagerSpatialAudio = async (eventsCallback) => {
  // Extend the AgoraManager by importing it
  const agoraManager = await AgoraManager(eventsCallback);

  // Get the config
  const config = agoraManager.config;
  const processors = new Map();
  const spatialAudioExtension = new SpatialAudioExtension({
    assetsPath: "/node_modules/agora-extension-spatial-audio/external/",
  });

  // Enable spatial audio
  AgoraRTC.registerExtensions([spatialAudioExtension]);

  const mockLocalUserNewPosition = {
    // In a production app, the position can be generated by
    // dragging the local user's avatar in a 3D scene.
    position: [1, 1, 1], // Coordinates in the world coordinate system
    forward: [1, 0, 0], // The unit vector of the front axis
    right: [0, 1, 0], // The unit vector of the right axis
    up: [0, 0, 1], // The unit vector of the vertical axis
  };

  spatialAudioExtension.updateSelfPosition(
    mockLocalUserNewPosition.position,
    mockLocalUserNewPosition.forward,
    mockLocalUserNewPosition.right,
    mockLocalUserNewPosition.up
  );

  function updatePosition(distance, channelParameters) {
    if (isMediaPlaying) {
      const processor = processors.get("media-player");
      processor.updatePlayerPositionInfo({
        position: [distance, 0, 0],
        forward: [1, 0, 0],
      });
    } else {
      const processor = processors.get(channelParameters.remoteUid);
      processor.updateRemotePosition({
        position: [distance, 0, 0],
        forward: [1, 0, 0],
      });
    }
  }

  const playMediaWithSpatialAudio = async () => {
    const processor = spatialAudioExtension.createProcessor();
    processors.set("media-player", processor);

    const track = await AgoraRTC.createBufferSourceAudioTrack({
      source: "./sample.mp3",
    });

    // Define the spatial position for the local audio player.
    const mockLocalPlayerNewPosition = {
      position: [0, 0, 0],
      forward: [0, 0, 0],
    };

    // Update the spatial position for the local audio player.
    processor.updatePlayerPositionInfo(mockLocalPlayerNewPosition);

    track.startProcessAudioBuffer({ loop: true });
    track.pipe(processor).pipe(track.processorDestination);
    track.play();
    return track;
  };

  // Return the extended agora manager
  return {
    ...agoraManager,
    processors,
    updatePosition,
    playMediaWithSpatialAudio,
  };
};

export default AgoraManagerSpatialAudio;