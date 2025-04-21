'use client';
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/ui/data-table';
import { PaginationControlsProps } from '@/components/ui/pagination-control';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { columns } from "./sale.columns";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";
import FullscreenLoading from "@/components/ui/fullscreen-loading";
import { deleteSaleAction } from "@sale/actions/sale.action";
import { ActionResponseType } from "@/types/action.type";
import { ClientSale } from "@sale/types";
import { dismissableToaster } from "@/lib/toaster";
import { X } from "lucide-react";
import DatePicker from "@/components/ui/date-picker";
import { formatDateSafe } from "@/lib/utils";

const defaultDateRange = {
    startDate: null,
    endDate: null
}

export default function SaleTableWrapper({ data, paginationProps }: { data: any, paginationProps: PaginationControlsProps }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [alertOpen, setAlertOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [dateRange, setDateRange] = useState<{
        startDate: Date | null;
        endDate: Date | null;
    }>(defaultDateRange);


    const handleCreate = () => {
        router.push('/sales/create');
    }

    const handleEdit = (id: number) => {
        router.push(`/sales/${id}`);
    }

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setAlertOpen(true);
    }

    const deleteCallback = async (id: number) => {
        try {
            setIsLoading(true);

            const formData = new FormData();
            formData.set("id", id.toString());

            const res = await deleteSaleAction({} as ActionResponseType<ClientSale>, formData);

            if (!res.success) {
                throw new Error(res.message ?? "Unknown Error");
            }

            dismissableToaster({
                title: "Delete Sale",
                description: res.message ?? "Success"
            });

            router.refresh();
        } catch (error) {
            dismissableToaster({
                title: "Delete Sale",
                description: error instanceof Error ? error.message : "Unknown Error"
            });
        } finally {
            setIsLoading(false);
        }
    }

    const tableColumns = columns({
        edit: handleEdit,
        deleteItem: handleDelete
    });

    const handleSearch = async () => {
        const hasNull = Object.values(dateRange).some(d => d === null);

        if (!hasNull) {
            const params = new URLSearchParams(searchParams);
            const ymdDates = {
                startDate: formatDateSafe(dateRange.startDate),
                endDate: formatDateSafe(dateRange.endDate)
            }

            params.set('page', '1');
            params.set('limit', '10');
            params.set('startDate', ymdDates.startDate.toString());
            params.set('endDate', ymdDates.endDate.toString());

            router.push(`?${params.toString()}`)
        }
    }

    const clearSearch = () => {
        setDateRange(defaultDateRange)
        resetParams();
    }

    const resetParams = () => {
        const params = new URLSearchParams(searchParams);
        
        params.delete('page');
        params.delete('limit');
        params.delete('startDate');
        params.delete('endDate');

        router.push(`?${params.toString()}`)
    }

    const handleStartDate = (date?: Date) => {
        if (date) {
            setDateRange({
                ...dateRange,
                startDate: date
            })
        }
    }

    const handleEndDate = (date?: Date) => {
        if (date) {
            setDateRange({
                ...dateRange,
                endDate: date
            })
        }
    }

    return (
        <>
            <FullscreenLoading
                text="Loading"
                isLoading={isLoading}
            />
            <div className="flex justify-end mb-3">
                <Button onClick={handleCreate}>
                    New Sale
                </Button>
            </div>
            <div className="flex gap-4 items-center mb-3">
                <DatePicker
                    placeholder="Start Date"
                    onSelect={handleStartDate}
                    date={dateRange.startDate ?? undefined}
                />
                <DatePicker
                    placeholder="End Date"
                    onSelect={handleEndDate}
                    date={dateRange.endDate ?? undefined}
                />
                <Button
                    onClick={handleSearch}
                    onKeyDown={handleSearch}
                >
                    Search
                </Button>
                <Button
                    variant='outline'
                    type="button"
                    onClick={clearSearch}
                >
                    <X size={18} />
                </Button>
            </div>
            <DataTable
                columns={tableColumns}
                data={data}
                paginationProps={paginationProps}
            />
            <ConfirmDeleteDialog
                id={deleteId}
                open={alertOpen}
                onOpenChange={setAlertOpen}
                callback={() => deleteCallback(deleteId as number)}
            />
        </>
    )
}