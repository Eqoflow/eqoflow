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
    <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto" style={{ background: '#11141b' }}>
      {/* Hidden audio element for remote audio output */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Screen share preview — shown prominently at the top when sharing */}
      <video
        ref={screenShareRef}
        autoPlay
        muted
        className="rounded-xl"
        style={{
          display: isSharing ? 'block' : 'none',
          width: '100%',
          maxHeight: '320px',
          background: '#000',
          border: '1px solid rgba(0,229,160,0.3)',
          marginBottom: '16px',
        }}
      />

      {/* Local video preview */}
      {isVideoOn && (
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="rounded-xl mb-6"
          style={{ width: '220px', background: '#000', border: '1px solid rgba(0,229,160,0.2)' }}
        />
      )}

      {/* Audio waveform visualizer */}
      <div className="mt-6 flex items-center justify-center gap-0.5" style={{ height: '48px' }}>
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
  );
}