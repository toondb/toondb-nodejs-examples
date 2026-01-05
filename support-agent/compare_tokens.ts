import * as tiktoken from "gpt-3-encoder";

// Real data from the support-agent output
const jsonFormat = JSON.stringify([
    {
        "id": 103,
        "item": "USB-C Hub",
        "status": "DELAYED",
        "eta": "2023-10-10",
        "destination": "Seattle, WA",
        "total": 35
    },
    {
        "id": 102,
        "item": "Mechanical Keyboard",
        "status": "IN_TRANSIT",
        "eta": "2023-10-05",
        "destination": "Seattle, WA",
        "total": 129.5
    },
    {
        "id": 101,
        "item": "Laptop Stand",
        "status": "DELIVERED",
        "eta": "2023-10-01",
        "destination": "Seattle, WA",
        "total": 45.99
    }
]);

const toonFormat = `orders[3]{id,item,status,eta,destination,total}:
103,USB-C Hub,DELAYED,2023-10-10,Seattle, WA,35
102,Mechanical Keyboard,IN_TRANSIT,2023-10-05,Seattle, WA,129.5
101,Laptop Stand,DELIVERED,2023-10-01,Seattle, WA,45.99
`;

const jsonTokens = tiktoken.encode(jsonFormat);
const toonTokens = tiktoken.encode(toonFormat);

console.log("📊 Token Comparison (Real Data from Support Agent)\n");
console.log("JSON Format:");
console.log(jsonFormat);
console.log(`\nTokens: ${jsonTokens.length}\n`);

console.log("─".repeat(60));

console.log("\nTOON Format:");
console.log(toonFormat);
console.log(`Tokens: ${toonTokens.length}\n`);

console.log("─".repeat(60));

const savings = ((jsonTokens.length - toonTokens.length) / jsonTokens.length * 100).toFixed(1);
console.log(`\n✨ Token Savings: ${jsonTokens.length} → ${toonTokens.length} (${savings}% reduction)`);
