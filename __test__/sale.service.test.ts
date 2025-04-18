import { describe, expect, it } from "vitest";
import { getSales } from "../services/sale.service";

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
});