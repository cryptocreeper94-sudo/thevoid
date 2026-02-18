import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} | THE VOID by DarkWave Studios`;
    return () => { document.title = prev; };
  }, [title]);
}
