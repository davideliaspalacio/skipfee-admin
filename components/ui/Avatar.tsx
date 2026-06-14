export interface AvatarProps {
  initials: string;
  size?: number;
}

export function Avatar({ initials, size = 26 }: AvatarProps) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>
      {initials}
    </div>
  );
}

export function initialsOf(fullName: string, max = 2): string {
  return fullName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, max)
    .join('');
}
