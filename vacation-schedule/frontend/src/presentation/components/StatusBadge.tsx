import type { RequestStatus } from "../../types";

const STYLES: Record<RequestStatus, string> = {
  approved: "text-green-600",
  rejected: "text-red-500",
  pending: "text-gray-400",
};

const LABELS: Record<RequestStatus, string> = {
  approved: "Aprovado",
  rejected: "Recusado",
  pending: "Pendente",
};

interface Props {
  status: RequestStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`text-xs font-semibold tracking-wider uppercase ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
