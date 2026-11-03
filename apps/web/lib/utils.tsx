export function transitionHandler(handler: () => void) {
  if ('startViewTransition' in document) {
    document.startViewTransition(handler);
  } else {
    handler();
  }
}
/**
 * 将 rgb/rgba 颜色字符串转换为十六进制颜色码
 * @param rgb 例如 "rgb(255, 0, 0)" 或 "rgba(0, 0, 0, 0.5)"
 * @returns 十六进制颜色字符串，例如 "#ff0000"
 */
export function rgbToHex(rgb: string): string {
  // 使用正则提取括号内的数字
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return rgb; // 如果格式不对，直接返回原值

  const [r, g, b] = match.map(Number);
  if (!r || !g || !b) return rgb;

  // 将 RGB 转换为十六进制，并补齐两位数（例如 5 -> "05"）
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * 递归查找第一个可见的内容包裹器（文字、图片、链接等）
 * @param root 要查找的根元素
 * @returns 第一个可见的内容包裹器，或 null 如果没有可见内容
 */
export function findFirstVisibleContentWrapper(root: HTMLElement): HTMLElement | null {
  for (const child of root.children) {
    if (!(child instanceof HTMLElement)) continue;

    const style = window.getComputedStyle(child);
    if (style.display === 'none' || style.visibility === 'hidden') continue;

    const hasText = Array.from(child.childNodes).some(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    );
    const hasMedia = child.querySelector('img, a, svg, video, canvas');

    // 如果当前元素本身就有真实内容，先试着往更深层找
    if (hasText || hasMedia) {
      const deeper = findFirstVisibleContentWrapper(child);
      // 如果子层还有更具体的内容包裹器，用子层的；否则就是当前这个
      return deeper ?? child;
    }

    // 当前元素没内容，继续递归
    const found = findFirstVisibleContentWrapper(child);
    if (found) return found;
  }
  return null;
}