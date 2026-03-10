import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';
import { useChamberWebRTC } from './hooks/useChamberWebRTC';
import ChamberVideoGrid from './ChamberVideoGrid';
import VoiceChannelChat from './VoiceChannelChat';



export default function VoiceChannelRoom({ community, user, channel, onLeave, controlRef, onMuteChange, onVideoChange, onShareChange, channelSettings = {}, isCreator = false, participants = [], memberProfiles = [], onUpdateParticipants = null }) {
  const webrtc = useChamberWebRTC(community.id, user);
  const [isSharing, setIsSharing] = useState(false);
  const [remoteShareActive, setRemoteShareActive] = useState(false);
  const [error, setError] = useState(null);
  const [waveBars, setWaveBars] = useState(Array(20).fill(2));

  // Sync with parent control ref
  useEffect(() => {
    if (controlRef) {
      controlRef.current = {
        handleToggleMute: webrtc.toggleMute,
        handleToggleVideo: webrtc.toggleVideo,
        handleToggleScreenShare: () => handleToggleScreenShare(),
        handleLeave: onLeave,
      };
    }
  }, [webrtc, controlRef, onLeave]);

  // Sync video state with parent callbacks
  useEffect(() => {
    onVideoChange?.(webrtc.isVideoOn);
  }, [webrtc.isVideoOn, onVideoChange]);

  useEffect(() => {
    onMuteChange?.(webrtc.isMuted);
  }, [webrtc.isMuted, onMuteChange]);

  const localVideoShareRef = useRef(null);
  const screenShareRef = useRef(null);
  const remoteScreenShareRef = useRef(null);

  const handleToggleScreenShare = async () => {
    const session = webrtc.sessionRef?.current;
    if (!session) return;
    if (isSharing) {
      await session.audioVideo.stopContentShare();
      setIsSharing(false);
      onShareChange?.(false);
    } else {
      await session.audioVideo.startContentShareFromScreenCapture();
      const observer = {
        videoTileDidUpdate: (tileState) => {
          if (tileState.isContent && screenShareRef.current) {
            session.audioVideo.bindVideoElement(tileState.tileId, screenShareRef.current);
          }
        },
      };
      session.audioVideo.addObserver(observer);
      setIsSharing(true);
      onShareChange?.(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#11141b' }}>

      {!isSharing && !remoteShareActive ? (
        <ChamberVideoGrid
          participants={webrtc.participants}
          isVideoOn={webrtc.isVideoOn}
          isMuted={webrtc.isMuted}
          connectionStatus={webrtc.connectionStatus}
          error={webrtc.error}
          onToggleVideo={webrtc.toggleVideo}
          onToggleMute={webrtc.toggleMute}
          bindVideoElement={webrtc.bindVideoElement}
          localUser={user}
        />
      ) : (
        <>
          {remoteShareActive && (
            <div style={{ flex: 1, position: 'relative', padding: 12, overflow: 'hidden' }}>
              <video
                ref={remoteScreenShareRef}
                autoPlay
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  background: '#000',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,229,160,0.3)',
                }}
              />
            </div>
          )}
          {isSharing && (
            <div style={{ flex: 1, position: 'relative', padding: 12, overflow: 'hidden' }}>
              <video
                ref={screenShareRef}
                autoPlay
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  background: '#000',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,229,160,0.3)',
                }}
              />
              {webrtc.isVideoOn && (
                <video
                  ref={localVideoShareRef}
                  autoPlay
                  muted
                  style={{
                    position: 'absolute',
                    bottom: 24,
                    left: 24,
                    width: 160,
                    borderRadius: 8,
                    background: '#000',
                    border: '2px solid rgba(0,229,160,0.5)',
                    zIndex: 10,
                  }}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}