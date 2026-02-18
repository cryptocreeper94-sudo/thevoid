import { useEffect } from "react";

interface MetaOptions {
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
}

export function useMeta(options: MetaOptions) {
  useEffect(() => {
    const tags: HTMLMetaElement[] = [];

    function setMeta(name: string, content: string, isProperty = false) {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
        tags.push(el);
      }
      el.content = content;
    }

    if (options.description) setMeta("description", options.description);
    if (options.ogTitle) setMeta("og:title", options.ogTitle, true);
    if (options.ogDescription) setMeta("og:description", options.ogDescription, true);
    if (options.ogType) setMeta("og:type", options.ogType, true);

    return () => {
      tags.forEach((t) => t.remove());
    };
  }, [options.description, options.ogTitle, options.ogDescription, options.ogType]);
}
