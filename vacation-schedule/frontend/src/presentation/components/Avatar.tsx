const PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

const SIZES = {
  sm: "w-7 h-7 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

interface Props {
  initials: string;
  size?: keyof typeof SIZES;
}

export default function Avatar({ initials, size = "md" }: Props) {
  const color = PALETTE[initials.charCodeAt(0) % PALETTE.length];
  return (
    <div className={`${SIZES[size]} ${color} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}
