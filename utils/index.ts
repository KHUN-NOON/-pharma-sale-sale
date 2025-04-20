import { Sale, SaleItem } from "@/generated/prisma";

export const convertSaleForClient = (sale: Sale) => {
    return {
        ...sale,
        total: sale.total.toString()
    }
}

export const converSaleItemForClient = (item: SaleItem) => {
    return {
        ...item,
        price: item.price.toString()
    }
}