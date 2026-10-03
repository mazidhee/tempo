import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import type { Curriculum } from '../../shared/study';
import { validCover } from '../../shared/localImage';
export function CurriculumCover({ curriculum }: { curriculum: Curriculum }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const save = async (coverImage: string | null) => {
    await window.workspaceAPI.invoke('study:saveCurriculum', {
      id: curriculum.id,
      title: curriculum.title,
      description: curriculum.description,
      coverImage,
    });
  };
  const choose = async (file?: File) => {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    let bitmap: ImageBitmap | undefined;
    try {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 10 * 1024 * 1024
      )
        throw new Error('Choose a JPEG, PNG or WebP image under 10 MB.');
      bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 400;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare this image.');
      const width = Math.min(bitmap.width, bitmap.height * 4),
        height = width / 4;
      context.drawImage(
        bitmap,
        (bitmap.width - width) / 2,
        (bitmap.height - height) / 2,
        width,
        height,
        0,
        0,
        1600,
        400,
      );
      const image = canvas.toDataURL('image/jpeg', 0.85);
      if (!validCover(image)) throw new Error('This image is too detailed. Try a smaller image.');
      await save(image);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      bitmap?.close();
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };
  return (
    <div className={`curriculum-cover ${curriculum.coverImage ? 'has-cover' : ''}`}>
      {curriculum.coverImage && (
        <img src={curriculum.coverImage} alt={`${curriculum.title} cover`} />
      )}
      <input
        ref={input}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => void choose(e.target.files?.[0])}
      />
      <div className="cover-controls">
        <button
          className={curriculum.coverImage ? 'icon-button' : 'btn-secondary'}
          aria-label={curriculum.coverImage ? 'Change cover' : 'Add cover'}
          title={curriculum.coverImage ? 'Change cover' : undefined}
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <ImagePlus />
          {!curriculum.coverImage && (busy ? 'Saving cover…' : 'Add cover')}
        </button>
        {curriculum.coverImage && (
          <button
            className="icon-button"
            aria-label="Remove cover"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await save(null);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <X />
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
    </div>
  );
}
