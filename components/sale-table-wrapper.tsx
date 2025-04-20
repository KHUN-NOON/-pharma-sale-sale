'use client';
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/ui/data-table';
import { PaginationControlsProps } from '@/components/ui/pagination-control';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { columns } from "./sale.columns";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";

export default function SaleTableWrapper({ data, paginationProps }: { data: any, paginationProps: PaginationControlsProps }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [alertOpen, setAlertOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
   
    const handleCreate = () => {
        router.push('/sales/create');
    }

    const handleEdit = (id: number) => {
        router.push(`/sales/${id}`);
    }

    const handleDelete = (id: number) => {

    }

    const deleteCallback = async (id: number) => {

    }

    const tableColumns = columns({
        edit: handleEdit,
        deleteItem: handleDelete
    });

    return (
        <>
            <div className="flex justify-end mb-3">
                <Button onClick={handleCreate}>
                    New Sale
                </Button>
            </div>
            <div className="flex gap-4 items-center mb-3">

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