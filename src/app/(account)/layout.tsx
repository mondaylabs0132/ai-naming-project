// 로그인 필수 영역 -> 세션 검사를 통해 없으면 /login으로 이동

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}
