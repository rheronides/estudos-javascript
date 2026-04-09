import { useState } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Employee, VacationRequest } from "../../types";
import { useApproveRequest, useDecisionHistory, usePendingRequests } from "../../hooks/useVacations";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";

const NAV_ITEMS = [
  { key: "profile", label: "Meu Perfil", icon: <PersonIcon /> },
  { key: "request", label: "Solicitar Férias", icon: <CalendarIcon /> },
  { key: "history", label: "Histórico", icon: <HistoryIcon /> },
  { key: "approvals", label: "Aprovações", icon: <ApprovalIcon /> },
  { key: "team", label: "Meu Time", icon: <TeamIcon /> },
];

interface Props {
  employee: Employee;
  onSwitch: () => void;
}

export default function ManagerPage({ employee, onSwitch }: Props) {
  const [activeNav, setActiveNav] = useState("approvals");

  return (
    <Layout employee={employee} activeNav={activeNav} navItems={NAV_ITEMS} onNavChange={setActiveNav} onSwitch={onSwitch}>
      {activeNav === "approvals" && <ApprovalsView manager={employee} />}
      {activeNav !== "approvals" && (
        <div className="p-8">
          <p className="text-sm text-gray-400">Esta seção estará disponível em breve.</p>
        </div>
      )}
    </Layout>
  );
}

function ApprovalsView({ manager }: { manager: Employee }) {
  const { data: pending = [], isLoading: loadingPending } = usePendingRequests(manager.id);
  const { data: decisions = [], isLoading: loadingDecisions } = useDecisionHistory(manager.id);
  const { approve, reject, bulkApprove, bulkReject, isBulkLoading } = useApproveRequest(manager.id);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const currentMonth = format(new Date(), "MMMM yyyy", { locale: ptBR });

  const allSelected = pending.length > 0 && selectedIds.size === pending.length;
  const someSelected = selectedIds.size > 0;

  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(pending.map((r) => r.id)));

  const toggleOne = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleBulkApprove = async () => {
    await bulkApprove(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkReject = async () => {
    await bulkReject(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="label mb-2">Painel de Decisão</p>
          <h1 className="text-4xl font-light leading-tight">
            Solicitações de <strong className="font-bold">Férias</strong>
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            {loadingPending ? "..." : `${pending.length.toString().padStart(2, "0")} solicitações pendentes`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold capitalize">{currentMonth}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Ciclo Atual</p>
        </div>
      </div>

      {/* Bulk action toolbar */}
      {someSelected && (
        <div className="flex items-center justify-between bg-brand-blue-light border border-brand-blue/20 px-4 py-3 mb-4">
          <p className="text-sm font-semibold text-brand-blue">
            {selectedIds.size} {selectedIds.size === 1 ? "solicitação selecionada" : "solicitações selecionadas"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleBulkReject}
              disabled={isBulkLoading}
              className="btn-outline text-red-500 border-red-200 hover:bg-red-50 disabled:opacity-50"
            >
              Recusar Selecionadas
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={isBulkLoading}
              className="bg-brand-blue text-white px-4 py-2 text-sm font-semibold hover:bg-brand-blue-dark transition-colors disabled:opacity-50"
            >
              {isBulkLoading ? "Processando..." : "Aprovar Selecionadas"}
            </button>
          </div>
        </div>
      )}

      {/* Pending requests table */}
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-8 pb-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={pending.length === 0}
                  className="w-4 h-4 border-gray-300 rounded cursor-pointer"
                />
              </th>
              <th className="label pb-3 text-left">Solicitantes</th>
              <th className="label pb-3 text-left">Período</th>
              <th className="label pb-3 text-left">Duração</th>
              <th className="label pb-3 text-right">Ações Rápidas</th>
            </tr>
          </thead>
          <tbody>
            {!loadingPending && pending.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                  Nenhuma solicitação pendente.
                </td>
              </tr>
            )}
            {pending.map((req) => (
              <PendingRow
                key={req.id}
                request={req}
                isSelected={selectedIds.has(req.id)}
                onToggle={() => toggleOne(req.id)}
                onApprove={() => approve.mutate(req.id)}
                onReject={() => reject.mutate(req.id)}
                isLoading={approve.isPending || reject.isPending || isBulkLoading}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Decision history */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-semibold">Histórico de Decisões</p>
            <p className="text-xs text-gray-400 mt-0.5">Últimas ações realizadas no portal.</p>
          </div>
          <button className="text-xs font-semibold text-brand-blue uppercase tracking-wider hover:text-brand-blue-dark flex items-center gap-1">
            Ver Relatório Completo <span>→</span>
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="label pb-3 text-left">Colaborador</th>
              <th className="label pb-3 text-left">Data Decisão</th>
              <th className="label pb-3 text-left">Período</th>
              <th className="label pb-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {!loadingDecisions && decisions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-gray-400">
                  Nenhuma decisão registrada.
                </td>
              </tr>
            )}
            {decisions.map((req) => (
              <DecisionRow key={req.id} request={req} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PendingRow({
  request,
  isSelected,
  onToggle,
  onApprove,
  onReject,
  isLoading,
}: {
  request: VacationRequest;
  isSelected: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  isLoading: boolean;
}) {
  const periodLabel = request.periods
    .map((p) => formatDateRange(p.start_date, p.days_count))
    .join(", ");

  return (
    <tr className={`border-b border-gray-50 transition-colors ${isSelected ? "bg-brand-blue-light" : "hover:bg-gray-50"}`}>
      <td className="py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="w-4 h-4 border-gray-300 rounded cursor-pointer"
        />
      </td>
      <td className="py-4">
        <div className="flex items-center gap-3">
          <Avatar initials={request.employee.avatar_initials} size="md" />
          <div>
            <p className="font-semibold text-sm">{request.employee.name}</p>
            <p className="text-xs text-gray-400">{request.employee.role}</p>
          </div>
        </div>
      </td>
      <td className="py-4 text-sm">{periodLabel}</td>
      <td className="py-4 text-sm">{request.total_days} Dias</td>
      <td className="py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onReject}
            disabled={isLoading}
            className="btn-outline text-red-500 border-red-200 hover:bg-red-50"
          >
            Recusar
          </button>
          <button
            onClick={onApprove}
            disabled={isLoading}
            className="bg-brand-blue text-white px-4 py-2 text-sm font-semibold hover:bg-brand-blue-dark transition-colors disabled:opacity-50"
          >
            Aprovar
          </button>
        </div>
      </td>
    </tr>
  );
}

function DecisionRow({ request }: { request: VacationRequest }) {
  const periodLabel = request.periods
    .map((p) => formatDateRange(p.start_date, p.days_count))
    .join(", ");
  const decisionDate = request.decided_at
    ? format(new Date(request.decided_at), "dd MMM, yyyy", { locale: ptBR })
    : "—";

  return (
    <tr className="border-b border-gray-50">
      <td className="py-4">
        <div className="flex items-center gap-3">
          <Avatar initials={request.employee.avatar_initials} size="md" />
          <p className="font-semibold text-sm">{request.employee.name}</p>
        </div>
      </td>
      <td className="py-4 text-sm text-gray-500">{decisionDate}</td>
      <td className="py-4 text-sm">{periodLabel}</td>
      <td className="py-4 text-right">
        <StatusBadge status={request.status} />
      </td>
    </tr>
  );
}

// --- Helpers ---

function formatDateRange(startDate: string, days: number): string {
  const start = new Date(startDate + "T00:00:00");
  const end = addDays(start, days - 1);
  const fmt = (d: Date) => format(d, "dd MMM", { locale: ptBR });
  return `${fmt(start)} — ${fmt(end)}`;
}

// --- Icons ---

function PersonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ApprovalIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
