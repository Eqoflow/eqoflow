import React, { useEffect, useRef, useState } from 'react';
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from 'amazon-chime-sdk-js';
import { createChimeMeeting } from '@/functions/createChimeMeeting';
import { endChimeMeeting } from '@/functions/endChimeMeeting';
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Loader } from 'lucide-react';

export default function VoiceChannelRoom({ community, user, channel, onLeave }) {
  const [status, setStatus] = useState('connecting'); // connecting | connected | error
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState(null);
  const [meetingId, setMeetingId] = useState(null);

  const sessionRef = useRef(null);
  const localVideoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let session = null;

    const join = async () => {
      try {
        setStatus('connecting');
        const { data } = await createChimeMeeting({
          communityId: community.id,
          channelId: channel.id,
        });

        if (data.error) throw new Error(data.error);

        setMeetingId(data.meeting.MeetingId);

        const logger = new ConsoleLogger('ChimeMeeting', LogLevel.WARN);
        const deviceController = new DefaultDeviceController(logger);
        const config = new MeetingSessionConfiguration(data.meeting, data.attendee);
        session = new DefaultMeetingSession(config, logger, deviceController);
        sessionRef.current = session;

        // Bind audio output element
        if (audioRef.current) {
          session.audioVideo.bindAudioElement(audioRef.current);
        }

        // Start audio input
        const audioInputs = await session.audioVideo.listAudioInputDevices();
        if (audioInputs.length > 0) {
          await session.audioVideo.startAudioInput(audioInputs[0].deviceId);
        }

        session.audioVideo.start();
        setStatus('connected');
      } catch (err) {
        console.error('Chime join error:', err);
        setError(err.message);
        setStatus('error');
      }
    };

    join();

    return () => {
      if (session) {
        session.audioVideo.stop();
      }
    };
  }, [channel.id, community.id]);

  const handleToggleMute = () => {
    const session = sessionRef.current;
    if (!session) return;
    if (isMuted) {
      session.audioVideo.realtimeUnmuteLocalAudio();
    } else {
      session.audioVideo.realtimeMuteLocalAudio();
    }
    setIsMuted(v => !v);
  };

  const handleToggleVideo = async () => {
    const session = sessionRef.current;
    if (!session) return;
    if (isVideoOn) {
      session.audioVideo.stopLocalVideoTile();
      setIsVideoOn(false);
    } else {
      const videoInputs = await session.audioVideo.listVideoInputDevices();
      if (videoInputs.length > 0) {
        await session.audioVideo.startVideoInput(videoInputs[0].deviceId);
        session.audioVideo.startLocalVideoTile();
        setIsVideoOn(true);
      }
    }
  };

  const handleToggleScreenShare = async () => {
    const session = sessionRef.current;
    if (!session) return;
    if (isSharing) {
      await session.audioVideo.stopContentShare();
      setIsSharing(false);
    } else {
      await session.audioVideo.startContentShareFromScreenCapture();
      setIsSharing(true);
    }
  };

  const handleLeave = async () => {
    const session = sessionRef.current;
    if (session) {
      session.audioVideo.stop();
    }
    onLeave();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6" style={{ background: '#11141b' }}>
      {/* Hidden audio element for remote audio output */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Channel name */}
      <div className="mb-6 text-center">
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#00e5a0' }}>
          Voice Channel
        </p>
        <h2 className="text-white text-lg font-semibold">{channel.name}</h2>
      </div>

      {/* Status */}
      {status === 'connecting' && (
        <div className="flex items-center gap-2 mb-6" style={{ color: '#6b7280' }}>
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">Connecting...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 px-4 py-2 rounded-lg text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }}>
          {error || 'Failed to connect'}
        </div>
      )}

      {status === 'connected' && (
        <div className="mb-6 flex items-center gap-2 text-sm" style={{ color: '#00e5a0' }}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Connected
        </div>
      )}

      {/* User avatar */}
      <div className="mb-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(0,229,160,0.15)',
            border: `2px solid ${isMuted ? '#ef4444' : '#00e5a0'}`
          }}
        >
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            : <span className="text-2xl font-bold text-white">{user.full_name?.[0]}</span>}
        </div>
        <p className="text-center text-xs mt-2" style={{ color: '#6b7280' }}>
          {user.full_name?.split(' ')[0]}
          {isMuted && <span className="ml-1 text-red-400">(muted)</span>}
        </p>
      </div>

      {/* Local video preview */}
      {isVideoOn && (
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="rounded-xl mb-6"
          style={{ width: '320px', background: '#000', border: '1px solid rgba(0,229,160,0.2)' }}
        />
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggleMute}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
          style={{
            background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)'}`
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5 text-white" />}
        </button>

        <button
          onClick={handleToggleVideo}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
          style={{
            background: isVideoOn ? 'rgba(0,229,160,0.15)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${isVideoOn ? '#00e5a0' : 'rgba(255,255,255,0.1)'}`
          }}
          title={isVideoOn ? 'Stop Video' : 'Start Video'}
        >
          {isVideoOn
            ? <Video className="w-5 h-5" style={{ color: '#00e5a0' }} />
            : <VideoOff className="w-5 h-5 text-white" />}
        </button>

        <button
          onClick={handleToggleScreenShare}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
          style={{
            background: isSharing ? 'rgba(0,229,160,0.15)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${isSharing ? '#00e5a0' : 'rgba(255,255,255,0.1)'}`
          }}
          title={isSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          <Monitor className="w-5 h-5" style={{ color: isSharing ? '#00e5a0' : 'white' }} />
        </button>

        <button
          onClick={handleLeave}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444' }}
          title="Leave Voice"
        >
          <PhoneOff className="w-5 h-5 text-red-400" />
        </button>
      </div>
    </div>
  );
}