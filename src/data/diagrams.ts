/**
 * Architecture diagrams for the case studies (diagram-design "Architecture" type).
 *
 * Grid: 4 columns x 128px nodes with 64px gutters, so connector labels (max 8
 * characters) fit between nodes without touching them. Rows sit 152px apart.
 * Geometry sticks to a 4px grid.
 */

export type Side = "t" | "r" | "b" | "l";
export type NodeKind = "default" | "focal" | "store" | "external";

export interface DiagramNode {
	id: string;
	x: number;
	y: number;
	name: string;
	sub: string;
	kind?: NodeKind;
}

export interface DiagramEdge {
	from: string;
	fs: Side;
	/** Offset of the attach point from the edge centre, in px (fans shared edges). */
	fo?: number;
	to: string;
	ts: Side;
	to_off?: number;
	/** Max 8 characters, all caps. */
	label?: string;
	dashed?: boolean;
	accent?: boolean;
	/** Which side of a vertical segment the label sits on. */
	labelSide?: "l" | "r";
}

export interface DiagramZone {
	x: number;
	y: number;
	w: number;
	h: number;
	label: string;
}

export interface DiagramNote {
	x: number;
	y: number;
	lines: string[];
}

export interface LegendItem {
	kind: "focal" | "store" | "external" | "solid" | "dashed";
	text: string;
}

export interface Diagram {
	title: string;
	desc: string;
	width: number;
	height: number;
	nodes: DiagramNode[];
	edges: DiagramEdge[];
	zones?: DiagramZone[];
	notes?: DiagramNote[];
	legend: LegendItem[];
}

const C = [24, 216, 408, 600]; // column x
const W = 752;

export const diagrams: Record<string, Diagram> = {
	centinela: {
		title: "Centinela hexagonal architecture",
		desc: "An HTTP request flows from the client through the FastAPI layer into use cases and ports, which are implemented by embedding and vector-store adapters backed by PostgreSQL with pgvector.",
		width: W,
		height: 456,
		nodes: [
			{ id: "client", x: C[0], y: 56, name: "Client", sub: "any HTTP caller", kind: "external" },
			{ id: "api", x: C[1], y: 56, name: "FastAPI", sub: "/api/v1/knowledge" },
			{ id: "uc", x: C[2], y: 56, name: "Use cases", sub: "ingest · search" },
			{ id: "ports", x: C[3], y: 56, name: "Ports", sub: "interfaces", kind: "focal" },
			{ id: "emb", x: C[2], y: 208, name: "Embedder", sub: "HuggingFace" },
			{ id: "vec", x: C[3], y: 208, name: "Vector store", sub: "LangChain PGVector" },
			{ id: "pg", x: C[3], y: 340, name: "PostgreSQL", sub: "pgvector", kind: "store" },
		],
		edges: [
			{ from: "client", fs: "r", to: "api", ts: "l", label: "HTTP" },
			{ from: "api", fs: "r", to: "uc", ts: "l" },
			{ from: "uc", fs: "r", to: "ports", ts: "l" },
			{ from: "ports", fs: "b", fo: -24, to: "emb", ts: "t", label: "EMBED" },
			{ from: "ports", fs: "b", fo: 24, to: "vec", ts: "t", to_off: 24, label: "SEARCH", labelSide: "r" },
			{ from: "vec", fs: "b", to: "pg", ts: "t", label: "SQL", labelSide: "r" },
		],
		zones: [
			{ x: 392, y: 24, w: 352, h: 112, label: "DOMAIN · NO FRAMEWORKS" },
			{ x: 392, y: 176, w: 352, h: 112, label: "ADAPTERS · FRAMEWORKS LIVE HERE" },
		],
		notes: [{ x: 24, y: 236, lines: ["Dependencies point inward.", "The domain imports no LangChain,", "HuggingFace or pgvector."] }],
		legend: [
			{ kind: "focal", text: "Boundary" },
			{ kind: "store", text: "Datastore" },
			{ kind: "external", text: "Caller" },
		],
	},

	formcore: {
		title: "FormCore request path with row-level security",
		desc: "A client sends a JWT and workspace ID to FastAPI, which sets session variables; PostgreSQL row-level security policies then filter every query to the caller's workspace.",
		width: W,
		height: 380,
		nodes: [
			{ id: "client", x: C[0], y: 56, name: "Client", sub: "JWT + tenant ID", kind: "external" },
			{ id: "api", x: C[1], y: 56, name: "FastAPI", sub: "authn only" },
			{ id: "ctx", x: C[2], y: 56, name: "Session vars", sub: "workspace + user" },
			{ id: "rls", x: C[3], y: 56, name: "RLS policies", sub: "per workspace", kind: "focal" },
			{ id: "rows", x: C[3], y: 208, name: "Tenant rows", sub: "submissions", kind: "store" },
		],
		edges: [
			{ from: "client", fs: "r", to: "api", ts: "l", label: "HEADERS" },
			{ from: "api", fs: "r", to: "ctx", ts: "l" },
			{ from: "ctx", fs: "r", to: "rls", ts: "l", label: "SQL" },
			{ from: "rls", fs: "b", to: "rows", ts: "t", label: "FILTERS", labelSide: "r" },
		],
		zones: [{ x: 584, y: 24, w: 160, h: 264, label: "POSTGRESQL" }],
		notes: [{ x: 24, y: 232, lines: ["Authorization lives in the database.", "A bug in FastAPI cannot widen", "what a query is allowed to return."] }],
		legend: [
			{ kind: "focal", text: "Enforcement point" },
			{ kind: "store", text: "Datastore" },
			{ kind: "external", text: "Caller" },
		],
	},

	poker: {
		title: "Multiplayer poker platform architecture",
		desc: "Browser requests pass through the Oathkeeper auth proxy, which checks sessions with Kratos and forwards identity headers to the .NET API with SignalR hubs, backed by PostgreSQL and Redis.",
		width: W,
		height: 400,
		nodes: [
			{ id: "client", x: C[0], y: 56, name: "React client", sub: "table UI", kind: "external" },
			{ id: "oath", x: C[1], y: 56, name: "Oathkeeper", sub: "auth proxy" },
			{ id: "api", x: C[2], y: 56, name: ".NET API", sub: "SignalR hubs", kind: "focal" },
			{ id: "pg", x: C[3], y: 56, name: "PostgreSQL", sub: "wallet ledger", kind: "store" },
			{ id: "kratos", x: C[1], y: 208, name: "Kratos", sub: "email-code login" },
			{ id: "redis", x: C[3], y: 208, name: "Redis", sub: "backplane · locks", kind: "store" },
		],
		edges: [
			{ from: "client", fs: "r", to: "oath", ts: "l", label: "HTTPS" },
			{ from: "oath", fs: "r", to: "api", ts: "l", label: "HEADERS" },
			{ from: "api", fs: "r", to: "pg", ts: "l", label: "SQL" },
			{ from: "oath", fs: "b", to: "kratos", ts: "t", label: "SESSION", labelSide: "r" },
			{ from: "api", fs: "b", to: "redis", ts: "l", label: "BACKPLANE" },
		],
		notes: [{ x: 24, y: 324, lines: ["The API port is never published to the host:", "every request enters through Oathkeeper."] }],
		legend: [
			{ kind: "focal", text: "Game server" },
			{ kind: "store", text: "Datastore" },
			{ kind: "external", text: "Caller" },
		],
	},

	"rag-agent": {
		title: "RAG agent query and ingestion pipelines",
		desc: "A user query passes through a FastAPI gateway to LLM query reformulation, hybrid search in Pinecone and LLM generation, streaming tokens back over server-sent events, while documents are ingested asynchronously through a queue and worker.",
		width: W,
		height: 456,
		nodes: [
			{ id: "docs", x: C[1], y: 56, name: "Documents", sub: "PDF · text", kind: "external" },
			{ id: "queue", x: C[2], y: 56, name: "Queue", sub: "message queue" },
			{ id: "worker", x: C[3], y: 56, name: "Worker", sub: "chunk + embed" },
			{ id: "user", x: C[0], y: 208, name: "User", sub: "query", kind: "external" },
			{ id: "gw", x: C[1], y: 208, name: "FastAPI", sub: "gateway" },
			{ id: "reform", x: C[2], y: 208, name: "Reformulate", sub: "LLM · variants" },
			{ id: "pine", x: C[3], y: 208, name: "Pinecone", sub: "dense + BM25", kind: "focal" },
			{ id: "gen", x: C[3], y: 340, name: "Generate", sub: "LLM · citations" },
		],
		edges: [
			{ from: "docs", fs: "r", to: "queue", ts: "l" },
			{ from: "queue", fs: "r", to: "worker", ts: "l" },
			{ from: "worker", fs: "b", to: "pine", ts: "t", label: "UPSERT", labelSide: "r" },
			{ from: "user", fs: "r", to: "gw", ts: "l" },
			{ from: "gw", fs: "r", to: "reform", ts: "l" },
			{ from: "reform", fs: "r", to: "pine", ts: "l", label: "SEARCH" },
			{ from: "pine", fs: "b", to: "gen", ts: "t", label: "CONTEXT", labelSide: "r" },
			{ from: "gen", fs: "l", to: "gw", ts: "b", label: "SSE", dashed: true },
		],
		zones: [{ x: 200, y: 24, w: 544, h: 112, label: "INGESTION · ASYNC" }],
		legend: [
			{ kind: "focal", text: "Retrieval index" },
			{ kind: "dashed", text: "Streamed response" },
			{ kind: "external", text: "Input" },
		],
	},
};
