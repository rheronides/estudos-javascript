import { useState } from "react";
import { useEmployees } from "./hooks/useEmployees";
import type { Employee } from "./types";
import EmployeePage from "./presentation/pages/EmployeePage";
import ManagerPage from "./presentation/pages/ManagerPage";
import Avatar from "./presentation/components/Avatar";

export default function App() {
  const { data: employees = [], isLoading } = useEmployees();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedEmployee = employees.find((e) => e.id === selectedId) ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm tracking-widest uppercase">Carregando...</p>
      </div>
    );
  }

  if (!selectedEmployee) {
    return <UserSelector employees={employees} onSelect={setSelectedId} />;
  }

  return selectedEmployee.is_manager ? (
    <ManagerPage employee={selectedEmployee} onSwitch={() => setSelectedId(null)} />
  ) : (
    <EmployeePage employee={selectedEmployee} onSwitch={() => setSelectedId(null)} />
  );
}

function UserSelector({ employees, onSelect }: { employees: Employee[]; onSelect: (id: number) => void }) {
  const managers = employees.filter((e) => e.is_manager);
  const collaborators = employees.filter((e) => !e.is_manager);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <p className="text-xs font-bold tracking-widest text-brand-blue uppercase mb-3">Vacation Intelligence</p>
        <h1 className="text-3xl font-light mb-1">
          Selecione um <strong className="font-bold">usuário</strong>
        </h1>
        <p className="text-sm text-gray-400 mb-8">Escolha um perfil para acessar o sistema</p>

        <Section title="Gestores" employees={managers} onSelect={onSelect} />
        <Section title="Colaboradores" employees={collaborators} onSelect={onSelect} />
      </div>
    </div>
  );
}

function Section({ title, employees, onSelect }: { title: string; employees: Employee[]; onSelect: (id: number) => void }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">{title}</p>
      <div className="space-y-2">
        {employees.map((e) => (
          <UserCard key={e.id} employee={e} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function UserCard({ employee, onSelect }: { employee: Employee; onSelect: (id: number) => void }) {
  return (
    <button
      onClick={() => onSelect(employee.id)}
      className="w-full flex items-center gap-4 bg-white border border-gray-200 p-4 hover:border-brand-blue hover:shadow-sm transition-all text-left"
    >
      <Avatar initials={employee.avatar_initials} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{employee.name}</p>
        <p className="text-xs text-gray-400 truncate">{employee.role}</p>
      </div>
      <span className="text-xs font-semibold tracking-wider uppercase text-gray-400">
        {employee.is_manager ? "Gestor" : "Colaborador"}
      </span>
    </button>
  );
}
