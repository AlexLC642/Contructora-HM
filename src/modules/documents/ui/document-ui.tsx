import type { LucideIcon } from "lucide-react";

export function DocumentEmpty({
	icon: Icon,
	title,
	detail,
	action,
}: {
	icon: LucideIcon;
	title: string;
	detail: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="documents-empty">
			<span className="documents-empty__icon">
				<Icon aria-hidden="true" size={25} strokeWidth={1.7} />
			</span>
			<p className="mt-4 text-base font-bold text-[#172123]">{title}</p>
			<p className="mt-1 max-w-md text-sm leading-6 text-[#65736e]">{detail}</p>
			{action ? <div className="mt-4">{action}</div> : null}
		</div>
	);
}

export function DocumentStatus({
	status,
	label,
}: {
	status: string;
	label: string;
}) {
	const tone =
		status === "APPROVED"
			? "success"
			: status === "REVIEW"
				? "warning"
				: status === "ARCHIVED"
					? "neutral"
					: "draft";

	return (
		<span className={`documents-status documents-status--${tone}`}>
			<span aria-hidden="true" />
			{label}
		</span>
	);
}

export const documentInputClass = "documents-input focus-ring";
