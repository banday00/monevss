export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page ditampilkan tanpa sidebar/header — langsung render children
  return <>{children}</>;
}
