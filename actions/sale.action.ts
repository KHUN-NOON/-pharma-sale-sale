'use server';

import { ActionResponseType } from "@/types/action.type";
import { withAuth } from "@/lib/server.action.wrapper";
import { createSaleSchema } from "@sale/zod";
import { createSale, deleteSale, updateSale } from "@sale/services/sale.service";
import { ClientSale } from "@sale/types";

export const createSaleAction = async (prevState: ActionResponseType<ClientSale>, formData: FormData): Promise<ActionResponseType<ClientSale>> => {
    const rawDate = formData.get('date');
    const rawSaleItems = formData.get('saleItems');

    const parsedData = {
        date: rawDate,
        saleItems: JSON.parse(String(rawSaleItems)), // assuming it's a JSON string
    }
    
    const validation = createSaleSchema.safeParse(parsedData);

    if (!validation.success) {
        const errors = validation.error.flatten();

        return {
            success: false,
            message: null,
            errors: errors.fieldErrors,
            data: null
        };
    }

    const res = await withAuth({
        action: () => createSale(validation.data),
        requireAuth: false
    });

    return res;
}

export const updateSaleAction = async (prevState: ActionResponseType<ClientSale>, formData: FormData): Promise<ActionResponseType<ClientSale>> => {
    const rawId = formData.get('id')?.toString();
    const rawDate = formData.get('data');
    const rawSaleItems = formData.get('saleItems');

    const parsedData = {
        date: String(rawDate),
        saleItems: JSON.parse(String(rawSaleItems)), // assuming it's a JSON string
    }
    
    const validation = createSaleSchema.safeParse(parsedData);

    if (!validation.success) {
        const errors = validation.error.flatten();

        return {
            success: false,
            message: null,
            errors: errors.fieldErrors,
            data: null
        };
    }

    const res = await withAuth({
        action: () => updateSale(parseInt(rawId ?? '0'), validation.data),
        requireAuth: false
    });

    return res;
}

export const deleteSaleAction = async (prevState: ActionResponseType<ClientSale>, formData: FormData): Promise<ActionResponseType<ClientSale>> => {
    const rawId = formData.get('id')?.toString();

    const res = await withAuth({
        requireAuth: false,
        action: () => deleteSale(parseInt(rawId ?? '0'))
    });

    return res;
}