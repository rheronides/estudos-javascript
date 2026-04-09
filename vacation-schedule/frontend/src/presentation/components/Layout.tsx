import { ReactNode } from "react";
import type { Employee } from "../../types";
import Avatar from "./Avatar";

interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

interface Props {
  employee: Employee;
  activeNav: string;
  navItems: NavItem[];
  onNavChange: (key: string) => void;
  onSwitch: () => void;
  children: ReactNode;
}

export default function Layout({ employee, activeNav, navItems, onNavChange, onSwitch, children }: Props) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar employee={employee} activeNav={activeNav} navItems={navItems} onNavChange={onNavChange} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onSwitch={onSwitch} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ employee, activeNav, navItems, onNavChange }: Omit<Props, "onSwitch" | "children">) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-100 flex flex-col py-6">
      <div className="px-4 mb-8 flex items-center gap-3">
        <Avatar initials={employee.avatar_initials} size="md" />
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{employee.name}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            {employee.is_manager ? "Gestor" : "Colaborador"}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.key} item={item} isActive={activeNav === item.key} onClick={() => onNavChange(item.key)} />
        ))}
      </nav>

      <div className="px-3 mt-4 border-t border-gray-100 pt-4">
        <div className="nav-item">
          <SettingsIcon />
          Ajustes
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} className={isActive ? "nav-item-active" : "nav-item"}>
      {item.icon}
      {item.label}
    </div>
  );
}

function Topbar({ onSwitch }: { onSwitch: () => void }) {
  return (
    <header className="h-14 border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0">
      <span className="text-sm font-bold tracking-widest text-brand-blue uppercase">Vacation Intelligence</span>
      <div className="flex items-center gap-4">
        <BellIcon />
        <button onClick={onSwitch} className="text-xs font-semibold tracking-widest text-gray-500 uppercase hover:text-gray-900 transition-colors">
          Sair
        </button>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <button className="text-gray-400 hover:text-gray-600">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    </button>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
