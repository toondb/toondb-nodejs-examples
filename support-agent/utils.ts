
/**
 * TOON Formatter
 * Formats tabular data into the TOON (Table Object Object Notation) format for efficient token usage.
 * Spec: table_name[count]{fields}: followed by CSV-like rows.
 */
export function rowsToToon(tableName: string, rows: any[], fields: string[]): string {
    if (!rows || rows.length === 0) return "";

    // Header: table_name[count]{field1,field2,...}:
    const header = `${tableName}[${rows.length}]{${fields.join(',')}}:\n`;

    // Body: CSV-like rows
    const body = rows.map(row =>
        fields.map(f => {
            const val = row[f];
            return val !== undefined && val !== null ? String(val) : "∅";
        }).join(',')
    ).join('\n');

    return header + body + (body ? "\n" : "");
}

/**
 * Simple token estimator (approximation for budgeting)
 * Real implementation would use tiktoken or similar.
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}
