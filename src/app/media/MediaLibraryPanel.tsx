import { useMemo, useState, type ChangeEvent } from 'react';

import type { MediaLibraryItem } from '../../media/media-types';
import { AddMediaForm } from './AddMediaForm';
import { useMedia } from './MediaContext';
import { YouTubePlayer } from './YouTubePlayer';

type MediaTab = 'all' | 'radio' | 'youtube' | 'favorites' | 'custom';

const tabs: readonly Readonly<{ id: MediaTab; label: string }>[] = Object.freeze([
  { id: 'all', label: '全部' },
  { id: 'radio', label: '收音機' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'favorites', label: '收藏' },
  { id: 'custom', label: '自訂' }
]);

function matchesTab(
  item: MediaLibraryItem,
  tab: MediaTab,
  favoriteIds: readonly string[]
): boolean {
  switch (tab) {
    case 'all':
      return true;
    case 'radio':
      return item.type === 'radio';
    case 'youtube':
      return item.type !== 'radio';
    case 'favorites':
      return favoriteIds.includes(item.id);
    case 'custom':
      return item.origin === 'custom';
  }
}

export function MediaLibraryPanel() {
  const media = useMedia();
  const [tab, setTab] = useState<MediaTab>('all');
  const [importError, setImportError] = useState<string | null>(null);

  const visibleItems = useMemo(
    () =>
      media.state.library.filter(
        (item) => item.enabled && matchesTab(item, tab, media.state.favoriteIds)
      ),
    [media.state.favoriteIds, media.state.library, tab]
  );

  if (!media.panelOpen) return null;

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file === undefined) return;
    setImportError(null);
    try {
      media.importBackup(await file.text());
    } catch (error: unknown) {
      setImportError(error instanceof Error ? error.message : '匯入失敗。');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="media-panel-backdrop" role="presentation">
      <section
        className="media-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-panel-title"
      >
        <header className="media-panel-header">
          <div>
            <p className="media-kicker">邊玩邊聽 · 可見影音</p>
            <h2 id="media-panel-title">成語電台與影音中心</h2>
          </div>
          <button
            className="media-close-button"
            type="button"
            onClick={() => media.closePanel()}
          >
            關閉
          </button>
        </header>

        {!media.isOnline ? (
          <p className="media-offline-note" role="status">
            目前離線。網路媒體暫停使用，但成語闖關仍可正常遊玩。
          </p>
        ) : null}
        {media.notice === null ? null : (
          <div className="media-notice" role="status">
            <span>{media.notice}</span>
            <button type="button" onClick={() => media.clearNotice()}>
              知道了
            </button>
          </div>
        )}

        {media.activeItem !== null && media.activeItem.type !== 'radio' ? (
          <YouTubePlayer
            item={media.activeItem}
            onClose={() => media.pauseAll()}
          />
        ) : null}

        <nav className="media-tabs" aria-label="媒體分類">
          {tabs.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className={candidate.id === tab ? 'is-active' : ''}
              aria-pressed={candidate.id === tab}
              onClick={() => setTab(candidate.id)}
            >
              {candidate.label}
            </button>
          ))}
        </nav>

        <section className="media-library-section" aria-labelledby="media-library-title">
          <div className="media-section-heading">
            <div>
              <p className="media-kicker">播放清單</p>
              <h3 id="media-library-title">可用媒體</h3>
            </div>
            <span className="media-count">{visibleItems.length} 項</span>
          </div>

          {visibleItems.length === 0 ? (
            <div className="media-empty-state">
              <strong>目前沒有符合條件的媒體</strong>
              <p>
                Drive 尚未核准正式內建來源；可先在下方加入自己的 HTTPS 電台或 YouTube 連結。
              </p>
            </div>
          ) : (
            <div className="media-item-list">
              {visibleItems.map((item) => {
                const favorite = media.state.favoriteIds.includes(item.id);
                const active = media.activeItem?.id === item.id;
                return (
                  <article className={`media-item${active ? ' is-active' : ''}`} key={item.id}>
                    <div className="media-item-copy">
                      <span>{item.type === 'radio' ? '收音機' : 'YouTube'}</span>
                      <strong>{item.title}</strong>
                      <small>{item.category} · {item.origin === 'built-in' ? '內建' : '自訂'}</small>
                    </div>
                    <div className="media-item-actions">
                      <button
                        type="button"
                        onClick={() => void media.playItem(item.id)}
                        disabled={!media.isOnline}
                      >
                        {item.type === 'radio' ? '播放' : '開啟'}
                      </button>
                      <button
                        type="button"
                        aria-label={favorite ? `取消收藏 ${item.title}` : `收藏 ${item.title}`}
                        onClick={() => media.toggleFavorite(item.id)}
                      >
                        {favorite ? '已收藏' : '收藏'}
                      </button>
                      {item.origin === 'custom' ? (
                        <>
                          <button type="button" onClick={() => media.moveCustomItem(item.id, -1)}>
                            上移
                          </button>
                          <button type="button" onClick={() => media.moveCustomItem(item.id, 1)}>
                            下移
                          </button>
                          <button type="button" onClick={() => media.removeItem(item.id)}>
                            刪除
                          </button>
                        </>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <AddMediaForm />

        <section className="media-backup-section" aria-labelledby="media-backup-title">
          <div className="media-section-heading">
            <div>
              <p className="media-kicker">本機備份</p>
              <h3 id="media-backup-title">匯出／匯入清單</h3>
            </div>
          </div>
          <p className="media-supporting-text">
            備份只包含自訂媒體、收藏與播放器偏好，不包含帳號、Cookie 或闖關進度。
          </p>
          <div className="media-backup-actions">
            <button
              className="media-secondary-button"
              type="button"
              onClick={() => media.exportBackup()}
            >
              匯出 JSON
            </button>
            <label className="media-secondary-button media-file-label">
              匯入 JSON
              <input
                type="file"
                accept="application/json,.json"
                onChange={(event) => void handleImport(event)}
              />
            </label>
          </div>
          {importError === null ? null : (
            <p className="media-error" role="alert">{importError}</p>
          )}
        </section>
      </section>
    </div>
  );
}
