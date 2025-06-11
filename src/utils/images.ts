import type { ImageMetadata } from 'astro';
import type { OpenGraph } from '@astrolib/seo';

// 直接 eager 載入圖片，glob key 是絕對路徑從 /src/ 開始
const images = import.meta.glob('/src/assets/images/**/*.{jpg,jpeg,png,webp,gif,svg}', { eager: true });

/**
 * 透過 md 裡傳入的相對路徑 imagePath，找 glob 物件 key。
 * md 裡 imagePath 範例: "assets/images/cover-sf.jpg"
 * glob key 範例: "/src/assets/images/cover-sf.jpg"
 */
export const findImage = async (
  imagePath?: string | null
): Promise<string | ImageMetadata | null> => {
  if (!imagePath || typeof imagePath !== 'string') return null;

  // 組成 glob 的 key
  const key = `/src/${imagePath.replace(/^\/+/, '')}`;

  // 找到對應 module
  const mod = images[key] as { default: ImageMetadata | string } | undefined;

  if (mod) {
    return mod.default ?? null;
  }

  return null;
};

/**
 * 簡易版 adaptOpenGraphImages，可接 OpenGraph 物件，將圖片 url 轉換成可用路徑。
 */
export const adaptOpenGraphImages = async (
  openGraph: OpenGraph = {}
): Promise<OpenGraph> => {
  if (!openGraph?.images?.length) {
    return openGraph;
  }

  const adaptedImages = await Promise.all(
    openGraph.images.map(async (image) => {
      if (!image?.url) return { url: '' };

      // 用 findImage 找本地圖片路徑
      const resolved = await findImage(image.url);

      if (typeof resolved === 'string' && resolved) {
        return { url: resolved };
      }

      // 找不到或格式錯誤，回傳空字串
      return { url: '' };
    })
  );

  return {
    ...openGraph,
    images: adaptedImages,
  };
};
