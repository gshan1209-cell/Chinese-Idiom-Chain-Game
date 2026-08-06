import type { MediaLibraryItem } from '../../media/media-types';

interface YouTubePlayerProps {
  readonly item: MediaLibraryItem;
  readonly onClose: () => void;
}

export function YouTubePlayer({ item, onClose }: YouTubePlayerProps) {
  if (item.type === 'radio') return null;

  const origin = encodeURIComponent(window.location.origin);
  const src = item.type === 'youtube-video'
    ? `https://www.youtube.com/embed/${item.youtubeVideoId ?? ''}?enablejsapi=1&origin=${origin}`
    : `https://www.youtube.com/embed/videoseries?list=${item.youtubePlaylistId ?? ''}&enablejsapi=1&origin=${origin}`;

  return (
    <section className="youtube-player-card" aria-labelledby="youtube-player-title">
      <div className="media-section-heading">
        <div>
          <p className="media-kicker">YouTube 影音區</p>
          <h3 id="youtube-player-title">{item.title}</h3>
        </div>
        <button className="media-close-button" type="button" onClick={onClose}>
          關閉影片
        </button>
      </div>
      <div className="youtube-frame-shell">
        <iframe
          src={src}
          title={`YouTube：${item.title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <p className="media-supporting-text">
        影片由 YouTube 官方播放器提供；請在可見播放器內按下播放。
      </p>
    </section>
  );
}
