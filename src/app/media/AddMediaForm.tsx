import { useState, type FormEvent } from 'react';

import { parseMediaSource } from '../../media/media-url-parser';
import type {
  CreateCustomMediaItemInput,
  MediaItemType
} from '../../media/media-types';
import { useMedia } from './MediaContext';

const RADIO_TRIAL_TIMEOUT_MS = 10_000;

function trialRadioSource(sourceUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = 0.05;
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
    const succeed = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('十秒內無法確認此電台可播放。'));
    };
    const timeoutId = window.setTimeout(fail, RADIO_TRIAL_TIMEOUT_MS);

    audio.addEventListener('playing', succeed, { once: true });
    audio.addEventListener('canplay', succeed, { once: true });
    audio.addEventListener('loadedmetadata', succeed, { once: true });
    audio.addEventListener('error', fail, { once: true });
    audio.src = sourceUrl;
    void audio.play().catch(fail);
  });
}

export function AddMediaForm() {
  const media = useMedia();
  const [type, setType] = useState<MediaItemType>('radio');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('音樂');
  const [sourceUrl, setSourceUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (type === 'radio') {
        const parsed = parseMediaSource(sourceUrl, 'radio');
        await trialRadioSource(parsed.canonicalUrl);
      }

      const input: CreateCustomMediaItemInput = {
        id: crypto.randomUUID(),
        type,
        title,
        category,
        sourceUrl
      };
      media.addCustomItem(input);
      setTitle('');
      setSourceUrl('');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : '新增媒體失敗。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="media-add-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="media-section-heading">
        <div>
          <p className="media-kicker">我的內容</p>
          <h3>新增電台或 YouTube</h3>
        </div>
      </div>

      <label>
        <span>類型</span>
        <select
          value={type}
          onChange={(event) => setType(event.target.value as MediaItemType)}
        >
          <option value="radio">HTTPS 網路電台</option>
          <option value="youtube-video">YouTube 影片</option>
          <option value="youtube-playlist">YouTube 播放清單</option>
        </select>
      </label>
      <label>
        <span>名稱</span>
        <input
          value={title}
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="例如：夜讀音樂"
          required
        />
      </label>
      <label>
        <span>分類</span>
        <input
          value={category}
          maxLength={30}
          onChange={(event) => setCategory(event.target.value)}
          required
        />
      </label>
      <label>
        <span>網址</span>
        <input
          type="url"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder="https://"
          required
        />
      </label>

      {type === 'radio' ? (
        <p className="media-supporting-text">
          新增前會試播最多十秒；成功後才保存。部分 HLS 電台可能不受目前瀏覽器支援。
        </p>
      ) : (
        <p className="media-supporting-text">
          僅接受 YouTube 官方影片或播放清單網址，不接受 iframe 程式碼。
        </p>
      )}

      {error === null ? null : (
        <p className="media-error" role="alert">{error}</p>
      )}
      <button className="media-primary-button" type="submit" disabled={busy}>
        {busy ? '驗證中…' : '新增至我的清單'}
      </button>
    </form>
  );
}
