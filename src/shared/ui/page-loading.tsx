/** Hilada de bloques que se levanta: la animación de carga del sistema. */
export function BuildLoader({ small = false }: { small?: boolean }) {
	return (
		<span
			aria-hidden="true"
			className={`hm-build-loader ${small ? "hm-build-loader--small" : ""}`}
		>
			{["a", "b", "c", "d", "e", "f"].map((brick) => (
				<i data-brick={brick} key={brick} />
			))}
		</span>
	);
}

/** Hoja que se va escribiendo: se muestra al generar un reporte o PDF. */
function DocumentLoader() {
	return (
		<span aria-hidden="true" className="hm-doc-loader">
			<i />
			<i />
			<i />
			<i />
		</span>
	);
}

/** Vista de `loading.tsx`: ocupa el área de contenido mientras llega la página. */
export function PageLoading({
	document = false,
}: {
	/** La página que se espera es un reporte o documento imprimible. */
	document?: boolean;
}) {
	return (
		<div className="hm-page-loading" role="status">
			{document ? <DocumentLoader /> : <BuildLoader />}
			<p>{document ? "Generando el documento" : "Cargando"}</p>
			<span>
				{document
					? "Reuniendo los datos del reporte."
					: "Un momento, por favor."}
			</span>
		</div>
	);
}
