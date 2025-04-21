import { describe, expect, it } from "vitest";
import { getSaleById, getSales, revenueByYear } from "../services/sale.service";
import { devLogger } from "@/lib/utils";

describe("Sale Service", () => {
    it("should get all sales", async () => {
        const params = {
            page: 1,
            limit: 10,
            startDate: "2",
            endDate: ""
        };

        // Call the function with the mock
        const result = await getSales(params);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.data?.result).toHaveLength(0);
    })

    it("should return sale by id", async () => {
        const res = await getSaleById(1);

        console.log(res.data)
        // Assertions
        expect(res.success).toBe(true);
    })

    it.only("should return yearly sales report", async () => {
        const res = await revenueByYear(2025);

        console.log(res.data);

        expect(res.success).toBe(true);
    })
});