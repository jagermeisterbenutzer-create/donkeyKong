const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`;

const backgroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#10132b" />
      <stop offset="45%" stop-color="#142040" />
      <stop offset="100%" stop-color="#070a1a" />
    </linearGradient>
    <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#181f3b" />
      <stop offset="100%" stop-color="#04060f" />
    </linearGradient>
  </defs>
  <rect width="960" height="720" fill="url(#sky)" />
  <rect x="0" y="420" width="960" height="300" fill="url(#horizon)" />
  <g opacity="0.9">
    <rect x="48" y="340" width="120" height="300" rx="12" fill="#182045" />
    <rect x="190" y="300" width="100" height="360" rx="14" fill="#1c294a" />
    <rect x="320" y="360" width="80" height="260" rx="10" fill="#1f3457" />
    <rect x="420" y="320" width="150" height="320" rx="10" fill="#0d1730" />
    <rect x="596" y="360" width="90" height="280" rx="8" fill="#283252" />
    <rect x="718" y="310" width="130" height="330" rx="12" fill="#14243f" />
  </g>
  <g fill="#0c6ef5" opacity="0.6">
    <rect x="68" y="360" width="12" height="18" rx="2" />
    <rect x="92" y="360" width="12" height="18" rx="2" />
    <rect x="204" y="340" width="12" height="18" rx="2" />
    <rect x="228" y="340" width="12" height="18" rx="2" />
    <rect x="244" y="360" width="12" height="18" rx="2" />
    <rect x="394" y="330" width="12" height="18" rx="2" />
    <rect x="418" y="330" width="12" height="18" rx="2" />
    <rect x="736" y="328" width="12" height="18" rx="2" />
    <rect x="760" y="328" width="12" height="18" rx="2" />
  </g>
  <circle cx="780" cy="130" r="70" fill="#f8dbb4" opacity="0.4" />
  <circle cx="840" cy="80" r="5" fill="#f4f5ff" opacity="0.8" />
  <circle cx="880" cy="150" r="3" fill="#f4f5ff" opacity="0.8" />
  <circle cx="720" cy="70" r="4" fill="#f4f5ff" opacity="0.9" />
</svg>
`;

const spriteSheetSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="48" viewBox="0 0 128 48">
  <defs>
    <style>
      .body{fill:#f4a261;stroke:#c26412;stroke-width:1.2;}
      .head{fill:#f9f3e7;stroke:#c26412;stroke-width:1.2;}
      .leg{fill:#8d5534;}
      .tail{fill:none;stroke:#8d5534;stroke-width:1.5;stroke-linecap:round;}
    </style>
  </defs>
  <g transform="translate(0,0)">
    <rect x="8" y="24" width="16" height="14" rx="5" class="body" />
    <circle cx="16" cy="16" r="7" class="head" />
    <path d="M12 11 L11 4 L14 10 Z" fill="#8d5534" />
    <rect x="10" y="36" width="3" height="10" class="leg" />
    <rect x="19" y="36" width="3" height="10" class="leg" />
    <path d="M24 30 Q28 32 30 28" class="tail" />
  </g>
  <g transform="translate(32,0)">
    <rect x="10" y="22" width="16" height="16" rx="5" class="body" />
    <circle cx="18" cy="15" r="7" class="head" />
    <path d="M12 11 L10 4 L14 10 Z" fill="#8d5534" />
    <rect x="10" y="34" width="3" height="12" class="leg" />
    <rect x="19" y="38" width="3" height="8" class="leg" />
    <path d="M24 28 Q28 30 30 26" class="tail" />
  </g>
  <g transform="translate(64,0)">
    <rect x="8" y="26" width="16" height="14" rx="5" class="body" />
    <circle cx="16" cy="14" r="7" class="head" />
    <path d="M12 11 L13 4 L16 10 Z" fill="#8d5534" />
    <rect x="10" y="36" width="3" height="9" class="leg" />
    <rect x="19" y="32" width="3" height="13" class="leg" />
    <path d="M24 30 Q27 34 29 30" class="tail" />
  </g>
  <g transform="translate(96,0)">
    <rect x="8" y="20" width="16" height="16" rx="5" class="body" />
    <circle cx="16" cy="12" r="7" class="head" />
    <path d="M12 10 L11 2 L14 9 Z" fill="#8d5534" />
    <rect x="10" y="30" width="3" height="14" class="leg" />
    <rect x="19" y="30" width="3" height="14" class="leg" />
    <path d="M24 28 Q28 32 30 28" class="tail" />
  </g>
</svg>
`;

const createImage = (src: string) => {
  if (typeof Image === "undefined") {
    return { src } as HTMLImageElement;
  }

  const image = new Image();
  image.src = src;
  return image;
};

export const backgroundDataUrl = svgToDataUrl(backgroundSvg);
export const donkeySpriteSheetDataUrl = svgToDataUrl(spriteSheetSvg);
export const createBackgroundImage = () => createImage(backgroundDataUrl);
export const createDonkeySpriteSheet = () => createImage(donkeySpriteSheetDataUrl);
export const DONKEY_FRAME_COUNT = 4;
export const DONKEY_FRAME_WIDTH = 32;
export const DONKEY_FRAME_HEIGHT = 48;
