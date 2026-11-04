import type { ReactNode } from "react";

/** Encabezado común de los módulos: título, qué hace y sus acciones. */
export function PageHeader({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children?: ReactNode;
}) {
	return (
		<header className="hm-page-header">
			<div className="hm-page-header__copy">
				<h1>{title}</h1>
				<p>{description}</p>
			</div>
			{children ? (
				<div className="hm-page-header__actions">{children}</div>
			) : null}
		</header>
	);
}
