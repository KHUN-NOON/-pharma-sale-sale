import { z } from "zod";

export const getSaleSchema = z.object({
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(10),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional()
});

export type getSaleDTO = z.infer<typeof getSaleSchema>;

export const createSaleSchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val))),
    saleItems: z.array(z.object({
        itemId: z.number(),
        quantity: z.number().min(1).int(),
        price: z.number().min(0)
    }))
});

export type createSaleDTO = z.infer<typeof createSaleSchema>;