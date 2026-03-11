import React, { useEffect, useRef, useState } from 'react';

// Polyfill required by amazon-chime-sdk-js in browser environments
if (typeof window !== 'undefined') {
  if (typeof window.global === 'undefined') window.global = window;
  if (typeof window.process === 'undefined') window.process = { env: {}, browser: true };
}
import {
  ConsoleLogger,
  DefaultActiveSpeakerPolicy,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from 'amazon-chime-sdk-js';
import { createChimeMeeting } from '@/functions/createChimeMeeting';
import { Loader } from 'lucide-react';
import VoiceChannelChat from './VoiceChannelChat';

const RING_RADIUS = 110;
const CONTAINER_SIZE = 310;
const CENTER = CONTAINER_SIZE / 2;
const AVATAR_SIZE = 54;

function ParticipantNode({ participant }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: AVATAR_SIZE + 24 }}>
      {/* Avatar circle */}
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

      {/* Name + mute indicator */}
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

      {/* Mini speaking wave under avatar */}
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
  const [status, setStatus] = useState('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [remoteShareActive, setRemoteShareActive] = useState(false);
  const [error, setError] = useState(null);
  const [waveBars, setWaveBars] = useState(Array(20).fill(2));
  const [remoteAttendees, setRemoteAttendees] = useState({});
  const [speakingIds, setSpeakingIds] = useState(new Set());
  const [remoteCameraTiles, setRemoteCameraTiles] = useState({}); // { tileId: attendeeId }
  const [localVideoTileId, setLocalVideoTileId] = useState(null);

  const sessionRef = useRef(null);
  const localVideoRef = useRef(null);
  const localVideoShareRef = useRef(null);
  const screenShareRef = useRef(null);
  const remoteScreenShareRef = useRef(null);
  const audioRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const localAttendeeIdRef = useRef(null);
  const remoteVideoRefs = useRef({}); // { tileId: DOM element }
  const localVideoGridRef = useRef(null);

  // Derive local speaking from waveform amplitude
  const avgAmplitude = waveBars.reduce((s, v) => s + v, 0) / waveBars.length;
  const isLocalSpeaking = !isMuted && avgAmplitude > 5;

  // Build ordered participant list: local user first, then remote
  const localProfile = memberProfiles.find(p => p.email === user.email);
  const localDisplayName = localProfile?.full_name || user.full_name || 'You';
  const allParticipants = [
    {
      id: 'local',
      name: localDisplayName,
      avatarUrl: user.avatar_url,
      isMuted,
      isSpeaking: isLocalSpeaking,
    },
    ...Object.entries(remoteAttendees).map(([id, info]) => {
      // Look up full name from memberProfiles
      const profile = memberProfiles.find(p => p.email === info.email);
      return {
        id,
        name: profile?.full_name || info.name || 'Guest',
        avatarUrl: profile?.avatar_url || null,
        isMuted: false,
        isSpeaking: speakingIds.has(id),
      };
    }),
  ];

  useEffect(() => {
    let session = null;

    const join = async () => {
      try {
        setStatus('connecting');
        const { data } = await createChimeMeeting({ communityId: community.id, channelId: channel.id });
        if (data.error) throw new Error(data.error);

        localAttendeeIdRef.current = data.attendee.AttendeeId;

        const logger = new ConsoleLogger('ChimeMeeting', LogLevel.WARN);
        const deviceController = new DefaultDeviceController(logger);
        const config = new MeetingSessionConfiguration(data.meeting, data.attendee);
        session = new DefaultMeetingSession(config, logger, deviceController);
        sessionRef.current = session;

        if (audioRef.current) {
          session.audioVideo.bindAudioElement(audioRef.current);
        }

        const audioInputs = await session.audioVideo.listAudioInputDevices();
        if (audioInputs.length > 0) {
          const deviceId = audioInputs[0].deviceId;
          await session.audioVideo.startAudioInput(deviceId);

          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId } });
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
          } catch (e) {}
        }

        // Observe all video and screen share tiles (local and remote)
        // MUST be registered BEFORE start() to avoid missing tile events
        const tileObserver = {
          videoTileDidUpdate: (tileState) => {
            if (!tileState.tileId) return;
            const attendeeId = tileState.attendeeId;
            
            // Local video tile — bind to always-present localVideoRef immediately
            if (tileState.localTile && !tileState.isContent) {
              setLocalVideoTileId(tileState.tileId);
              const target = localVideoShareRef.current || localVideoRef.current;
              if (target) {
                sessionRef.current?.audioVideo.bindVideoElement(tileState.tileId, target);
              }
            }
            // Remote content share (screen share from another participant)
            else if (tileState.isContent && !tileState.localTile) {
              setRemoteShareActive(true);
              const tryBind = () => {
                if (remoteScreenShareRef.current) {
                  sessionRef.current?.audioVideo.bindVideoElement(tileState.tileId, remoteScreenShareRef.current);
                } else {
                  setTimeout(tryBind, 100);
                }
              };
              tryBind();
            }
            // Remote participant video (not local, not content)
            else if (!tileState.isContent && !tileState.localTile && attendeeId) {
              const tileId = tileState.tileId;
              setRemoteCameraTiles(prev => ({ ...prev, [tileId]: attendeeId }));
              // Defer to next tick so React can mount the <video> element, then poll until ready
              const tryBindRemote = () => {
                const el = remoteVideoRefs.current[tileId];
                if (el && sessionRef.current) {
                  sessionRef.current.audioVideo.bindVideoElement(tileId, el);
                } else if (sessionRef.current) {
                  setTimeout(tryBindRemote, 50);
                }
              };
              setTimeout(tryBindRemote, 0);
            }
          },
          videoTileWasRemoved: (tileId) => {
            setLocalVideoTileId(prev => (prev === tileId ? null : prev));
            setRemoteCameraTiles(prev => {
              const next = { ...prev };
              delete next[tileId];
              return next;
            });
            setRemoteShareActive(false);
          },
          audioVideoDidStart: () => {
            setStatus('connected');
          },
        };
        session.audioVideo.addObserver(tileObserver);

        // Track remote attendees via presence subscription
        session.audioVideo.realtimeSubscribeToAttendeeIdPresence((attendeeId, present, externalUserId) => {
          if (attendeeId === localAttendeeIdRef.current) return; // skip self
          // Also skip content share attendees (they have a suffix #content)
          if (attendeeId.endsWith('#content')) return;
          if (present) {
            // Look up full name from memberProfiles first, then participants, fallback to 'Guest'
            const profileMatch = memberProfiles.find(p => p.email === externalUserId);
            const participantMatch = participants.find(p => p.email === externalUserId);
            const name = profileMatch?.full_name || participantMatch?.name || 'Guest';
            setRemoteAttendees(prev => ({ ...prev, [attendeeId]: { email: externalUserId, name } }));
          } else {
            setRemoteAttendees(prev => {
              const next = { ...prev };
              delete next[attendeeId];
              return next;
            });
          }
        });

        // Active speaker detection for remote participants
        session.audioVideo.subscribeToActiveSpeakerDetector(
          new DefaultActiveSpeakerPolicy(),
          (activeSpeakers) => setSpeakingIds(new Set(activeSpeakers))
        );

        session.audioVideo.start();
      } catch (err) {
        console.error('Chime join error:', err);
        setError(err.message);
        setStatus('error');
      }
    };

    join();

    return () => {
      if (session) session.audioVideo.stop();
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

  const handleToggleMuteInner = () => {
    const session = sessionRef.current;
    if (!session || status !== 'connected') return;
    if (isMuted) session.audioVideo.realtimeUnmuteLocalAudio();
    else session.audioVideo.realtimeMuteLocalAudio();
    const next = !isMuted;
    setIsMuted(next);
    onMuteChange?.(next);
    updateParticipantStatus({ isMuted: next });
  };

  const updateParticipantStatus = (updates) => {
    if (!onUpdateParticipants) return;
    const currentParticipant = participants.find(p => p.email === user.email) || {
      email: user.email,
      name: user.full_name || 'Anonymous',
      avatar_url: user.avatar_url,
    };
    const updated = { ...currentParticipant, ...updates };
    const newParticipants = participants.filter(p => p.email !== user.email);
    onUpdateParticipants([...newParticipants, updated]);
  };

  const handleToggleVideo = async () => {
    const session = sessionRef.current;
    if (!session) return;
    if (isVideoOn) {
      session.audioVideo.stopLocalVideoTile();
      await session.audioVideo.stopVideoInput();
      setIsVideoOn(false);
      onVideoChange?.(false);
      updateParticipantStatus({ isVideoOn: false });
    } else {
      const videoInputs = await session.audioVideo.listVideoInputDevices();
      if (videoInputs.length > 0) {
        await session.audioVideo.startVideoInput(videoInputs[0].deviceId);
        session.audioVideo.startLocalVideoTile();
        setIsVideoOn(true);
        onVideoChange?.(true);
        updateParticipantStatus({ isVideoOn: true });
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
      updateParticipantStatus({ isSharing: false });
    } else {
      await session.audioVideo.startContentShareFromScreenCapture();
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
      updateParticipantStatus({ isSharing: true });
    }
  };

  const handleLeaveInner = async () => {
    const session = sessionRef.current;
    if (session) session.audioVideo.stop();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close();
    onLeave();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#11141b' }}>
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Speaking wave keyframe animation injected via style tag */}
      <style>{`
        @keyframes speakPulse {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to { transform: scaleY(1); opacity: 1; }
        }
        @keyframes ringPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Remote screen share — shown when someone else is sharing */}
      {remoteShareActive && !isSharing && (
        <div style={{ flex: 1, position: 'relative', padding: 12, overflow: 'hidden' }}>
          <VoiceChannelChat user={user} allParticipants={allParticipants} memberProfiles={memberProfiles} />
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
              display: 'block',
            }}
          />
        </div>
      )}

      {/* Screen share full area with PiP cam overlay */}
      {isSharing && (
        <div style={{ flex: 1, position: 'relative', padding: 12, overflow: 'hidden' }}>
          <VoiceChannelChat user={user} allParticipants={allParticipants} memberProfiles={memberProfiles} />
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
              display: 'block',
            }}
          />
          {/* PiP cam in bottom-left */}
          {isVideoOn && (
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

      {/* Orbital ring section — hidden when screen sharing (local or remote) */}
      <div
        style={{
          flex: '1',
          display: (isSharing || remoteShareActive) ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        {/* Status messages */}
        {status === 'connecting' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', marginBottom: 16 }}>
            <Loader className="w-4 h-4 animate-spin" />
            <span style={{ fontSize: 13 }}>Connecting...</span>
          </div>
        )}
        {status === 'error' && (
          <div style={{ marginBottom: 16, padding: '8px 16px', borderRadius: 8, fontSize: 13, color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>
            {error || 'Failed to connect'}
          </div>
        )}

        {/* The orbital ring */}
        <div style={{ position: 'relative', width: CONTAINER_SIZE, height: CONTAINER_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          {/* Outer subtle glow rings */}
          <div style={{
            position: 'absolute',
            width: RING_RADIUS * 2 + 60,
            height: RING_RADIUS * 2 + 60,
            borderRadius: '50%',
            border: '1px solid rgba(0,229,160,0.06)',
          }} />
          <div style={{
            position: 'absolute',
            width: RING_RADIUS * 2 + 30,
            height: RING_RADIUS * 2 + 30,
            borderRadius: '50%',
            border: '1px solid rgba(0,229,160,0.1)',
          }} />

          {/* Main glowing ring */}
          <div style={{
            position: 'absolute',
            width: RING_RADIUS * 2,
            height: RING_RADIUS * 2,
            borderRadius: '50%',
            border: '2px solid rgba(0,229,160,0.55)',
            boxShadow: '0 0 30px rgba(0,229,160,0.25), 0 0 60px rgba(0,229,160,0.1), inset 0 0 30px rgba(0,229,160,0.04)',
            animation: status === 'connecting' ? 'ringPulse 1.5s ease-in-out infinite' : 'none',
          }} />

          {/* Inner ring */}
          <div style={{
            position: 'absolute',
            width: RING_RADIUS * 2 - 24,
            height: RING_RADIUS * 2 - 24,
            borderRadius: '50%',
            border: '1px solid rgba(0,229,160,0.08)',
          }} />

          {/* Center label */}
          <div style={{ textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
            <p style={{ color: '#00e5a0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Voice Channel
            </p>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{channel.name}</p>
            {status === 'connected' && (
              <p style={{ color: '#374151', fontSize: 10, marginTop: 4 }}>
                {allParticipants.length} {allParticipants.length === 1 ? 'participant' : 'participants'}
              </p>
            )}
          </div>

          {/* Participant avatars around the ring */}
          {allParticipants.map((p, i) => {
            const angle = (i / Math.max(allParticipants.length, 1)) * 2 * Math.PI - Math.PI / 2;
            const x = CENTER + RING_RADIUS * Math.cos(angle) - (AVATAR_SIZE + 24) / 2;
            const y = CENTER + RING_RADIUS * Math.sin(angle) - (AVATAR_SIZE + 24) / 2 - 8; // -8 to offset for name label
            return (
              <div key={p.id} style={{ position: 'absolute', left: x, top: y }}>
                <ParticipantNode participant={p} />
              </div>
            );
          })}
        </div>

        {/* Local waveform bar */}
        {status === 'connected' && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, height: 32 }}>
            {waveBars.map((h, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: `${isMuted ? 2 : h}px`,
                  background: isMuted ? 'rgba(107,114,128,0.3)' : `rgba(0,229,160,${0.4 + (h / 40) * 0.6})`,
                  borderRadius: 2,
                  transition: 'height 0.05s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Remote participant camera tiles — one <video> per active tile, bound directly in ref callback */}
        {Object.keys(remoteCameraTiles).length > 0 && !isSharing && !remoteShareActive && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: Object.keys(remoteCameraTiles).length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            padding: '16px',
            width: '100%',
          }}>
            {Object.entries(remoteCameraTiles).map(([tileId, attendeeId]) => (
              <video
                key={tileId}
                ref={el => {
                  remoteVideoRefs.current[tileId] = el;
                }}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '200px',
                  borderRadius: '8px',
                  background: '#0e1118',
                  border: '1px solid rgba(0,229,160,0.2)',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ))}
          </div>
        )}

        {/* Chat overlay when video is on but not screen sharing */}
        {isVideoOn && !isSharing && (
          <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <VoiceChannelChat user={user} allParticipants={allParticipants} memberProfiles={memberProfiles} />
          </div>
        )}

        {/* Local video — always in DOM so Chime can bind immediately when video is toggled on */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: 200,
            borderRadius: 10,
            marginTop: 16,
            background: '#0e1118',
            border: `1px solid ${isVideoOn ? 'rgba(0,229,160,0.2)' : 'rgba(255,255,255,0.06)'}`,
            display: isSharing ? 'none' : 'block',
          }}
        />
      </div>
    </div>
  );
}