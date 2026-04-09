import { useState } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Employee, PeriodFormData } from "../../types";
import { useBalance, useTeam } from "../../hooks/useEmployees";
import { useCreateRequest, useEmployeeRequests } from "../../hooks/useVacations";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";

const CURRENT_YEAR = new Date().getFullYear();

const NAV_ITEMS = [
  { key: "profile", label: "Perfil", icon: <PersonIcon /> },
  { key: "request", label: "Solicitar Férias", icon: <CalendarIcon /> },
  { key: "history", label: "Histórico", icon: <HistoryIcon /> },
  { key: "team", label: "Equipe", icon: <TeamIcon /> },
];

interface Props {
  employee: Employee;
  onSwitch: () => void;
}

export default function EmployeePage({ employee, onSwitch }: Props) {
  const [activeNav, setActiveNav] = useState("request");

  return (
    <Layout employee={employee} activeNav={activeNav} navItems={NAV_ITEMS} onNavChange={setActiveNav} onSwitch={onSwitch}>
      {activeNav === "request" && <RequestView employee={employee} />}
      {activeNav === "history" && <HistoryView employee={employee} />}
      {activeNav === "team" && <TeamView employee={employee} />}
      {activeNav === "profile" && <ProfileView employee={employee} />}
    </Layout>
  );
}

// --- Request View ---

function extractApiError(error: unknown): string {
  const detail = (error as any)?.response?.data?.detail;
  if (!detail) return "Erro ao enviar solicitação.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e: any) => e.msg ?? String(e)).join("; ");
  return "Erro ao enviar solicitação.";
}

function RequestView({ employee }: { employee: Employee }) {
  const { data: balance } = useBalance(employee.id, CURRENT_YEAR);
  const { data: requests = [] } = useEmployeeRequests(employee.id, CURRENT_YEAR);
  const { mutate: createRequest, isPending, error, reset } = useCreateRequest(employee.id);

  const [periods, setPeriods] = useState<PeriodFormData[]>([{ start_date: "", days_count: 0 }]);
  const [advance13th, setAdvance13th] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [formError, setFormError] = useState("");

  const updatePeriod = (index: number, field: keyof PeriodFormData, value: string | number) => {
    setPeriods((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const addPeriod = () => {
    if (periods.length < 3) setPeriods((prev) => [...prev, { start_date: "", days_count: 0 }]);
  };

  const removePeriod = (index: number) => {
    setPeriods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    reset();
    setFormError("");

    const validPeriods = periods.filter((p) => p.start_date && p.days_count > 0);
    if (validPeriods.length === 0) {
      setFormError("Preencha ao menos um período com data e quantidade de dias.");
      return;
    }
    const maxDays = Math.max(...validPeriods.map((p) => p.days_count));
    if (maxDays < 14) {
      setFormError("Pelo menos um período deve ter no mínimo 14 dias (regra CLT).");
      return;
    }

    createRequest(
      { employee_id: employee.id, advance_13th_salary: advance13th, year: CURRENT_YEAR, periods: validPeriods },
      {
        onSuccess: () => {
          setPeriods([{ start_date: "", days_count: 0 }]);
          setAdvance13th(false);
          setSuccessMsg("Solicitação enviada com sucesso!");
          setTimeout(() => setSuccessMsg(""), 4000);
        },
      }
    );
  };

  const recentRequests = requests.slice(0, 3);
  const errorMsg = formError || (error ? extractApiError(error) : "");

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="label mb-2">Gestão de Férias</p>
          <h1 className="text-4xl font-light leading-tight">
            Planeje seu próximo <strong className="font-bold">descanso.</strong>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-7xl font-bold text-brand-blue leading-none">{balance?.remaining_days ?? 30}</p>
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mt-1">Dias Restantes</p>
          <p className="text-xs text-gray-400 mt-0.5">Saldo utilizado: {balance?.used_days ?? 0}/{balance?.total_days ?? 30} dias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Form */}
        <div className="lg:col-span-3">
          <h2 className="text-xl font-semibold mb-1">Solicitar Férias</h2>
          <p className="text-sm text-gray-400 mb-6">Configure os detalhes do seu período de repouso.</p>

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm">{successMsg}</div>
          )}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">{errorMsg}</div>
          )}

          {periods.map((period, index) => (
            <PeriodForm
              key={index}
              index={index}
              total={periods.length}
              period={period}
              onChange={(field, value) => updatePeriod(index, field, value)}
              onRemove={() => removePeriod(index)}
            />
          ))}

          {periods.length < 3 && (
            <button onClick={addPeriod} className="flex items-center gap-2 text-brand-blue text-sm font-semibold mt-4 hover:text-brand-blue-dark">
              <span className="text-lg leading-none">+</span>
              <span className="tracking-wider uppercase text-xs">Adicionar Outro Período</span>
            </button>
          )}

          <div className="flex items-center gap-3 mt-8">
            <input
              type="checkbox"
              id="advance13"
              checked={advance13th}
              onChange={(e) => setAdvance13th(e.target.checked)}
              className="w-4 h-4 border-gray-300 rounded"
            />
            <label htmlFor="advance13" className="text-sm text-gray-600 cursor-pointer">
              Adiantamento do 13º salário
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPending || periods.every((p) => !p.start_date || p.days_count === 0)}
            className="btn-primary mt-8"
          >
            Enviar Solicitação <span>→</span>
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Regras CLT: Um período deve ter no mínimo 14 dias; os demais, mínimo de 5 dias.
          </p>
        </div>

        {/* History panel */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="label">Histórico</p>
            <button className="text-xs font-semibold text-brand-blue uppercase tracking-wider hover:text-brand-blue-dark">
              Ver Tudo
            </button>
          </div>

          <div className="space-y-4 mb-8">
            {recentRequests.length === 0 && (
              <p className="text-sm text-gray-400">Nenhuma solicitação encontrada.</p>
            )}
            {recentRequests.map((req) => (
              <div key={req.id} className="flex items-start justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold">
                    {req.periods.map((p) => formatDateRange(p.start_date, p.days_count)).join(", ")}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {req.total_days} dias • {req.year}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="label mb-1">Períodos</p>
              <p className="text-2xl font-semibold">
                {balance?.periods_used ?? 0} <span className="text-sm text-gray-400 font-normal">de 3</span>
              </p>
            </div>
            <div>
              <p className="label mb-1">Total Utilizado</p>
              <p className="text-2xl font-semibold">
                {balance?.used_days ?? 0} <span className="text-sm text-gray-400 font-normal">dias</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Calendar strip */}
      <TeamCalendarStrip employeeId={employee.id} />
    </div>
  );
}

function PeriodForm({
  index,
  total,
  period,
  onChange,
  onRemove,
}: {
  index: number;
  total: number;
  period: PeriodFormData;
  onChange: (field: keyof PeriodFormData, value: string | number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="label">Período {index + 1} de 3</p>
        {total > 1 && (
          <button onClick={onRemove} className="text-xs text-gray-400 hover:text-red-500">
            Remover
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="label mb-2">Início</p>
          <input
            type="date"
            value={period.start_date}
            onChange={(e) => onChange("start_date", e.target.value)}
            className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-brand-blue bg-transparent"
          />
        </div>
        <div>
          <p className="label mb-2">Quantidade de Dias</p>
          <input
            type="number"
            min={1}
            max={30}
            value={period.days_count || ""}
            onChange={(e) => onChange("days_count", parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-brand-blue bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}

function TeamCalendarStrip({ employeeId }: { employeeId: number }) {
  const { data: team = [] } = useTeam(employeeId);
  return (
    <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold">Calendário da Equipe</p>
        <p className="text-xs text-gray-400 mt-0.5">Próximas ausências registradas no time.</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {team.slice(0, 3).map((m) => (
            <Avatar key={m.id} initials={m.avatar_initials} size="sm" />
          ))}
        </div>
        {team.length > 3 && <span className="text-xs text-gray-400">+{team.length - 3}</span>}
        <button className="ml-3 text-xs font-semibold text-brand-blue uppercase tracking-wider hover:text-brand-blue-dark">
          Ver Calendário
        </button>
      </div>
    </div>
  );
}

// --- History View ---

function HistoryView({ employee }: { employee: Employee }) {
  const { data: requests = [], isLoading } = useEmployeeRequests(employee.id);
  return (
    <div className="p-8 max-w-3xl">
      <p className="label mb-2">Histórico</p>
      <h1 className="text-3xl font-light mb-8">
        Suas <strong className="font-bold">solicitações</strong>
      </h1>
      {isLoading && <p className="text-sm text-gray-400">Carregando...</p>}
      {!isLoading && requests.length === 0 && (
        <p className="text-sm text-gray-400">Nenhuma solicitação encontrada.</p>
      )}
      <div className="space-y-3">
        {requests.map((req) => (
          <div key={req.id} className="bg-white border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div>
                {req.periods.map((p, i) => (
                  <p key={i} className="text-sm font-semibold">
                    {formatDateRange(p.start_date, p.days_count)}
                    <span className="text-gray-400 font-normal ml-2">{p.days_count} dias</span>
                  </p>
                ))}
                <p className="text-xs text-gray-400 mt-1">{req.year} • Total: {req.total_days} dias</p>
              </div>
              <StatusBadge status={req.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Team View ---

function TeamView({ employee }: { employee: Employee }) {
  const { data: team = [], isLoading } = useTeam(employee.id);
  return (
    <div className="p-8 max-w-3xl">
      <p className="label mb-2">Equipe</p>
      <h1 className="text-3xl font-light mb-8">
        Meu <strong className="font-bold">time</strong>
      </h1>
      {isLoading && <p className="text-sm text-gray-400">Carregando...</p>}
      <div className="space-y-2">
        {team.map((member) => (
          <div key={member.id} className="flex items-center gap-4 bg-white border border-gray-100 p-4">
            <Avatar initials={member.avatar_initials} size="md" />
            <div>
              <p className="font-semibold text-sm">{member.name}</p>
              <p className="text-xs text-gray-400">{member.role}</p>
            </div>
          </div>
        ))}
        {!isLoading && team.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum colega encontrado.</p>
        )}
      </div>
    </div>
  );
}

// --- Profile View ---

function ProfileView({ employee }: { employee: Employee }) {
  const { data: balance } = useBalance(employee.id, CURRENT_YEAR);
  return (
    <div className="p-8 max-w-xl">
      <p className="label mb-2">Perfil</p>
      <h1 className="text-3xl font-light mb-8">
        Meu <strong className="font-bold">perfil</strong>
      </h1>
      <div className="flex items-center gap-5 mb-8">
        <Avatar initials={employee.avatar_initials} size="lg" />
        <div>
          <p className="text-xl font-semibold">{employee.name}</p>
          <p className="text-sm text-gray-400">{employee.role}</p>
          <p className="text-xs text-gray-400">{employee.department}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
        <Stat label="Dias totais" value={`${balance?.total_days ?? 30}`} />
        <Stat label="Utilizados" value={`${balance?.used_days ?? 0}`} />
        <Stat label="Restantes" value={`${balance?.remaining_days ?? 30}`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <p className="text-2xl font-bold text-brand-blue">{value}</p>
    </div>
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
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

function TeamIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
