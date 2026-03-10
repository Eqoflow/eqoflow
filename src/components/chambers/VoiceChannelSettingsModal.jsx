import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';

export default function VoiceChannelSettingsModal({ channel, onClose, onSave }) {
  const [settings, setSettings] = useState({
    mute_on_join: channel?.settings?.mute_on_join || false,
    require_permission_to_speak: channel?.settings?.require_permission_to_speak || false,
  });

  const toggleMuteOnJoin = () => {
    setSettings(s => ({
      ...s,
      mute_on_join: !s.mute_on_join,
      require_permission_to_speak: s.mute_on_join ? false : s.require_permission_to_speak,
    }));
  };

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#13161e',
          border: '1px solid rgba(0,229,160,0.2)',
          borderRadius: 12,
          padding: 24,
          width: 340,
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings className="w-4 h-4" style={{ color: '#00e5a0' }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>#{channel?.name} Settings</span>
          </div>
          <button onClick={onClose} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mute on join */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#e5e7eb' }}>Mute participants on join</p>
              <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>New participants join with mic muted</p>
            </div>
            <button
              onClick={toggleMuteOnJoin}
              style={{
                width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                background: settings.mute_on_join ? '#00e5a0' : '#374151',
                position: 'relative', border: 'none', cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: 3,
                left: settings.mute_on_join ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transition: 'left 0.15s',
              }} />
            </button>
          </div>
        </div>

        {/* Require permission to speak — only when mute_on_join is enabled */}
        {settings.mute_on_join && (
          <div style={{ marginBottom: 20, paddingLeft: 12, borderLeft: '2px solid rgba(0,229,160,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#e5e7eb' }}>Require permission to speak</p>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Users must request and be approved before unmuting</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, require_permission_to_speak: !s.require_permission_to_speak }))}
                style={{
                  width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                  background: settings.require_permission_to_speak ? '#00e5a0' : '#374151',
                  position: 'relative', border: 'none', cursor: 'pointer',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: settings.require_permission_to_speak ? 21 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.15s',
                }} />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            background: 'rgba(0,229,160,0.15)', border: '1px solid rgba(0,229,160,0.3)',
            color: '#00e5a0', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}