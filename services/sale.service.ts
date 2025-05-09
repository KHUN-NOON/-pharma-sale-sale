import { createSaleDTO, getSaleDTO } from "@sale/zod";
import { Sale } from "@/generated/prisma";
import { PaginatedServiceResponse, ServiceResponseType } from "@/types/service.type";
import { prisma } from "@/lib/prisma";
import { ClientSale, revenueByMonthType } from "@sale/types";
import { converSaleItemForClient } from "@sale/utils";

export const getSales = async (params: getSaleDTO): Promise<PaginatedServiceResponse<ClientSale[]>> => {
    try {
        const whereClause: any = {};

        if (params.startDate && params.endDate) {
            whereClause.date = {
                gte: new Date(`${params.startDate}T00:00:00Z`),
                lte: new Date(`${params.endDate}T23:59:59.999Z`)
            }
        }

        const skip = (params.page - 1) * params.limit;

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where: whereClause,
                include: {
                    saleItems: true
                },
                skip,
                take: params.limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.sale.count({
                where: whereClause
            })
        ]);

        return {
            success: true,
            message: "Sales fetched successfully",
            data: {
                result: sales.map(s => {
                    return {
                        ...s,
                        total: String(s.total),
                        saleItems: s.saleItems.map(converSaleItemForClient)
                    }
                }),
                total,
                page: params.page,
                totalPages: Math.ceil(total / params.page)
            }
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error fetching sales",
            data: null
        };
    }
}

export const createSale = async (payload: createSaleDTO): Promise<ServiceResponseType<ClientSale>> => {
    try {
        const { date, saleItems } = payload;

        const total = saleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        const sale = await prisma.$transaction(async (tx) => {
            for (const saleItem of saleItems) {
                await tx.item.update({
                    where: { id: saleItem.itemId },
                    data: {
                        stockQuantity: {
                            increment: -saleItem.quantity
                        }
                    },
                });
            }

            const sale = await tx.sale.create({
                data: {
                    date: new Date(date),
                    saleItems: {
                        create: saleItems.map(item => ({
                            itemId: item.itemId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    },
                    total
                },
                include: {
                    saleItems: true
                }
            });

            return sale;
        });

        const serialize: ClientSale = {
            ...sale,
            total: sale.total.toString(),
            saleItems: sale.saleItems.map(s => {
                return converSaleItemForClient(s);
            })
        };

        return {
            success: true,
            message: "Sale created successfully",
            data: serialize
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error creating sale",
            data: null
        };
    }
}

export const getSaleById = async (id: number): Promise<ServiceResponseType<ClientSale>> => {
    try {
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                saleItems: {
                    include: {
                        item: true
                    }
                }
            }
        });

        if (!sale) {
            return {
                success: false,
                message: "Sale not found",
                data: null
            };
        }

        const serialize: ClientSale = {
            ...sale,
            total: sale.total.toString(),
            saleItems: sale.saleItems.map(s => {
                return converSaleItemForClient(s);
            })
        };

        return {
            success: true,
            message: "Sale fetched successfully",
            data: serialize
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error fetching sale",
            data: null
        };
    }
}
export const deleteSale = async (id: number): Promise<ServiceResponseType<ClientSale>> => {
    try {
        const sale = await prisma.$transaction(async (tx) => {
            // 1. Get existing sale items
            const existingItems = await tx.saleItem.findMany({
                where: { saleId: id }
            });

            // 2. Re-add their quantities back to stock
            for (const item of existingItems) {
                await tx.item.update({
                    where: { id: item.itemId },
                    data: {
                        stockQuantity: {
                            increment: item.quantity,
                        }
                    }
                });
            }

            // 3. Delete
            const sale = await prisma.sale.delete({
                where: {
                    id
                },
                include: {
                    saleItems: true
                }
            });

            return sale;
        });

        const serialize: ClientSale = {
            ...sale,
            total: sale.total.toString(),
            saleItems: sale.saleItems.map(s => {
                return converSaleItemForClient(s);
            })
        };

        return {
            success: true,
            message: "Sale deleted successfully",
            data: serialize
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error deleting sale",
            data: null
        };
    }
}

export const updateSale = async (id: number, payload: createSaleDTO): Promise<ServiceResponseType<ClientSale>> => {
    try {
        const { date, saleItems } = payload;

        const total = saleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        const sale = await prisma.$transaction(async (tx) => {
            // 1. Get existing sale items
            const existingItems = await tx.saleItem.findMany({
                where: { saleId: id }
            });

            // 2. Re-add their quantities back to stock
            for (const item of existingItems) {
                await tx.item.update({
                    where: { id: item.itemId },
                    data: {
                        stockQuantity: {
                            increment: item.quantity,
                        }
                    }
                });
            }

            // 3. Delete old sale items
            await tx.saleItem.deleteMany({
                where: { saleId: id },
            });

            // 4. Subtract new saleItems stock
            for (const item of saleItems) {
                await tx.item.update({
                    where: { id: item.itemId },
                    data: {
                        stockQuantity: {
                            increment: -item.quantity, // subtract
                        },
                    },
                });
            }

            // 5. Re-create sale and sale items
            const sale = await tx.sale.update({
                where: {
                    id
                },
                data: {
                    date: new Date(date),
                    saleItems: {
                        create: saleItems.map(item => ({
                            itemId: item.itemId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    },
                    total
                },
                include: {
                    saleItems: true
                }
            });

            return sale;
        });

        const serialize: ClientSale = {
            ...sale,
            total: sale.total.toString(),
            saleItems: sale.saleItems.map(s => {
                return converSaleItemForClient(s);
            })
        };

        return {
            success: true,
            message: "Sale updated successfully",
            data: serialize
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error updating sale",
            data: null
        };
    }
}

export const revenueByMonth = async (year: number | string): Promise<ServiceResponseType<revenueByMonthType>> => {
    try {
        const monthlySales: { month: number; total: number }[] = await prisma.$queryRaw`
            SELECT 
                EXTRACT(MONTH from date) as MONTH,
                SUM(total) as total
            FROM "Sale"
                WHERE EXTRACT(YEAR FROM date) = ${year}
                GROUP BY EXTRACT(MONTH FROM date)
                ORDER BY month 
        `;

        const monthNames = [
            'January', 'February', 'March', 'April',
            'May', 'June', 'July', 'August',
            'September', 'October', 'November', 'December'
        ];

        // Initialize report with all months set to 0
        const yearlyReport = monthNames.map(name => ({
            name,
            value: "0" // Start with string "0" as requested
        }));

        // Fill in the actual data from the query
        monthlySales.forEach((sale: any) => {
            const monthIndex = Number(sale.month) - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
                yearlyReport[monthIndex].value = sale.total.toString();
            }
        });

        return {
            success: true,
            message: "Yearly report success!",
            data: yearlyReport
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error updating sale",
            data: null
        };
    }
}