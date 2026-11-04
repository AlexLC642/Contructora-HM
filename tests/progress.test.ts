import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
	calculateApprovedActivityTotals,
	calculateDailyReportActivity,
} from "@/modules/progress/application/calculations";
import { resolveActivityStatus } from "@/modules/progress/domain/activity-status";
import { pendingProgressByActivity } from "@/modules/progress/domain/pending-progress";
import { dailyReportInputSchema } from "@/modules/progress/domain/validation";

describe("daily progress calculations", () => {
	it("calculates accumulated quantity and new progress", () => {
		const result = calculateDailyReportActivity({
			scheduleActivityId: "activity-1",
			activityCode: "1",
			activityName: "Levantado de block",
			budgetSectionCode: "1",
			budgetSectionName: "Levantado de block",
			workDescription: "Avance de muro",
			unit: "m2",
			contractedQuantity: "100",
			previousQuantity: "35",
			todayQuantity: "15",
			previousProgress: "35",
			status: "IN_PROGRESS",
			issues: "",
			position: 1,
		});

		expect(result.accumulatedQuantity.toString()).toBe("50");
		expect(result.newProgress.toString()).toBe("50");
	});

	it("rejects progress greater than 100 percent", () => {
		expect(() =>
			calculateDailyReportActivity({
				scheduleActivityId: "activity-1",
				activityCode: "1",
				activityName: "Levantado de block",
				budgetSectionCode: "1",
				budgetSectionName: "Levantado de block",
				workDescription: "Avance de muro",
				unit: "m2",
				contractedQuantity: "100",
				previousQuantity: "90",
				todayQuantity: "20",
				previousProgress: "90",
				status: "IN_PROGRESS",
				issues: "",
				position: 1,
			}),
		).toThrow("supera el 100%");
	});

	it("rejects ordinary quantities after an activity is complete", () => {
		expect(() =>
			calculateDailyReportActivity({
				scheduleActivityId: "activity-1",
				activityCode: "1",
				activityName: "Levantado de block",
				budgetSectionCode: "1",
				budgetSectionName: "Levantado de block",
				workDescription: "Actividad completada",
				unit: "m2",
				contractedQuantity: "53",
				previousQuantity: "53",
				todayQuantity: "1",
				previousProgress: "100",
				status: "COMPLETED",
				issues: "",
				position: 1,
			}),
		).toThrow("ya esta completada");
	});

	it("uses the physical unit instead of treating quantities as percentages", () => {
		const result = calculateDailyReportActivity({
			scheduleActivityId: "activity-1",
			activityCode: "2",
			activityName: "Levantado de tablayeso",
			budgetSectionCode: "2",
			budgetSectionName: "Levantado de tablayeso",
			workDescription: "Avance de muro",
			unit: "m2",
			contractedQuantity: "53",
			previousQuantity: "35",
			todayQuantity: "10",
			previousProgress: "66.04",
			status: "IN_PROGRESS",
			issues: "",
			position: 1,
		});

		expect(result.accumulatedQuantity.toString()).toBe("45");
		expect(result.newProgress.toString()).toBe("84.91");
	});
});

describe("avance acumulado entre informes", () => {
	const approve = (current: string, today: string) =>
		calculateApprovedActivityTotals(new Prisma.Decimal(current), {
			activityCode: "2",
			todayQuantity: new Prisma.Decimal(today),
			contractedQuantity: new Prisma.Decimal(100),
		}).newProgress.toString();

	it("suma cada informe aprobado: 30% y luego 40% dan 70%", () => {
		expect(approve("0", "30")).toBe("30");
		expect(approve("30", "40")).toBe("70");
	});

	it("rechaza la aprobacion que pasaria del 100%", () => {
		expect(() => approve("70", "40")).toThrow("supera el 100%");
	});

	const review = (id: string, date: string, today: number) => ({
		id,
		reportDate: new Date(date),
		createdAt: new Date(date),
		activities: [
			{
				scheduleActivityId: "a1",
				todayQuantity: today,
				contractedQuantity: 100,
			},
		],
	});

	it("un informe nuevo parte de lo que sigue en revision", () => {
		const pending = pendingProgressByActivity(
			[review("r1", "2026-10-01", 30)],
			null,
		);
		expect(pending.get("a1")).toBe(30);
	});

	it("al corregir un informe solo cuentan los anteriores a el", () => {
		const reports = [
			review("r1", "2026-10-01", 30),
			review("r2", "2026-10-08", 40),
			review("r3", "2026-10-15", 10),
		];
		expect(pendingProgressByActivity(reports, reports[1]).get("a1")).toBe(30);
	});

	it("el estado sigue al porcentaje, salvo el bloqueo", () => {
		expect(resolveActivityStatus("IN_PROGRESS", 100)).toBe("COMPLETED");
		expect(resolveActivityStatus("COMPLETED", 70)).toBe("IN_PROGRESS");
		expect(resolveActivityStatus("PENDING", 0)).toBe("PENDING");
		expect(resolveActivityStatus("BLOCKED", 100)).toBe("BLOCKED");
	});
});

describe("materiales usados en obra", () => {
	const report = {
		reportNumber: "INF-20260913-01",
		reportDate: "2026-09-13",
		siteManager: "Encargado",
		activities: [
			{
				activityCode: "1",
				activityName: "Muro",
				workDescription: "Avance del día",
				contractedQuantity: "100",
				previousQuantity: "0",
				todayQuantity: "10",
				previousProgress: "0",
				status: "IN_PROGRESS",
				position: 1,
			},
		],
	};

	it("requiere que todo consumo provenga de una entrega a la obra", () => {
		const result = dailyReportInputSchema.safeParse({
			...report,
			materialEntries: [
				{
					materialName: "Cemento",
					quantityUsed: "2",
					wasteQuantity: "0",
					returnedQuantity: "0",
					position: 1,
				},
			],
		});

		expect(result.success).toBe(false);
	});
});
