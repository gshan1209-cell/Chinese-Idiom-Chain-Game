import { useMedia } from './MediaContext';

export function MediaDock() {
  const media = useMedia();
  const item = media.activeItem;
  if (item === null) return null;

  const collapsed = media.state.preferences.dockCollapsed;
  const playing =
    media.playback.radioPlaying || media.playback.youtubePlaying;

  return (
    <aside
      className={`media-dock${collapsed ? ' is-collapsed' : ''}`}
      aria-label="成語電台播放器"
    >
      <div className="media-dock-heading">
        <button
          className="media-icon-button"
          type="button"
          onClick={() => media.setDockCollapsed(!collapsed)}
          aria-label={collapsed ? '展開播放器' : '收合播放器'}
        >
          {collapsed ? '展' : '收'}
        </button>
        <button
          className="media-current-title"
          type="button"
          onClick={() => media.openPanel()}
        >
          <span>{item.type === 'radio' ? '收音機' : 'YouTube'}</span>
          <strong>{item.title}</strong>
        </button>
      </div>

      {!collapsed ? (
        <>
          <div className="media-dock-controls">
            <button
              className="media-icon-button"
              type="button"
              onClick={() => void media.playPrevious()}
              aria-label="上一個媒體"
            >
              上
            </button>
            <button
              className="media-play-button"
              type="button"
              onClick={() =>
                playing
                  ? media.pauseAll()
                  : void media.playItem(item.id)
              }
            >
              {playing ? '暫停' : item.type === 'radio' ? '播放' : '開啟影片'}
            </button>
            <button
              className="media-icon-button"
              type="button"
              onClick={() => void media.playNext()}
              aria-label="下一個媒體"
            >
              下
            </button>
            <button
              className="media-icon-button"
              type="button"
              onClick={() => media.setMuted(!media.playback.muted)}
              aria-label={media.playback.muted ? '取消靜音' : '靜音'}
            >
              {media.playback.muted ? '靜' : '聲'}
            </button>
          </div>
          <label className="media-volume-control">
            <span>音量</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={media.playback.baseVolume}
              onChange={(event) => media.setVolume(Number(event.target.value))}
            />
          </label>
          {media.playback.bonusActive ? (
            <p className="media-ducking-note">打地鼠進行中，背景音量已自動降低。</p>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
