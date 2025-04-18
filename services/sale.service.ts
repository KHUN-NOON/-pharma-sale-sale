import { createSaleDTO, getSaleDTO } from "@sale/zod";
import { PrismaClient, Sale } from "@/generated/prisma";
import { PaginatedServiceResponse, ServiceResponseType } from "@/types/service.type";

const prisma = new PrismaClient();

export const getSales = async (params: getSaleDTO): Promise<PaginatedServiceResponse<Sale[]>> => {
    try {
        const whereClause: any = {};

        if (params.startDate && params.endDate) {
            whereClause.createdAt = {
                gte: new Date(params.startDate),
                lte: new Date(params.endDate)
            }
        }

        const skip = (params.page - 1) * params.limit;

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                include: {
                    saleItems: true
                },
                skip,
                take: params.limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.sale.count()
        ]);

        return {
            success: true,
            message: "Sales fetched successfully",
            data: {
                result: sales,
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

export const createSale = async (payload: createSaleDTO): Promise<ServiceResponseType<Sale>> => {
    try {
        const { date, saleItems } = payload;

        const total = saleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        const sale = await prisma.sale.create({
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

        return {
            success: true,
            message: "Sale created successfully",
            data: sale
        }
    } catch (error) {   
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error creating sale",
            data: null
        };
    }
}

export const getSaleById = async (id: number): Promise<ServiceResponseType<Sale>> => {
    try {
        const sale = await prisma.sale.findUnique({
            where: {
                id
            },
            include: {
                saleItems: true
            }
        });

        if (!sale) {
            return {
                success: false,
                message: "Sale not found",
                data: null
            };
        }

        return {
            success: true,
            message: "Sale fetched successfully",
            data: sale
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error fetching sale",
            data: null
        };
    }
}
export const deleteSale = async (id: number): Promise<ServiceResponseType<Sale>> => {
    try {
        const sale = await prisma.sale.delete({
            where: {
                id
            },
            include: {
                saleItems: true
            }
        });

        return {
            success: true,
            message: "Sale deleted successfully",
            data: sale
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error deleting sale",
            data: null
        };
    }
}

export const updateSale = async (id: number, payload: createSaleDTO): Promise<ServiceResponseType<Sale>> => {
    try {
        const { date, saleItems } = payload;

        const total = saleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        const sale = await prisma.sale.update({
            where: {
                id
            },
            data: {
                date: new Date(date),
                saleItems: {
                    deleteMany: {
                        itemId: { notIn: saleItems.map(item => item.itemId) }
                    },
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

        return {
            success: true,
            message: "Sale updated successfully",
            data: sale
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error updating sale",
            data: null
        };
    }
}