import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/modules/auth/application/authorization";
import { createProjectAction } from "@/modules/projects/application/actions";
import { listAssignableUsers } from "@/modules/projects/application/queries";
import { ProjectForm } from "@/modules/projects/ui/project-form";
import { PageHeader } from "@/shared/ui/page-header";

export default async function NewProjectPage() {
	await requirePermission("proyectos.crear");
	const users = await listAssignableUsers();

	return (
		<main className="project-create-workspace mx-auto max-w-[1280px] space-y-6 pb-10">
			<PageHeader
				description="Construye el expediente inicial de la obra"
				title="Crear nuevo proyecto"
			>
				<a className="hm-action focus-ring" href="/projects">
					<ArrowLeft aria-hidden="true" size={16} /> Volver a proyectos
				</a>
			</PageHeader>
			<ProjectForm
				action={createProjectAction}
				users={users}
				submitLabel="Crear proyecto"
			/>
		</main>
	);
}
