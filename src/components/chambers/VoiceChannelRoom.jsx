import React, { useEffect, useRef, useState } from 'react';

// Polyfill required by amazon-chime-sdk-js in browser environments
if (typeof window !== 'undefined') {
  if (typeof window.global === 'undefined') window.global = window;
  if (typeof window.process === 'undefined') window.process = { env: {}, browser: true };
}
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

export default function VoiceChannelRoom({ community, user, channel, onLeave, controlRef, onMuteChange, onVideoChange, onShareChange }) {
  const [status, setStatus] = useState('connecting'); // connecting | connected | error
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState(null);
  const [meetingId, setMeetingId] = useState(null);
  const [waveBars, setWaveBars] = useState(Array(20).fill(2));

  const sessionRef = useRef(null);
  const localVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

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
          const deviceId = audioInputs[0].deviceId;
          await session.audioVideo.startAudioInput(deviceId);

          // Set up Web Audio API analyser for waveform visualization
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId } });
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            audioCtxRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const animate = () => {
              animFrameRef.current = requestAnimationFrame(animate);
              analyser.getByteFrequencyData(dataArray);
              const bars = Array.from({ length: 20 }, (_, i) => {
                const idx = Math.floor(i * bufferLength / 20);
                return Math.max(2, (dataArray[idx] / 255) * 40);
              });
              setWaveBars(bars);
            };
            animate();
          } catch (e) {
            // visualizer optional, don't block on failure
          }
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
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [channel.id, community.id]);

  // Expose controls to parent via controlRef
  useEffect(() => {
    if (controlRef) {
      controlRef.current = {
        handleToggleMute: () => handleToggleMuteInner(),
        handleToggleVideo: () => handleToggleVideo(),
        handleToggleScreenShare: () => handleToggleScreenShare(),
        handleLeave: () => handleLeaveInner(),
      };
    }
  });

  const handleToggleMute = () => handleToggleMuteInner();

  const handleToggleMuteInner = () => {
    const session = sessionRef.current;
    if (!session || status !== 'connected') return;
    if (isMuted) {
      session.audioVideo.realtimeUnmuteLocalAudio();
    } else {
      session.audioVideo.realtimeMuteLocalAudio();
    }
    const next = !isMuted;
    setIsMuted(next);
    onMuteChange?.(next);
  };

  const handleToggleVideo = async () => {
    const session = sessionRef.current;
    if (!session) return;
    if (isVideoOn) {
      session.audioVideo.stopLocalVideoTile();
      await session.audioVideo.stopVideoInput();
      setIsVideoOn(false);
      onVideoChange?.(false);
    } else {
      const videoInputs = await session.audioVideo.listVideoInputDevices();
      if (videoInputs.length > 0) {
        await session.audioVideo.startVideoInput(videoInputs[0].deviceId);
        session.audioVideo.startLocalVideoTile();

        // Wait for the tile to be created then bind it to the video element
        const observer = {
          videoTileDidUpdate: (tileState) => {
            if (tileState.localTile && localVideoRef.current) {
              session.audioVideo.bindVideoElement(tileState.tileId, localVideoRef.current);
              session.audioVideo.removeObserver(observer);
            }
          },
        };
        session.audioVideo.addObserver(observer);

        setIsVideoOn(true);
        onVideoChange?.(true);
      }
    }
  };

  const handleToggleScreenShare = async () => {
    const session = sessionRef.current;
    if (!session) return;
    if (isSharing) {
      await session.audioVideo.stopContentShare();
      setIsSharing(false);
      onShareChange?.(false);
    } else {
      await session.audioVideo.startContentShareFromScreenCapture();

      // Bind the content share tile to the screen share video element
      const observer = {
        videoTileDidUpdate: (tileState) => {
          if (tileState.isContent && screenShareRef.current) {
            session.audioVideo.bindVideoElement(tileState.tileId, screenShareRef.current);
            session.audioVideo.removeObserver(observer);
          }
        },
      };
      session.audioVideo.addObserver(observer);

      setIsSharing(true);
      onShareChange?.(true);
    }
  };

  const handleLeaveInner = async () => {
    const session = sessionRef.current;
    if (session) session.audioVideo.stop();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close();
    onLeave();
  };

  const handleLeave = () => handleLeaveInner();

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#11141b' }}>
      {/* Hidden audio element for remote audio output */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Screen share — fills the main area when active */}
      {isSharing && (
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
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
        </div>
      )}

      {/* Main info area — centered when no screen share, compact strip when sharing */}
      <div
        className="flex flex-col items-center justify-center p-6"
        style={{ flex: isSharing ? '0 0 auto' : '1' }}
      >
        {/* Channel name */}
        <div className="mb-4 text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#00e5a0' }}>
            Voice Channel
          </p>
          <h2 className="text-white text-lg font-semibold">{channel.name}</h2>
        </div>

        {/* Status */}
        {status === 'connecting' && (
          <div className="flex items-center gap-2 mb-4" style={{ color: '#6b7280' }}>
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">Connecting...</span>
          </div>
        )}
        {status === 'error' && (
          <div className="mb-4 px-4 py-2 rounded-lg text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }}>
            {error || 'Failed to connect'}
          </div>
        )}
        {status === 'connected' && (
          <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: '#00e5a0' }}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Connected
          </div>
        )}

        {/* User avatar */}
        <div className="mb-4">
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
            className="rounded-xl mb-4"
            style={{ width: '220px', background: '#000', border: '1px solid rgba(0,229,160,0.2)' }}
          />
        )}

        {/* Audio waveform visualizer */}
        <div className="flex items-center justify-center gap-0.5" style={{ height: '48px' }}>
          {waveBars.map((h, i) => (
            <div
              key={i}
              style={{
                width: '3px',
                height: `${isMuted ? 2 : h}px`,
                background: isMuted ? 'rgba(107,114,128,0.3)' : `rgba(0,229,160,${0.4 + (h / 40) * 0.6})`,
                borderRadius: '2px',
                transition: 'height 0.05s ease, background 0.1s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}