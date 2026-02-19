import { useEffect } from "react";

interface MetaOptions {
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  canonicalPath?: string;
}

export function useMeta(options: MetaOptions) {
  useEffect(() => {
    const tags: HTMLElement[] = [];

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

    if (options.description) {
      setMeta("description", options.description);
      setMeta("twitter:description", options.description);
    }
    if (options.ogTitle) {
      setMeta("og:title", options.ogTitle, true);
      setMeta("twitter:title", options.ogTitle);
    }
    if (options.ogDescription) setMeta("og:description", options.ogDescription, true);
    if (options.ogType) setMeta("og:type", options.ogType, true);

    if (options.canonicalPath) {
      const base = "https://intothevoid.app";
      const fullUrl = `${base}${options.canonicalPath}`;
      setMeta("og:url", fullUrl, true);

      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
        tags.push(canonical);
      }
      canonical.href = fullUrl;
    }

    return () => {
      tags.forEach((t) => t.remove());
    };
  }, [options.description, options.ogTitle, options.ogDescription, options.ogType, options.canonicalPath]);
}
