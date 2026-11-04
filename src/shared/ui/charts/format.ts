const currencyFullFormatter = new Intl.NumberFormat("es-GT", {
	style: "currency",
	currency: "GTQ",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const currencyTickFormatter = new Intl.NumberFormat("es-GT", {
	style: "currency",
	currency: "GTQ",
	maximumFractionDigits: 2,
	minimumFractionDigits: 0,
});

export function moneyFull(value: number) {
	return currencyFullFormatter.format(value);
}

/** Marcas del eje de una gráfica: monto completo, sin ceros decimales de más. */
export function moneyTick(value: number) {
	return currencyTickFormatter.format(value);
}

export function percent(value: number | null | undefined, decimals = 1) {
	if (value === null || value === undefined || Number.isNaN(value))
		return "Sin datos";
	return `${value.toFixed(decimals)}%`;
}

export function progressGap(value: number | null | undefined, decimals = 1) {
	if (value === null || value === undefined || Number.isNaN(value))
		return "Sin datos";
	if (Math.abs(value) < 0.05) return "Al día";

	const magnitude = Number(Math.abs(value).toFixed(decimals)).toString();
	return value < 0 ? `Atraso de ${magnitude}%` : `Adelanto de ${magnitude}%`;
}

export function shortDate(value: string) {
	return new Intl.DateTimeFormat("es-GT", {
		day: "2-digit",
		month: "short",
	}).format(new Date(value));
}
