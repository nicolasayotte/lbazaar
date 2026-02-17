/**
 * Format amount as Japanese Yen
 * @param {number} amount - Amount in JPY
 * @returns {string} Formatted string like "¥1,000" or "¥--" as error indicator
 */
export const formatJpy = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '¥--';
    }
    return `¥${parseFloat(amount).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}`;
};

/**
 * Format amount as Cardano ADA
 * @param {number} amount - Amount in ADA
 * @returns {string} Formatted string like "₳10.50" or "₳--" as error indicator
 */
export const formatAda = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '₳--';
    }
    return `₳${parseFloat(amount).toFixed(2)}`;
};

/**
 * Format dual price display (JPY with ADA equivalent)
 * @param {number} jpy - Amount in JPY
 * @param {number} ada - Amount in ADA
 * @returns {string} Formatted string like "¥1,000 (~₳10.50)"
 */
export const formatDualPrice = (jpy, ada) => {
    if (!jpy || jpy <= 0) {
        return formatJpy(0);
    }

    if (!ada || ada <= 0) {
        return formatJpy(jpy);
    }

    return `${formatJpy(jpy)} (~${formatAda(ada)})`;
};

/**
 * Parse formatted JPY string to number
 * @param {string} formattedPrice - Formatted price like "¥1,000" or "1000"
 * @returns {number} Numeric value
 */
export const parseJpy = (formattedPrice) => {
    if (!formattedPrice) return 0;
    const cleaned = String(formattedPrice).replace(/[¥,]/g, '');
    return parseFloat(cleaned) || 0;
};
