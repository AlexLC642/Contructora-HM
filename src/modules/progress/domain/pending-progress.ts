type PendingReport = {
	id: string;
	reportDate: Date;
	createdAt: Date;
	activities: {
		scheduleActivityId: string | null;
		todayQuantity: number;
		contractedQuantity: number;
	}[];
};

type ReportRef = { id: string; reportDate: Date; createdAt: Date };

function isEarlier(report: ReportRef, other: ReportRef) {
	const byDate = report.reportDate.getTime() - other.reportDate.getTime();
	if (byDate !== 0) return byDate < 0;
	return report.createdAt.getTime() < other.createdAt.getTime();
}

/**
 * Porcentaje por actividad que ya se reportó en informes en revisión. El
 * cronograma solo suma al aprobar, así que sin esto un segundo informe (30% y
 * luego 40%) mostraría 40% de acumulado en lugar de 70%.
 *
 * Al corregir un informe solo cuentan los anteriores a él; uno nuevo parte de
 * todos los que estén en revisión.
 */
export function pendingProgressByActivity(
	reportsInReview: readonly PendingReport[],
	current: ReportRef | null,
) {
	const pending = new Map<string, number>();
	for (const report of reportsInReview) {
		if (current && (report.id === current.id || !isEarlier(report, current)))
			continue;
		for (const activity of report.activities) {
			if (!activity.scheduleActivityId) continue;
			const percent =
				activity.contractedQuantity > 0
					? (activity.todayQuantity / activity.contractedQuantity) * 100
					: activity.todayQuantity;
			pending.set(
				activity.scheduleActivityId,
				(pending.get(activity.scheduleActivityId) ?? 0) + percent,
			);
		}
	}
	return pending;
}
