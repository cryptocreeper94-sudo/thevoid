import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertVent, type CreateVentRequest } from "@shared/schema";

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64String.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export function useVents() {
  return useQuery({
    queryKey: [api.vents.list.path],
    queryFn: async () => {
      const res = await fetch(api.vents.list.path);
      if (!res.ok) throw new Error("Failed to fetch vents");
      return await res.json();
    },
  });
}

export function useCreateVent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ audioBlob, personality, mimeType, extension }: { audioBlob: Blob; personality: string; mimeType?: string; extension?: string }) => {
      const base64Audio = await blobToBase64(audioBlob);
      
      const payload: CreateVentRequest = {
        audio: base64Audio,
        personality: personality as any,
        mimeType: mimeType || "audio/webm",
        extension: extension || "webm",
      };

      const res = await fetch(api.vents.create.path, {
        method: api.vents.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to process vent");
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vents.list.path] });
    },
  });
}
