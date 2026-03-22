import React, { useEffect, useState, useRef } from 'react';
import { AdTag } from '@/src/store/adTagStore';

interface AdTagRendererProps {
  tag: AdTag;
  className?: string;
  height?: number;
}

function buildSrcDoc(tag: AdTag): string {
  const base = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; background: transparent; overflow: hidden; }
  </style>
</head>
<body>`;

  if (tag.code_type === 'javascript') {
    return `${base}\n<script>${tag.code}</script>\n</body></html>`;
  }
  return `${base}\n${tag.code}\n</body></html>`;
}

export const AdTagRenderer: React.FC<AdTagRendererProps> = ({
  tag,
  className = '',
  height = 90,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasError, setHasError] = useState(false);
  const [frameHeight, setFrameHeight] = useState(height);

  useEffect(() => {
    setHasError(false);
  }, [tag.id, tag.code]);

  // Listen for postMessage height updates from the iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'adHeight' && e.data?.id === tag.id) {
        setFrameHeight(e.data.height);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [tag.id]);

  if (!tag.is_active || !tag.code.trim()) return null;
  if (hasError) return null;

  if (tag.code_type === 'url') {
    return (
      <iframe
        ref={iframeRef}
        src={tag.code}
        title={tag.name}
        className={`w-full border-0 rounded-[12px] overflow-hidden ${className}`}
        style={{ height: frameHeight }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    );
  }

  const srcDoc = buildSrcDoc(tag);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      title={tag.name}
      className={`w-full border-0 rounded-[12px] overflow-hidden ${className}`}
      style={{ height: frameHeight }}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
};

/** Drop this anywhere in a page to render all active ad tags for that position */
export const AdSlot: React.FC<{
  position: AdTag['position'];
  className?: string;
}> = ({ position, className = '' }) => {
  const [tags, setTags] = useState<AdTag[]>([]);

  useEffect(() => {
    import('@/src/store/adTagStore').then(({ useAdTagStore }) => {
      const store = useAdTagStore.getState();
      const positioned = store.tagsForPosition(position);
      setTags(positioned);

      // If nothing loaded yet, trigger a fetch then re-read
      if (store.tags.length === 0 && !store.loading) {
        store.fetchActiveTags().then(() => {
          setTags(useAdTagStore.getState().tagsForPosition(position));
        });
      }
    });
  }, [position]);

  if (tags.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {tags.map(tag => (
        <AdTagRenderer key={tag.id} tag={tag} />
      ))}
    </div>
  );
};
