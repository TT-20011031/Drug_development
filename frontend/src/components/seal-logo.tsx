"use client";

interface SealLogoProps {
  /** Outer diameter in px. Default 36. */
  size?: number;
  /** Rotation degree for the "stamped" feel. Default 2. */
  rotate?: number;
  /** Center character. Default 寿 (Shouxiangu brand). */
  char?: string;
  className?: string;
}

/**
 * 双圈朱砂印章 logo —
 *   - 外圈细边 cinnabar/55
 *   - 内圈实色 cinnabar 圆盘 + 顶光高光 + ring 残影
 *   - 中心 寿 字（骨色宋体）
 *   - 东南西北 4 个定位齿点
 *   - 整体 2° 微旋，模拟手按印泥
 *
 * 纯 div + Tailwind，无外部 SVG 依赖。
 */
export function SealLogo({
  size = 36,
  rotate = 2,
  char = "寿",
  className = "",
}: SealLogoProps) {
  // 字号约为外径的 50%，视觉饱满
  const fontPx = Math.round(size * 0.5);
  // 定位齿点尺寸约为外径的 4%
  const dotPx = Math.max(2, Math.round(size * 0.06));

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
      }}
      aria-hidden
    >
      {/* 外圈细边 */}
      <div className="absolute inset-0 rounded-full border border-cinnabar/55" />

      {/* 实色内圈 + 双层 inset 高光（顶光 + 内白边） */}
      <div
        className="absolute rounded-full bg-cinnabar"
        style={{
          inset: Math.max(2, Math.round(size * 0.085)),
          boxShadow:
            "0 0 0 1px rgba(168,65,42,0.30), inset 0 1.2px 0 0 rgba(255,252,245,0.55), inset 0 0 0 1.5px rgba(255,252,245,0.18)",
        }}
      />

      {/* 中心字 */}
      <span
        className="absolute inset-0 flex items-center justify-center font-serif text-bone leading-none select-none"
        style={{ fontSize: fontPx, paddingBottom: Math.round(size * 0.02) }}
      >
        {char}
      </span>

      {/* 东南西北 4 定位齿点 */}
      <span
        className="absolute rounded-full bg-cinnabar/70"
        style={{
          width: dotPx,
          height: dotPx,
          top: 0,
          left: "50%",
          transform: "translate(-50%, -40%)",
        }}
      />
      <span
        className="absolute rounded-full bg-cinnabar/70"
        style={{
          width: dotPx,
          height: dotPx,
          bottom: 0,
          left: "50%",
          transform: "translate(-50%, 40%)",
        }}
      />
      <span
        className="absolute rounded-full bg-cinnabar/70"
        style={{
          width: dotPx,
          height: dotPx,
          left: 0,
          top: "50%",
          transform: "translate(-40%, -50%)",
        }}
      />
      <span
        className="absolute rounded-full bg-cinnabar/70"
        style={{
          width: dotPx,
          height: dotPx,
          right: 0,
          top: "50%",
          transform: "translate(40%, -50%)",
        }}
      />
    </div>
  );
}
