type ActivityStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

/**
 * Estado de una actividad según su avance. Solo el bloqueo es decisión del
 * encargado; lo demás sale del porcentaje, para que un informe nunca muestre
 * "En proceso" junto a un 100%.
 */
export function resolveActivityStatus(
	status: ActivityStatus,
	progress: number,
): ActivityStatus {
	if (status === "BLOCKED") return "BLOCKED";
	if (progress >= 100) return "COMPLETED";
	return progress > 0 ? "IN_PROGRESS" : "PENDING";
}
