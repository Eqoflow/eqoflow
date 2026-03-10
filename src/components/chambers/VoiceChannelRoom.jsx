import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';
import { useChamberWebRTC } from './hooks/useChamberWebRTC';
import ChamberVideoGrid from './ChamberVideoGrid';
import VoiceChannelChat from './VoiceChannelChat';

const RING_RADIUS = 110;
const CONTAINER_SIZE = 310;
const CENTER = CONTAINER_SIZE / 2;
const AVATAR_SIZE = 54;

function ParticipantNode({ participant }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: AVATAR_SIZE + 24 }}>
      <div
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: '50%',
          border: `2px solid ${participant.isSpeaking ? '#00e5a0' : participant.isMuted ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
          boxShadow: participant.isSpeaking
            ? '0 0 0 4px rgba(0,229,160,0.2), 0 0 16px rgba(0,229,160,0.7)'
            : 'none',
          overflow: 'hidden',
          background: '#0e1118',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          flexShrink: 0,
        }}
      >
        {participant.avatarUrl
          ? <img src={participant.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 20,
              background: 'linear-gradient(135deg, #1a2540, #0e1118)',
            }}>
              {participant.name?.[0]?.toUpperCase()}
            </div>
          )
        }
      </div>
      <p style={{
        color: participant.isSpeaking ? '#00e5a0' : '#9ca3af',
        fontSize: 10,
        marginTop: 5,
        textAlign: 'center',
        maxWidth: AVATAR_SIZE + 24,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        transition: 'color 0.15s',
      }}>
        {participant.name}
        {participant.isMuted && <span style={{ color: '#ef4444' }}> 🔇</span>}
      </p>
      {participant.isSpeaking && (
        <div style={{ display: 'flex', gap: '2px', marginTop: 3, alignItems: 'flex-end', height: 12 }}>
          {[5, 9, 7, 11, 6, 10, 8].map((h, i) => (
            <div key={i} style={{
              width: 2,
              height: h,
              background: '#00e5a0',
              borderRadius: 2,
              animation: `speakPulse ${0.4 + i * 0.07}s ease-in-out infinite alternate`,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}



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