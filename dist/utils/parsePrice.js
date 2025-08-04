export function parsePrices(input) {
    const lines = input.split("\n");
    const prices = {};
    for (const line of lines) {
        const [fuel, price] = line.split(":").map((part) => part.trim());
        if (fuel && price && !isNaN(Number(price))) {
            prices[fuel] = Number(price);
        }
    }
    return prices;
}
