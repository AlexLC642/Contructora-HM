import { Prisma } from "@prisma/client";
import type { DailyReportActivityInput } from "../domain/validation";

const HUNDRED = new Prisma.Decimal(100);

/**
 * Avance que deja un informe al aprobarse: lo aprobado hasta ahora en el
 * cronograma mas lo reportado en el informe. No usa el valor guardado al
 * capturar, porque otros informes pudieron aprobarse mientras tanto.
 */
export function calculateApprovedActivityTotals(
	currentProgress: Prisma.Decimal,
	activity: {
		activityCode: string;
		todayQuantity: Prisma.Decimal;
		contractedQuantity: Prisma.Decimal;
	},
) {
	const contractedQuantity = new Prisma.Decimal(activity.contractedQuantity);
	const todayProgress = contractedQuantity.gt(0)
		? activity.todayQuantity
				.div(contractedQuantity)
				.mul(HUNDRED)
				.toDecimalPlaces(2)
		: activity.todayQuantity.toDecimalPlaces(2);
	const newProgress = currentProgress.add(todayProgress).toDecimalPlaces(2);

	if (newProgress.gt(HUNDRED)) {
		throw new Error(
			`La actividad ${activity.activityCode} supera el 100% con los informes aprobados acumulados.`,
		);
	}

	return { accumulatedQuantity: newProgress, newProgress };
}

export function calculateDailyReportActivity(input: DailyReportActivityInput) {
	const contractedQuantity = new Prisma.Decimal(input.contractedQuantity);
	const previousQuantity = new Prisma.Decimal(input.previousQuantity);
	const todayQuantity = new Prisma.Decimal(input.todayQuantity);
	const previousProgress = new Prisma.Decimal(input.previousProgress);
	const accumulatedQuantity = previousQuantity
		.add(todayQuantity)
		.toDecimalPlaces(2);
	if (
		contractedQuantity.gt(0) &&
		previousQuantity.gte(contractedQuantity) &&
		todayQuantity.gt(0)
	) {
		throw new Error(
			`La actividad ${input.activityCode} ya esta completada y no admite mas cantidad ordinaria.`,
		);
	}
	const newProgress = contractedQuantity.gt(0)
		? accumulatedQuantity
				.div(contractedQuantity)
				.mul(HUNDRED)
				.toDecimalPlaces(2)
		: previousProgress;

	if (newProgress.gt(HUNDRED)) {
		throw new Error(
			`La actividad ${input.activityCode} supera el 100% de avance.`,
		);
	}

	if (newProgress.lt(previousProgress)) {
		throw new Error(
			`La actividad ${input.activityCode} no puede bajar el avance aprobado anterior.`,
		);
	}

	return {
		contractedQuantity,
		previousQuantity,
		todayQuantity,
		accumulatedQuantity,
		previousProgress,
		newProgress,
	};
}
