
export const SCHEMA = {
    CREATE_ORDERS: `
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            item TEXT,
            status TEXT,
            eta TEXT,
            destination TEXT,
            total REAL
        );
    `,
    CREATE_TICKETS: `
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY,
            order_id INTEGER,
            reason TEXT,
            status TEXT,
            created_at TEXT
        );
    `,
    INSERT_ORDER: `
        INSERT INTO orders (id, user_id, item, status, eta, destination, total) 
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    INSERT_TICKET: `
        INSERT INTO tickets (order_id, reason, status, created_at)
        VALUES (?, ?, ?, ?);
    `
};
