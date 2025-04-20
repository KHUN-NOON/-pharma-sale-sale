'use client';
import {
    ColumnDef
} from "@tanstack/react-table" 
import { Eye, Trash2 } from 'lucide-react';

type ItemRow = {
    id: number;
    date: string;
    total: number;
}

type columnProps = {
    edit: (id: number) => void;
    deleteItem: (id: number) => void;
}

export const columns = ({edit, deleteItem}: columnProps): ColumnDef<ItemRow>[]  => {
    return [
        {
            accessorKey: "id",
            header: "ID",
            size: 50,
        },
        {
            accessorKey: "date",
            header: "Date",
            size: 150,
            cell({row}) {
                return new Date(row.original.date).toLocaleDateString(["en-GB"]);
            }
        },
        {
            accessorKey: "total",
            header: "Total",
            size: 100,
            cell({row}) {
                return row.original.total.toFixed(2).toLocaleString();
            }
        },
        {
            accessorKey: "actions",
            header: "Actions",
            size: 100,
            cell({row}) {
                return (
                    <div className="flex gap-4">
                        <button onClick={() => edit(row.original.id)}>
                            <Eye size={16}/>
                        </button>
                        <button onClick={() => deleteItem(row.original.id)} className="text-red-500">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                )
            }
        }
    ];
}