/**
 * Utility for parsing and calculating payment installments breakdown.
 */

function parseConfigData(config, numInstallments) {
    if (!config || numInstallments <= 1) return null;

    let parsed = config;
    if (typeof config === 'string') {
        const trimmed = config.trim();
        if (!trimmed) return null;
        try {
            parsed = JSON.parse(trimmed);
        } catch (e) {
            // Check for comma-separated string, e.g. "50%, 25%, 25%" or "50, 25, 25"
            const parts = trimmed.split(',').map(s => s.trim().replace('%', ''));
            if (parts.length === numInstallments && parts.every(p => !isNaN(parseFloat(p)))) {
                parsed = parts.map(p => parseFloat(p));
            } else {
                return null;
            }
        }
    }

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed[String(numInstallments)]) {
        parsed = parsed[String(numInstallments)];
    }

    // Format A: direct array of numbers [50, 25, 25] or [30, 10, 10]
    if (Array.isArray(parsed) && parsed.length === numInstallments) {
        if (typeof parsed[0] === 'number') {
            const sum = parsed.reduce((a, b) => a + b, 0);
            if (Math.abs(sum - 100) < 0.5) {
                return {
                    type: 'percentage',
                    items: parsed.map(val => ({ type: 'percentage', value: val }))
                };
            }
            return {
                type: 'amount',
                items: parsed.map(val => ({ type: 'amount', value: val }))
            };
        }

        // Format B: array of objects with percentage and/or amount (allows mixed / hybrid!)
        if (typeof parsed[0] === 'object' && parsed[0] !== null) {
            const items = [];
            for (let i = 0; i < parsed.length; i++) {
                const item = parsed[i];
                if (!item || typeof item !== 'object') return null;

                if (item.amount !== undefined || item.monto !== undefined) {
                    items.push({ type: 'amount', value: parseFloat(item.amount ?? item.monto ?? 0) });
                } else if (item.percentage !== undefined || item.porcentaje !== undefined) {
                    items.push({ type: 'percentage', value: parseFloat(item.percentage ?? item.porcentaje ?? 0) });
                } else if (item.value !== undefined) {
                    const t = item.type === 'amount' || item.tipo === 'monto' ? 'amount' : 'percentage';
                    items.push({ type: t, value: parseFloat(item.value ?? 0) });
                } else {
                    return null;
                }
            }

            const allPct = items.every(it => it.type === 'percentage');
            const allAmt = items.every(it => it.type === 'amount');
            const type = allPct ? 'percentage' : (allAmt ? 'amount' : 'mixed');
            return { type, items };
        }
    }

    // Format C: object with type and values / installments
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const rawList = parsed.values || parsed.installments || parsed.cuotas;
        if (Array.isArray(rawList) && rawList.length === numInstallments) {
            const defaultType = (parsed.type === 'amount' || parsed.tipo === 'monto') ? 'amount' : 'percentage';
            const items = rawList.map(v => {
                if (typeof v === 'object' && v !== null) {
                    if (v.amount !== undefined || v.monto !== undefined) {
                        return { type: 'amount', value: parseFloat(v.amount ?? v.monto ?? 0) };
                    }
                    if (v.percentage !== undefined || v.porcentaje !== undefined) {
                        return { type: 'percentage', value: parseFloat(v.percentage ?? v.porcentaje ?? 0) };
                    }
                    const t = v.type === 'amount' || v.tipo === 'monto' ? 'amount' : (v.type === 'percentage' ? 'percentage' : defaultType);
                    return { type: t, value: parseFloat(v.value ?? 0) };
                }
                return { type: defaultType, value: parseFloat(v) };
            });

            const allPct = items.every(it => it.type === 'percentage');
            const allAmt = items.every(it => it.type === 'amount');
            const type = allPct ? 'percentage' : (allAmt ? 'amount' : 'mixed');
            return { type, items };
        }
    }

    return null;
}

function calculateInstallmentsBreakdown(totalAmount, numInstallments, config) {
    const n = Math.max(1, Math.floor(numInstallments || 1));
    const total = parseFloat(totalAmount) || 0;
    const decimals = 2;
    const factor = Math.pow(10, decimals);
    const totalUnits = Math.round(total * factor);

    if (n === 1) {
        return {
            isCustom: false,
            type: 'equal',
            firstInstallmentAmount: total.toFixed(decimals),
            installments: [{
                number: 1,
                amount: total,
                formattedAmount: total.toFixed(decimals),
                percentage: 100,
                percentageLabel: ''
            }]
        };
    }

    const configData = parseConfigData(config, n);

    if (configData && configData.items && configData.items.length === n) {
        const items = configData.items;

        let fixedSum = 0;
        let pctSum = 0;
        items.forEach(it => {
            if (it.type === 'amount') fixedSum += it.value;
            if (it.type === 'percentage') pctSum += it.value;
        });

        const pctOfRemaining = configData.type === 'mixed' && Math.abs(pctSum - 100) < 0.5;
        const fixedUnits = Math.round(fixedSum * factor);
        const remainingUnits = Math.max(0, totalUnits - fixedUnits);

        const installments = [];
        let allocatedUnits = 0;

        for (let i = 0; i < n; i++) {
            const it = items[i];
            const isLast = (i === n - 1);
            let units = 0;
            let pctLabel = '';
            let pctVal = null;

            if (it.type === 'amount') {
                units = Math.round(it.value * factor);
                pctVal = total > 0 ? Math.round((it.value / total) * 100) : null;
                pctLabel = '';
            } else {
                const basePoolUnits = pctOfRemaining ? remainingUnits : totalUnits;
                units = Math.round(basePoolUnits * (it.value / 100));
                pctVal = it.value;
                pctLabel = `${it.value}%`;
            }

            if (isLast) {
                units = totalUnits - allocatedUnits;
            } else {
                allocatedUnits += units;
            }

            const amt = units / factor;
            installments.push({
                number: i + 1,
                amount: amt,
                formattedAmount: amt.toFixed(decimals),
                percentage: pctVal,
                percentageLabel: pctLabel
            });
        }

        return {
            isCustom: true,
            type: configData.type,
            firstInstallmentAmount: installments[0]?.formattedAmount || (total / n).toFixed(decimals),
            installments
        };
    }

    // Default: equal distribution
    const baseUnits = Math.floor(totalUnits / n);
    const remainder = totalUnits - (baseUnits * n);
    const installments = [];

    for (let i = 1; i <= n; i++) {
        const units = (i === n) ? (baseUnits + remainder) : baseUnits;
        const amt = units / factor;
        installments.push({
            number: i,
            amount: amt,
            formattedAmount: amt.toFixed(decimals),
            percentage: Math.round((100 / n) * 10) / 10,
            percentageLabel: ''
        });
    }

    return {
        isCustom: false,
        type: 'equal',
        firstInstallmentAmount: installments[0]?.formattedAmount || (total / n).toFixed(decimals),
        installments
    };
}

module.exports = {
    parseConfigData,
    calculateInstallmentsBreakdown
};
