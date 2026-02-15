import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

// --- Types derived from schema ---
// Manually defining here since I cannot import from schema directly in this environment
// In a real app, import { CreateVentRequest } from "@shared/schema";

const createVentRequestSchema = z.object({
  audio: z.string(), // Base64 audio
  personality: z.enum(['smart-ass', 'calming', 'therapist', 'hype-man']),
});

export type CreateVentRequest = z.infer<typeof createVentRequestSchema>;

export type VentResponse = {
  transcript: string;
  response: string;
  audioResponse?: string;
};

// --- Hooks ---

export function useCreateVent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVentRequest) => {
      // Validate input before sending
      const validated = createVentRequestSchema.parse(data);

      const res = await fetch(api.vents.create.path, {
        method: api.vents.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to process vent");
      }

      // Validate response
      return api.vents.create.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate list query to show new history
      queryClient.invalidateQueries({ queryKey: [api.vents.list.path] });
    },
  });
}

export function useVents() {
  return useQuery({
    queryKey: [api.vents.list.path],
    queryFn: async () => {
      const res = await fetch(api.vents.list.path);
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.vents.list.responses[200].parse(await res.json());
    },
  });
}
