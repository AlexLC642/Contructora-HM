import { ArrowLeftRight, PackageSearch, Rows3 } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";

type View = "stock" | "movement" | "catalog";
export function InventoryWorkspaceHeader({ view }: { view: View }) {
	const links = [
		["stock", "Stock", PackageSearch],
		["movement", "Movimientos", ArrowLeftRight],
		["catalog", "Catálogo", Rows3],
	] as const;

	return (
		<PageHeader
			description="Consulta las existencias de cada bodega o registra movimientos."
			title="Inventario"
		>
			<nav
				aria-label="Vistas de inventario"
				className="hm-segmented inventory-scrollbar"
			>
				{links.map(([key, label, Icon]) => (
					<a
						aria-current={view === key ? "page" : undefined}
						className="inventory-main-tab focus-ring"
						href={`/inventory?view=${key}`}
						key={key}
					>
						<Icon aria-hidden="true" size={16} />
						{label}
					</a>
				))}
			</nav>
		</PageHeader>
	);
}
