import { usePwaInstall } from './use-pwa-install';

export function PwaInstallCard() {
  const pwa = usePwaInstall();
  const showInstallAction = !pwa.installed && (pwa.promptAvailable || pwa.iosDevice);

  return (
    <section className="install-card" aria-labelledby="install-title">
      <div className="install-card-heading">
        <div>
          <p className="install-kicker">手機安裝</p>
          <h2 id="install-title">把遊戲放到主畫面</h2>
        </div>
        <span className={`offline-badge ${pwa.offlineReady ? 'ready' : ''}`}>
          {pwa.offlineReady ? '離線可用' : '準備離線資料'}
        </span>
      </div>

      <p className={`install-status ${pwa.statusTone}`} aria-live="polite">
        {pwa.installed ? '已安裝完成，可從主畫面直接開啟。' : pwa.statusMessage}
      </p>

      <div className="install-actions">
        {pwa.installed ? (
          <span className="installed-label" role="status">✓ 已安裝到裝置</span>
        ) : showInstallAction ? (
          <button
            className="secondary-action install-action"
            type="button"
            disabled={pwa.installing}
            onClick={() => void pwa.install()}
          >
            {pwa.installing
              ? '安裝處理中…'
              : pwa.iosDevice && !pwa.promptAvailable
                ? '查看安裝步驟'
                : '安裝到手機'}
          </button>
        ) : (
          <p className="browser-install-note">使用手機 Chrome、Edge 或 Safari 開啟即可安裝。</p>
        )}

        {pwa.updateReady ? (
          <button
            className="text-action update-action"
            type="button"
            onClick={() => void pwa.applyUpdate()}
          >
            套用新版本
          </button>
        ) : null}
      </div>

      {pwa.instructionsOpen ? (
        <div className="ios-instructions" role="dialog" aria-modal="false" aria-labelledby="ios-title">
          <div className="ios-dialog-heading">
            <h3 id="ios-title">iPhone／iPad 安裝步驟</h3>
            <button className="close-instructions" type="button" onClick={pwa.closeInstructions}>
              關閉
            </button>
          </div>
          <ol>
            <li>確認目前使用 Safari 開啟遊戲。</li>
            <li>點選 Safari 工具列的「分享」按鈕。</li>
            <li>選擇「加入主畫面」，再點右上角「新增」。</li>
          </ol>
        </div>
      ) : null}
    </section>
  );
}
