import { useCallback, useEffect, useRef, useState } from "react";

export function useStickToBottom({ threshold = 80 } = {}) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const pinned = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = useCallback((behavior = "auto") => {
    const element = scrollRef.current;
    if (!element) return;
    pinned.current = true;
    element.scrollTo({ top: element.scrollHeight, behavior });
    setShowJump(false);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return undefined;

    const onScroll = () => {
      const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
      pinned.current = distance <= threshold;
      setShowJump(!pinned.current);
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    return () => element.removeEventListener("scroll", onScroll);
  }, [threshold]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => {
      const element = scrollRef.current;
      if (element && pinned.current) {
        element.scrollTo({ top: element.scrollHeight });
      }
    });
    observer.observe(content);
    const element = scrollRef.current;
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { scrollRef, contentRef, scrollToBottom, showJump };
}
