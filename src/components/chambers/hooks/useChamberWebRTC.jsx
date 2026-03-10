import { useState, useEffect, useRef, useCallback } from 'react';
import { createChimeMeeting } from '@/functions/createChimeMeeting';
import {
  ConsoleLogger,
  DefaultActiveSpeakerPolicy,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from 'amazon-chime-sdk-js';

// Polyfill for Chime SDK in browser
if (typeof window !== 'undefined') {
  if (typeof window.global === 'undefined') window.global = window;
  if (typeof window.process === 'undefined') window.process = { env: {}, browser: true };
}

export function useChamberWebRTC(chamberId, user) {
  const [participants, setParticipants] = useState([]);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, connecting, connected, error
  const [error, setError] = useState(null);
  const [waveBars, setWaveBars] = useState(Array(20).fill(2));
  const [speakingIds, setSpeakingIds] = useState(new Set());

  const sessionRef = useRef(null);
  const localAttendeeIdRef = useRef(null);
  const videoTilesRef = useRef({}); // { attendeeId: { tileId, mediaStream } }
  const localVideoTrackRef = useRef(null);
  const audioInputRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Initialize Chime session
  useEffect(() => {
    const initSession = async () => {
      try {
        setConnectionStatus('connecting');
        setError(null);

        // Create meeting via Chime
        const { data } = await createChimeMeeting({
          communityId: chamberId,
          channelId: `chamber-${chamberId}`,
        });

        if (data.error) {
          throw new Error(data.error);
        }

        localAttendeeIdRef.current = data.attendee.AttendeeId;

        // Setup Chime session
        const logger = new ConsoleLogger('ChamberWebRTC', LogLevel.WARN);
        const deviceController = new DefaultDeviceController(logger);
        const config = new MeetingSessionConfiguration(data.meeting, data.attendee);
        const session = new DefaultMeetingSession(config, logger, deviceController);

        sessionRef.current = session;

        // Start audio/video
        const audioInputs = await session.audioVideo.listAudioInputDevices();
        if (audioInputs.length > 0) {
          await session.audioVideo.startAudioInput(audioInputs[0].deviceId);
          audioInputRef.current = audioInputs[0].deviceId;
        }

        session.audioVideo.start();

        // Setup audio visualization
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: audioInputs[0].deviceId } });
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
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
          // Graceful fallback if audio access fails
        }

        // Track remote attendees
        session.audioVideo.realtimeSubscribeToAttendeeIdPresence((attendeeId, present) => {
          if (attendeeId === localAttendeeIdRef.current) return;
          if (attendeeId.endsWith('#content')) return;

          if (present) {
            setParticipants(prev => {
              if (prev.find(p => p.attendeeId === attendeeId)) return prev;
              return [...prev, {
                attendeeId,
                userId: null,
                name: 'Guest',
                avatarUrl: null,
                isVideoOn: false,
                isMuted: false,
                videoTrack: null,
              }];
            });
          } else {
            setParticipants(prev => prev.filter(p => p.attendeeId !== attendeeId));
            delete videoTilesRef.current[attendeeId];
          }
        });

        // Track active speakers
        session.audioVideo.subscribeToActiveSpeakerDetector(
          new DefaultActiveSpeakerPolicy(),
          (activeSpeakers) => {
            setSpeakingIds(new Set(activeSpeakers));
            setParticipants(prev =>
              prev.map(p => ({
                ...p,
                isSpeaking: activeSpeakers.includes(p.attendeeId),
              }))
            );
          }
        );

        // Handle video tiles
        const tileObserver = {
          videoTileDidUpdate: (tileState) => {
            if (!tileState.tileId) return;

            const attendeeId = tileState.attendeeId;

            // Skip local and content shares
            if (tileState.localTile || tileState.isContent) return;

            // Remote participant video
            if (attendeeId) {
              videoTilesRef.current[attendeeId] = {
                tileId: tileState.tileId,
                attendeeId,
              };

              setParticipants(prev =>
                prev.map(p =>
                  p.attendeeId === attendeeId
                    ? { ...p, isVideoOn: true }
                    : p
                )
              );
            }
          },

          videoTileWasRemoved: (tileId) => {
            // Find and mark participant as no video
            Object.entries(videoTilesRef.current).forEach(([attendeeId, tile]) => {
              if (tile.tileId === tileId) {
                delete videoTilesRef.current[attendeeId];
                setParticipants(prev =>
                  prev.map(p =>
                    p.attendeeId === attendeeId
                      ? { ...p, isVideoOn: false }
                      : p
                  )
                );
              }
            });
          },
        };

        session.audioVideo.addObserver(tileObserver);
        setConnectionStatus('connected');
      } catch (err) {
        console.error('Failed to initialize Chime session:', err);
        setError(err.message);
        setConnectionStatus('error');
      }
    };

    initSession();

    return () => {
      if (sessionRef.current) {
        sessionRef.current.audioVideo.stop();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [chamberId]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || connectionStatus !== 'connected') return;

    try {
      if (isVideoOn) {
        await session.audioVideo.stopLocalVideoTile();
        await session.audioVideo.stopVideoInput();
        localVideoTrackRef.current = null;
        setIsVideoOn(false);
      } else {
        const videoInputs = await session.audioVideo.listVideoInputDevices();
        if (videoInputs.length > 0) {
          await session.audioVideo.startVideoInput(videoInputs[0].deviceId);
          session.audioVideo.startLocalVideoTile();

          setParticipants(prev => {
            const updated = [...prev];
            // Update local participant if in list
            return updated;
          });

          setIsVideoOn(true);
        }
      }
    } catch (err) {
      console.error('Error toggling video:', err);
      setError(err.message);
    }
  }, [isVideoOn, connectionStatus]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const session = sessionRef.current;
    if (!session || connectionStatus !== 'connected') return;

    if (isMuted) {
      session.audioVideo.realtimeUnmuteLocalAudio();
    } else {
      session.audioVideo.realtimeMuteLocalAudio();
    }
    setIsMuted(!isMuted);
  }, [isMuted, connectionStatus]);

  // Bind video element to tile
  const bindVideoElement = useCallback((attendeeId, videoElement) => {
    const session = sessionRef.current;
    if (!session || !videoElement) return;

    const tile = videoTilesRef.current[attendeeId];
    if (tile) {
      session.audioVideo.bindVideoElement(tile.tileId, videoElement);
    }
  }, []);

  return {
    participants,
    isVideoOn,
    isMuted,
    connectionStatus,
    error,
    toggleVideo,
    toggleMute,
    bindVideoElement,
    sessionRef,
  };
}