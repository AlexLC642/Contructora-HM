import type { ProjectStatus } from "@prisma/client";
import {
	Archive,
	Calculator,
	CalendarDays,
	CheckCircle2,
	ClipboardList,
	FileText,
	FolderKanban,
	FolderOpen,
	MapPin,
	Pencil,
	Plus,
	RotateCcw,
	Search,
	UserRound,
	Wallet,
} from "lucide-react";
import {
	hasPortfolioAccess,
	requirePermission,
} from "@/modules/auth/application/authorization";
import {
	archiveProjectAction,
	completeProjectAction,
	reactivateProjectAction,
} from "@/modules/projects/application/actions";
import { listProjects } from "@/modules/projects/application/queries";
import {
	projectStatuses,
	projectStatusLabels,
} from "@/modules/projects/domain/validation";
import {
	ActionMenu,
	ActionMenuButton,
	ActionMenuLink,
	ActionMenuScope,
	ActionMenuSeparator,
} from "@/shared/ui/action-menu";
import { AutoFilterForm } from "@/shared/ui/auto-filter-form";
import { PageHeader } from "@/shared/ui/page-header";
import { displayUserName } from "@/shared/utils/display-user-name";

const currencyFormatter = new Intl.NumberFormat("es-GT", {
	style: "currency",
	currency: "GTQ",
});

const inputClass =
	"focus-ring h-11 w-full rounded-xl border border-[#d3d9d3] bg-white px-3 text-sm text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_rgba(17,24,39,0.02)] transition placeholder:text-[#8a9490] hover:border-[#b7bfb8]";
const panelClass =
	"rounded-[20px] border border-[#d7dcd5] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_3px_8px_rgba(23,29,31,0.05),0_20px_46px_rgba(23,29,31,0.1)]";

const statusTone: Record<ProjectStatus, string> = {
	DRAFT: "bg-[#eef1ef] text-[#58635f] ring-[#d8ddd7]",
	PLANNING: "bg-blue-50 text-blue-800 ring-blue-200",
	ACTIVE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
	PAUSED: "bg-amber-50 text-amber-900 ring-amber-200",
	COMPLETED: "bg-[#eaf1ff] text-[#1d4ed8] ring-blue-200",
	ARCHIVED: "bg-[#f4f0ed] text-[#59615d] ring-[#d8d7d2]",
	CANCELED: "bg-red-50 text-red-800 ring-red-200",
};

function statusRisk(status: ProjectStatus, progress: number) {
	if (status === "ARCHIVED") return "Archivado";
	if (status === "CANCELED") return "Detenido";
	if (status === "PAUSED") return "Pausado";
	if (status === "COMPLETED" || progress >= 100) return "Finalizado";
	if (status === "ACTIVE" && progress >= 20) return "En ritmo";
	if (status === "ACTIVE") return "Arranque";
	return "Planificacion";
}

type ProjectsPageProps = {
	searchParams: Promise<{
		search?: string;
		status?: string;
	}>;
};

export default async function ProjectsPage({
	searchParams,
}: ProjectsPageProps) {
	const user = await requirePermission("proyectos.ver");
	const canSeePortfolio = hasPortfolioAccess(user);
	const params = await searchParams;
	const status =
		params.status === "ALL" ||
		params.status === "OPERATIVE" ||
		projectStatuses.includes(params.status as ProjectStatus)
			? (params.status as ProjectStatus | "ALL" | "OPERATIVE")
			: "OPERATIVE";
	const projects = await listProjects({ search: params.search, status }, user);
	const canCreate = user.permissions.includes("proyectos.crear");

	const canEditProjects = user.permissions.includes("proyectos.editar");
	const canSeeFinances = user.permissions.includes("finanzas.ver");

	function renderProjectMenu(project: (typeof projects)[number]) {
		const base = `/projects/${project.id}`;
		const canComplete =
			project.status !== "COMPLETED" && project.status !== "ARCHIVED";
		const canReactivate =
			project.status === "ARCHIVED" ||
			project.status === "COMPLETED" ||
			project.status === "PAUSED";
		return (
			<ActionMenu label={`Acciones de ${project.code}`}>
				<ActionMenuLink
					href={base}
					icon={<FolderOpen aria-hidden="true" size={14} />}
				>
					Abrir expediente
				</ActionMenuLink>
				<ActionMenuLink
					href={`${base}/budget`}
					icon={<Calculator aria-hidden="true" size={14} />}
				>
					Presupuesto
				</ActionMenuLink>
				<ActionMenuLink
					href={`${base}/schedule`}
					icon={<CalendarDays aria-hidden="true" size={14} />}
				>
					Cronograma
				</ActionMenuLink>
				<ActionMenuLink
					href={`${base}/progress`}
					icon={<ClipboardList aria-hidden="true" size={14} />}
				>
					Avance diario
				</ActionMenuLink>
				<ActionMenuLink
					href={`${base}/documents`}
					icon={<FileText aria-hidden="true" size={14} />}
				>
					Documentos
				</ActionMenuLink>
				{canSeeFinances ? (
					<ActionMenuLink
						href={`${base}/finance`}
						icon={<Wallet aria-hidden="true" size={14} />}
					>
						Finanzas
					</ActionMenuLink>
				) : null}
				{canEditProjects ? (
					<>
						<ActionMenuSeparator />
						<ActionMenuLink
							href={`${base}/information`}
							icon={<Pencil aria-hidden="true" size={14} />}
						>
							Editar información
						</ActionMenuLink>
						{canComplete ? (
							<form action={completeProjectAction.bind(null, project.id)}>
								<ActionMenuButton
									icon={<CheckCircle2 aria-hidden="true" size={14} />}
									tone="success"
								>
									Finalizar
								</ActionMenuButton>
							</form>
						) : null}
						{project.status === "COMPLETED" ? (
							<form action={archiveProjectAction.bind(null, project.id)}>
								<ActionMenuButton
									icon={<Archive aria-hidden="true" size={14} />}
									tone="warning"
								>
									Archivar
								</ActionMenuButton>
							</form>
						) : null}
						{canReactivate ? (
							<form action={reactivateProjectAction.bind(null, project.id)}>
								<ActionMenuButton
									icon={<RotateCcw aria-hidden="true" size={14} />}
								>
									Reactivar
								</ActionMenuButton>
							</form>
						) : null}
					</>
				) : null}
			</ActionMenu>
		);
	}

	return (
		<main className="projects-workspace mx-auto max-w-[1520px] space-y-5">
			<PageHeader
				description="Sigue el presupuesto, el avance y el responsable de cada obra."
				title={canSeePortfolio ? "Proyectos" : "Proyectos asignados"}
			>
				{canCreate ? (
					<a
						className="hm-action hm-action--primary focus-ring"
						href="/projects/new"
					>
						<Plus aria-hidden="true" size={18} /> Nuevo proyecto
					</a>
				) : null}
			</PageHeader>

			<AutoFilterForm
				action="/projects"
				className={`${panelClass} projects-filter-panel grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_240px]`}
			>
				<div className="relative">
					<Search
						aria-hidden="true"
						className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8580]"
						size={18}
					/>
					<input
						className={`${inputClass} pl-10`}
						name="search"
						placeholder="Buscar por codigo, proyecto, cliente o identificador"
						defaultValue={params.search ?? ""}
					/>
				</div>
				<select className={inputClass} name="status" defaultValue={status}>
					<option value="OPERATIVE">Operativos</option>
					<option value="ALL">Todos los estados</option>
					{projectStatuses.map((item) => (
						<option key={item} value={item}>
							{projectStatusLabels[item]}
						</option>
					))}
				</select>
			</AutoFilterForm>

			<section className={`${panelClass} projects-panel overflow-hidden`}>
				<div className="projects-panel__header flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe5df] bg-[#f8f7f4] px-5 py-4">
					<div>
						<h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#1b2225]">
							Seguimiento de proyectos
						</h2>
					</div>
					<span className="rounded-full border border-[#dfe5df] bg-white px-3 py-1 text-xs font-semibold text-[#46504c] shadow-[0_6px_14px_rgba(16,20,20,0.04)]">
						{projects.length} resultados
					</span>
				</div>

				<ActionMenuScope className="projects-list divide-y divide-[#e6e9e3] bg-[#f4f3f1]">
					{projects.map((project) => {
						const progress = project.progressPercentage.toNumber();
						const risk = statusRisk(project.status, progress);
						return (
							<article
								className="projects-list__row grid gap-4 border-b border-[#e4e8e1] bg-white/70 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_26px_rgba(17,24,39,0.06)] 2xl:grid-cols-[minmax(280px,1fr)_210px_180px_430px] 2xl:items-center"
								data-action-row=""
								key={project.id}
							>
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<a
											className="text-lg font-semibold text-[#101416] underline-offset-4 hover:underline"
											href={`/projects/${project.id}`}
										>
											{project.code}
										</a>
										<span
											className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusTone[project.status]}`}
										>
											{projectStatusLabels[project.status]}
										</span>
										<span className="rounded-full bg-[#f2f4f0] px-2.5 py-1 text-xs font-semibold text-[#46504c]">
											{risk}
										</span>
									</div>
									<h3 className="mt-1 truncate text-base font-semibold text-[#1a2326]">
										{project.name}
									</h3>
									<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
										<span className="inline-flex items-center gap-1.5">
											<UserRound aria-hidden="true" size={15} />
											{project.client?.name ?? "Sin cliente"}
										</span>
										<span className="inline-flex items-center gap-1.5">
											<MapPin aria-hidden="true" size={15} />
											{project.location ?? "Sin ubicacion"}
										</span>
									</div>
								</div>

								<div className="projects-list__fact rounded-xl bg-[#f8faf8] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
									<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#58635f]">
										Responsable
									</p>
									<p className="mt-1 font-medium text-[#1d2427]">
										{displayUserName(
											project.responsible?.name ?? "Sin asignar",
										)}
									</p>
									<p className="mt-1 text-sm text-[var(--muted)]">
										{project.members.length} integrantes
									</p>
								</div>

								<div className="projects-list__fact rounded-xl bg-[#f8faf8] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
									<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#58635f]">
										Presupuesto
									</p>
									<p className="mt-1 text-lg font-semibold tabular-nums text-[#1e272b]">
										{currencyFormatter.format(project.baseBudget.toNumber())}
									</p>
									<div className="mt-3 flex items-center gap-2">
										<div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e4e8e2]">
											<div
												className="h-full rounded-full bg-[linear-gradient(90deg,#1f7f64_0%,#4cc18a_100%)]"
												style={{
													width: `${Math.max(0, Math.min(100, progress))}%`,
												}}
											/>
										</div>
										<span className="text-sm font-semibold tabular-nums text-[#273238]">
											{progress.toFixed(1)}%
										</span>
									</div>
								</div>

								<div className="flex flex-wrap gap-2 2xl:justify-end">
									<a
										className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-[#cfd5ce] bg-white px-3 text-sm font-semibold text-[#253033] shadow-[0_8px_16px_rgba(17,24,39,0.04)] transition hover:-translate-y-0.5 hover:bg-[#f5f6f2] hover:shadow-[0_10px_18px_rgba(17,24,39,0.06)]"
										href={`/projects/${project.id}/budget`}
									>
										<Calculator aria-hidden="true" size={16} /> Presupuesto
									</a>
									<a
										className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-[#cfd5ce] bg-white px-3 text-sm font-semibold text-[#253033] shadow-[0_8px_16px_rgba(17,24,39,0.04)] transition hover:-translate-y-0.5 hover:bg-[#f5f6f2] hover:shadow-[0_10px_18px_rgba(17,24,39,0.06)]"
										href={`/projects/${project.id}/schedule`}
									>
										<CalendarDays aria-hidden="true" size={16} /> Cronograma
									</a>
									<a
										className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-[linear-gradient(180deg,#1d8b63_0%,#167154_100%)] px-3 text-sm font-semibold text-white shadow-[0_14px_22px_rgba(24,123,90,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_24px_rgba(24,123,90,0.28)]"
										href={`/projects/${project.id}/progress`}
									>
										<ClipboardList aria-hidden="true" size={16} /> Avance diario
									</a>
									<a
										className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-[#cfd5ce] bg-[#fbfaf6] px-3 text-sm font-semibold text-[#253033] shadow-[0_8px_16px_rgba(17,24,39,0.04)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_18px_rgba(17,24,39,0.06)]"
										href={`/projects/${project.id}`}
									>
										Expediente
									</a>
									{renderProjectMenu(project)}
								</div>
							</article>
						);
					})}
					{projects.length === 0 ? (
						<div className="grid min-h-[360px] place-items-center px-5 py-12 text-center">
							<div>
								<FolderKanban
									aria-hidden="true"
									className="mx-auto text-[#8d9792]"
									size={36}
								/>
								<p className="mt-3 font-semibold">
									{canSeePortfolio
										? "No hay proyectos con esos filtros."
										: "No tienes proyectos asignados con esos filtros."}
								</p>
								<p className="mt-1 text-sm text-[var(--muted)]">
									Ajusta la busqueda o registra un nuevo proyecto.
								</p>
							</div>
						</div>
					) : null}
				</ActionMenuScope>
			</section>
		</main>
	);
}
