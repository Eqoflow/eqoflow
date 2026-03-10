import React, { forwardRef } from 'react';

const RemoteParticipantVideo = forwardRef(({ participantName }, ref) => {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '16/9',
      background: '#000',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid rgba(0,229,160,0.2)',
    }}>
      <video
        ref={ref}
        autoPlay
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        fontSize: 12,
        color: '#fff',
        background: 'rgba(0,0,0,0.6)',
        padding: '4px 8px',
        borderRadius: 4,
      }}>
        {participantName}
      </div>
    </div>
  );
});

RemoteParticipantVideo.displayName = 'RemoteParticipantVideo';

export default RemoteParticipantVideo;