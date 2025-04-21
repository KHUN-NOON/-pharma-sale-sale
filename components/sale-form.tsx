'use client';

import DatePicker from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSaleSchema } from "@sale/zod";
import { useCallback, useEffect, useState } from "react";
import { ClientItem } from '@/modules/pharmacy/types/index';
import { debounce } from 'throttle-debounce';
import { getItemSelectAction } from "@/modules/pharmacy/actions/item.action";
import { ActionResponseType } from "@/types/action.type";
import { Item } from "@/generated/prisma";
import { devLogger } from "@/lib/utils";
import ComboBox from "@/components/ui/combo-box";
import { Trash2 } from "lucide-react";
import { dismissableToaster } from "@/lib/toaster";
import { createSaleAction } from "@sale/actions/sale.action";
import { ClientSale } from "@sale/types";
import FullscreenLoading from "@/components/ui/fullscreen-loading";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";
import { useRouter } from "next/navigation";

type AppendItemType = {
    itemId: number,
    price?: string,
    quantity?: string,
    name: string
}

const SaleForm = () => {
    const method = useForm({
        resolver: zodResolver(createSaleSchema),
        defaultValues: {
            date: new Date().toISOString(),
            saleItems: []
        }
    });

    const [searchItems, setSearchItems] = useState<ClientItem[]>([]);
    const [appendItem, setAppendItem] = useState<AppendItemType | null>(null);
    const [checkoutItems, setCheckoutItems] = useState<AppendItemType[]>([]);
    const [formLoading, setFormLoading] = useState(false);
    const [open, setOpen] = useState(false);
    
    const router = useRouter();

    // Create debounced function only once
    const debouncedSearch = useCallback(
        debounce(1000, async (formData: FormData) => {
            devLogger.log("Executing debounced search");
            const res = await getItemSelectAction({} as ActionResponseType<Item[]>, formData);
            if (res.success) {
                setSearchItems(res.data || []);
            }
        }, { atBegin: false }),
    []);

    // Cleanup on unmount
    useEffect(() => {
        // handleSearch('');
        return () => {
            debouncedSearch.cancel({ upcomingOnly: true });
        };
    }, [debouncedSearch]);

    const handleSearch = (value: string) => {
        const formData = new FormData();
        formData.set('query', value);
        debouncedSearch(formData);
        setAppendItem(null);
    };

    const handleSelectItem = (item: ClientItem) => {
        setAppendItem({
            name: item.name,
            itemId: item.id,
            price: item.price,
            quantity: appendItem?.quantity
        })
    }

    const handleAppendItem = () => {
        if (appendItem) {
            const existedItems = checkoutItems.find(c => c.itemId == appendItem.itemId);

            if (existedItems) {
                dismissableToaster({
                    title: "Checkout Items",
                    description: "Item Already In the List"
                });

                return;
            }

            setCheckoutItems([
                ...checkoutItems,
                appendItem
            ]);
        }
    }

    const checkout = async () => {
        devLogger.log("checkout function starting to works")
        try {
            setFormLoading(true);

            const formData = new FormData();
            formData.set("date", new Date(method.getValues().date).toISOString());
            formData.set("saleItems", JSON.stringify(checkoutItems.map( c => {
                return {
                    ...c,
                    price: Number(c.price),
                    quantity: Number(c.quantity)
                }
            })));

            // Display the values
            for (const value of formData.values()) {
                devLogger.log("formData", value);
            }

            if (checkoutItems.length < 1) {
                dismissableToaster({
                    title: "Check Out",
                    description: "No Items To Check Out!"
                });

                return;
            }

            const res = await createSaleAction({} as ActionResponseType<ClientSale>, formData);

            if (!res.success) {
                console.log(res)
                throw new Error(res.message ?? "Unknown Error");
            }

            dismissableToaster({
                title: "Check Out",
                description: res.message ?? "Success"
            })

            router.replace("/sales")
        } catch(error) {
            dismissableToaster({
                title: "Check Out",
                description: error instanceof Error ? error.message : "Error"
            })
        } finally {
            setFormLoading(false);
        }
    }

    const handleConfirm = () => {
        setOpen(true);
    }

    return (
        <div className="w-full">
            <FullscreenLoading
                isLoading={formLoading}
                text="Checking Out"
            />
            <FormProvider {...method}>
                <form>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <Label htmlFor="name" className="text-right">
                                Date
                            </Label>
                            <Controller
                                name="date"
                                control={method.control}
                                render={({ field }) => (
                                    <DatePicker
                                        date={new Date(field.value)}
                                        onSelect={field.onChange}
                                    />
                                )}
                            />
                            {/* {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>} */}
                        </div>
                        <div className="flex flex-col gap-4">
                            <Label htmlFor="add-item" className="text-right">
                                Add Item
                            </Label>
                            <div className="w-full">
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell colSpan={3}>
                                                <ComboBox
                                                    items={searchItems}
                                                    handleChange={handleSearch}
                                                    handleSelectItem={handleSelectItem}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" min="0.00" step="0.01" placeholder="Price"
                                                    value={appendItem?.price ?? ''}
                                                    onChange={(e) => {
                                                        if (appendItem) {
                                                            setAppendItem({
                                                                ...appendItem,
                                                                price: e.target.value
                                                            })
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" min="0" step="1" placeholder="Quantity"
                                                    value={appendItem?.quantity ?? ''}
                                                    onChange={(e) => {
                                                        if (appendItem) {
                                                            setAppendItem({
                                                                ...appendItem,
                                                                quantity: e.target.value
                                                            });
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button type="button" onClick={handleAppendItem}>
                                                    +
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <Label htmlFor="add-item" className="text-right">
                                CheckOut Items
                            </Label>
                            <div className="w-full">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell>
                                                No.
                                            </TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Price</TableCell>
                                            <TableCell>Quantity</TableCell>
                                            <TableCell>Sub-Total</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {
                                            checkoutItems.length < 1 &&
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-24 text-center">
                                                    No items in the checkout list.
                                                </TableCell>
                                            </TableRow>
                                        }
                                        {checkoutItems && checkoutItems.map((f, idx) => {
                                            return (
                                                <TableRow className="h-14" key={idx}>
                                                    <TableCell>
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        {f.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {f.price?.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {f.quantity?.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {Number(((Number(f.price || 0) * Number(f.quantity || 0))).toFixed(2)).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <button
                                                            onClick={() => {
                                                                const filtered = checkoutItems.filter((c, i) => i !== idx);

                                                                setCheckoutItems(filtered);
                                                            }}
                                                            className="text-red-500"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-right font-medium">
                                                <p className="text-2xl">Total</p>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                <p className="text-2xl">
                                                    {checkoutItems
                                                        .reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0)
                                                        .toLocaleString('en-US', {
                                                            style: 'decimal',
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}
                                                </p>
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end mt-3">
                        <Button onClick={handleConfirm} type="button" className="self-end w-[200px]">
                            Check Out
                        </Button>
                    </div>
                </form>
            </FormProvider>
            <ConfirmDeleteDialog
                open={open} 
                onOpenChange={setOpen}
                callback={checkout}       
                description="This action cannot be undone. This is not editable once you proceed."        
            />
        </div>
    )
}

export default SaleForm;