import { Sale } from "@/generated/prisma";

export type ClientSale = Omit<Sale, 'total' | 'saleItems'> & {
    total: string,
    saleItems: {
        id: number, 
        saleId: number,
        itemId: number,
        quantity: number
        price: string,
        item?: {
            id: number,
            name: string
        }
    }[]
}

export type revenueByMonthType = Array<{
    name: string, 
    value: string
}>;