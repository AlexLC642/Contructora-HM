"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { BuildLoader } from "./page-loading";

type Activity = "page" | "action" | "document";
type Phase = "idle" | "running" | "finishing";

const labels: Record<Activity, string> = {
	page: "Cargando…",
	action: "Procesando…",
	document: "Generando documento…",
};

/** Si una navegación nunca termina (descarga, enlace cancelado), no se queda fija. */
const NAVIGATION_TIMEOUT_MS = 20_000;
const FINISH_ANIMATION_MS = 280;

/** Solicitudes de fondo que no responden a algo que hizo la persona. */
const BACKGROUND_REQUESTS = ["/offline-sync", "/api/notifications"];

function classifyRequest(
	input: RequestInfo | URL,
	init?: RequestInit,
): Activity | null {
	const request = input instanceof Request ? input : null;
	const url = new URL(
		request ? request.url : String(input),
		window.location.href,
	);
	if (url.origin !== window.location.origin) return null;
	if (BACKGROUND_REQUESTS.some((path) => url.pathname.includes(path)))
		return null;

	const headers = new Headers(init?.headers ?? request?.headers);
	if (headers.has("next-router-prefetch")) return null;
	if (headers.has("next-action")) return "action";
	if (headers.has("rsc")) return "page";
	const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
	return method === "GET" ? null : "action";
}

function isDocumentPath(pathname: string) {
	return pathname.endsWith("/print") || pathname.endsWith("/report");
}

function Progress() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const search = searchParams.toString();
	const [phase, setPhase] = useState<Phase>("idle");
	const [activity, setActivity] = useState<Activity>("page");
	const navigating = useRef(false);
	const pendingRequests = useRef(0);
	const finishTimer = useRef<number | undefined>(undefined);
	const navigationTimer = useRef<number | undefined>(undefined);

	const refresh = useCallback(() => {
		window.clearTimeout(finishTimer.current);
		if (navigating.current || pendingRequests.current > 0) {
			setPhase("running");
			return;
		}
		setPhase((current) => (current === "idle" ? "idle" : "finishing"));
		finishTimer.current = window.setTimeout(
			() => setPhase("idle"),
			FINISH_ANIMATION_MS,
		);
	}, []);

	const startNavigation = useCallback(
		(next: Activity) => {
			setActivity(next);
			navigating.current = true;
			window.clearTimeout(navigationTimer.current);
			navigationTimer.current = window.setTimeout(() => {
				navigating.current = false;
				refresh();
			}, NAVIGATION_TIMEOUT_MS);
			refresh();
		},
		[refresh],
	);

	// La ruta cambió: la navegación que estaba en curso ya terminó.
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname y search son el disparador.
	useEffect(() => {
		navigating.current = false;
		window.clearTimeout(navigationTimer.current);
		refresh();
	}, [pathname, search, refresh]);

	useEffect(() => {
		function onClick(event: MouseEvent) {
			if (event.button !== 0) return;
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
				return;
			const link = (event.target as Element | null)?.closest?.("a[href]");
			if (!(link instanceof HTMLAnchorElement)) return;
			if (link.hasAttribute("download")) return;
			if (link.target && link.target !== "_self") return;
			const url = new URL(link.href);
			if (url.origin !== window.location.origin) return;
			if (url.pathname.startsWith("/api/")) return;
			const current = window.location;
			if (url.pathname === current.pathname && url.search === current.search)
				return;
			startNavigation(isDocumentPath(url.pathname) ? "document" : "page");
		}

		// Los formularios con Server Action cancelan el envío nativo y se cuentan
		// por su solicitud; aquí solo llegan los que recargan la página (filtros).
		function onSubmit(event: SubmitEvent) {
			if (event.defaultPrevented) return;
			const form = event.target;
			if (!(form instanceof HTMLFormElement)) return;
			if (form.target && form.target !== "_self") return;
			if (form.method === "dialog") return;
			startNavigation("page");
		}

		// Al volver con el botón Atrás el navegador restaura la página tal como quedó.
		function onPageShow(event: PageTransitionEvent) {
			if (!event.persisted) return;
			navigating.current = false;
			refresh();
		}

		// Server Actions y navegaciones de Next.js no avisan a toda la aplicación
		// cuándo empiezan y terminan; su solicitud es la única señal común.
		const originalFetch = window.fetch;
		window.fetch = (input, init) => {
			const kind = classifyRequest(input, init);
			if (!kind) return originalFetch.call(window, input, init);
			if (kind === "action") setActivity("action");
			pendingRequests.current += 1;
			refresh();
			return originalFetch.call(window, input, init).finally(() => {
				pendingRequests.current -= 1;
				refresh();
			});
		};

		document.addEventListener("click", onClick, true);
		document.addEventListener("submit", onSubmit);
		window.addEventListener("pageshow", onPageShow);
		return () => {
			window.fetch = originalFetch;
			document.removeEventListener("click", onClick, true);
			document.removeEventListener("submit", onSubmit);
			window.removeEventListener("pageshow", onPageShow);
		};
	}, [refresh, startNavigation]);

	if (phase === "idle") return null;

	return (
		<>
			<div
				aria-hidden="true"
				className="hm-nav-bar print:hidden"
				data-phase={phase}
			>
				<span />
			</div>
			{phase === "running" ? (
				<div className="hm-nav-pill print:hidden" role="status">
					<BuildLoader small />
					{labels[activity]}
				</div>
			) : null}
		</>
	);
}

/** Indicador global: responde al instante a cualquier clic que tarde en llegar. */
export function NavigationProgress() {
	return (
		<Suspense fallback={null}>
			<Progress />
		</Suspense>
	);
}
