import { useRef, useState } from 'react';
import { Camera, Check, Trash2 } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { accents, validAvatar } from '../../shared/appearance';
export default function Personalization() {
  const { state, update } = useProductivity();
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const settings = state.settings;
  const set = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) =>
    update((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 10 * 1024 * 1024
      )
        throw new Error('Choose a JPG, PNG or WebP photo smaller than 10 MB.');
      const bitmap = await createImageBitmap(file);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 384;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Photo processing is unavailable.');
        const side = Math.min(bitmap.width, bitmap.height);
        context.drawImage(
          bitmap,
          (bitmap.width - side) / 2,
          (bitmap.height - side) / 2,
          side,
          side,
          0,
          0,
          384,
          384,
        );
        const image = canvas.toDataURL('image/jpeg', 0.85);
        if (!validAvatar(image)) throw new Error('Could not save this photo. Try a smaller image.');
        set('avatar', image);
      } finally {
        bitmap.close();
      }
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="profile-photo-row">
        <div className="profile-photo-preview">
          {settings.avatar ? (
            <img src={settings.avatar} alt="Your local profile" />
          ) : (
            <span>{settings.name.trim().slice(0, 2).toUpperCase() || 'ME'}</span>
          )}
        </div>
        <div>
          <strong>Profile photo</strong>
          <p className="muted">Stored in your local workspace and JSON backup.</p>
          <div className="row-actions">
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              <Camera />
              {busy ? 'Saving photo…' : 'Choose photo'}
            </button>
            {settings.avatar && (
              <button
                className="icon-button"
                disabled={busy}
                aria-label="Remove profile photo"
                onClick={() => set('avatar', null)}
              >
                <Trash2 />
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInput}
          className="sr-only"
          aria-label="Choose local profile photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <div className="appearance-group">
        <strong>Accent color</strong>
        <p className="muted">Choose one solid accent for actions, charts and calendars.</p>
        <div className="accent-options" role="group" aria-label="Accent color">
          {accents.map((accent) => (
            <button
              key={accent.id}
              className={`accent-option ${(settings.accent ?? 'lavender') === accent.id ? 'selected' : ''}`}
              aria-pressed={(settings.accent ?? 'lavender') === accent.id}
              onClick={() => set('accent', accent.id)}
            >
              <span
                className="accent-swatch"
                style={{ backgroundColor: accent.color }}
                aria-hidden="true"
              >
                {(settings.accent ?? 'lavender') === accent.id && <Check />}
              </span>
              {accent.name}
            </button>
          ))}
        </div>
      </div>
      <label className="setting-name appearance-group">
        Home greetings
        <select
          className="input"
          aria-label="Home greetings"
          aria-describedby="greeting-help"
          value={settings.greetingStyle ?? 'mixed'}
          onChange={(e) => set('greetingStyle', e.target.value as 'mixed' | 'simple')}
        >
          <option value="mixed">Varied and personal</option>
          <option value="simple">Simple time-of-day greeting</option>
        </select>
        <span id="greeting-help" className="muted small greeting-help">
          Varied greetings mix humour, encouragement and occasional language greetings with a short
          translation.
        </span>
      </label>
    </>
  );
}
