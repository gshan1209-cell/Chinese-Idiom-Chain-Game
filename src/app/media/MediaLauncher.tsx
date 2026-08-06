import type { ReactNode } from 'react';

import { useMedia } from './MediaContext';

interface MediaLauncherProps {
  readonly children: ReactNode;
}

export function MediaLauncher({ children }: MediaLauncherProps) {
  const media = useMedia();
  return (
    <button
      className="secondary-action media-launcher"
      type="button"
      onClick={media.openPanel}
    >
      {children}
    </button>
  );
}
