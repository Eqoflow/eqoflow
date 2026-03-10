import React, { useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function ChamberVideoTile({
  participant,
  isLocal = false,
  bindVideoElement = null,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (bindVideoElement && participant.attendeeId && videoRef.current) {
      bindVideoElement(participant.attendeeId, videoRef.current);
    }
  }, [bindVideoElement, participant.attendeeId]);

  const displayName = participant.name || 'Guest';
  const avatarUrl = participant.avatarUrl;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        background: '#000',
        borderRadius: '8px',
        border: '1px solid rgba(0, 229, 160, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {participant.isVideoOn ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted={isLocal}
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Overlay for name and status */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              padding: '12px',
              color: '#fff',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 600 }}>{displayName}</span>
              {participant.isMuted && (
                <MicOff style={{ width: '14px', height: '14px', color: '#ef4444' }} />
              )}
              {participant.isSpeaking && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#00e5a0',
                  }}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '24px',
                fontWeight: 600,
              }}
            >
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#e5e7eb', fontSize: '12px', fontWeight: 600, margin: 0 }}>
              {displayName}
            </p>
            <p style={{ color: '#6b7280', fontSize: '10px', margin: '4px 0 0 0' }}>
              Camera off
            </p>
          </div>
        </div>
      )}
    </div>
  );
}