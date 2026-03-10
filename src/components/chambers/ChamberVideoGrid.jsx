import React from 'react';
import ChamberVideoTile from './ChamberVideoTile';
import { Mic, MicOff, Video, VideoOff, AlertCircle } from 'lucide-react';

export default function ChamberVideoGrid({
  participants,
  isVideoOn,
  isMuted,
  connectionStatus,
  error,
  onToggleVideo,
  onToggleMute,
  bindVideoElement,
  localUser,
}) {
  const visibleParticipants = participants.filter(p => p.isVideoOn);
  const colCount = Math.max(1, Math.ceil(Math.sqrt(visibleParticipants.length + 1)));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: '12px',
        padding: '12px',
      }}
    >
      {/* Error banner */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#fca5a5',
            fontSize: '12px',
          }}
        >
          <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Video grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: '12px',
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        {/* Local video */}
        {isVideoOn && (
          <div key="local">
            <ChamberVideoTile
              participant={{
                attendeeId: 'local',
                name: localUser?.full_name || 'You',
                avatarUrl: localUser?.avatar_url,
                isVideoOn: true,
                isMuted,
              }}
              isLocal={true}
              bindVideoElement={null}
            />
          </div>
        )}

        {/* Remote videos */}
        {visibleParticipants.map(participant => (
          <div key={participant.attendeeId}>
            <ChamberVideoTile
              participant={participant}
              isLocal={false}
              bindVideoElement={bindVideoElement}
            />
          </div>
        ))}
      </div>

      {/* Control bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '6px',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Mute button */}
        <button
          onClick={onToggleMute}
          disabled={connectionStatus !== 'connected'}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: 'none',
            background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            color: isMuted ? '#ef4444' : '#9ca3af',
            cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            if (connectionStatus === 'connected') {
              e.target.style.background = isMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.15)';
            }
          }}
          onMouseLeave={e => {
            e.target.style.background = isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)';
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <MicOff style={{ width: '16px', height: '16px' }} />
          ) : (
            <Mic style={{ width: '16px', height: '16px' }} />
          )}
          <span>{isMuted ? 'Muted' : 'Muted'}</span>
        </button>

        {/* Video button */}
        <button
          onClick={onToggleVideo}
          disabled={connectionStatus !== 'connected'}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: 'none',
            background: isVideoOn ? 'rgba(0, 229, 160, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            color: isVideoOn ? '#00e5a0' : '#9ca3af',
            cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            if (connectionStatus === 'connected') {
              e.target.style.background = isVideoOn ? 'rgba(0, 229, 160, 0.3)' : 'rgba(255, 255, 255, 0.15)';
            }
          }}
          onMouseLeave={e => {
            e.target.style.background = isVideoOn ? 'rgba(0, 229, 160, 0.2)' : 'rgba(255, 255, 255, 0.1)';
          }}
          title={isVideoOn ? 'Stop Video' : 'Start Video'}
        >
          {isVideoOn ? (
            <Video style={{ width: '16px', height: '16px' }} />
          ) : (
            <VideoOff style={{ width: '16px', height: '16px' }} />
          )}
          <span>{isVideoOn ? 'Camera On' : 'Camera Off'}</span>
        </button>

        {/* Status indicator */}
        <div style={{ marginLeft: 'auto', fontSize: '10px', color: '#6b7280' }}>
          {connectionStatus === 'connecting' && 'Connecting...'}
          {connectionStatus === 'connected' && `${visibleParticipants.length + (isVideoOn ? 1 : 0)} in call`}
          {connectionStatus === 'error' && 'Connection error'}
        </div>
      </div>
    </div>
  );
}