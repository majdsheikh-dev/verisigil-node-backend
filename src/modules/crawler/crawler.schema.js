import { z } from "zod";

const crawlerItemSchema = z.record(z.string(), z.any());

export const crawlerIngestSchema = z.union([
  z.array(crawlerItemSchema),
  z.object({
    source: z.string().trim().optional(),
    items: z.array(crawlerItemSchema),
  }),
]);