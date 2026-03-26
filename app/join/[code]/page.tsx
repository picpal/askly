import JoinPageClient from './JoinPageClient';

interface JoinPageProps {
  params: { code: string };
}

async function getSession(code: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/sessions/code/${code}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = params;
  const session = await getSession(code.toUpperCase());

  if (!session) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            세션을 찾을 수 없습니다
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            코드 &quot;{code.toUpperCase()}&quot;에 해당하는 세션이 없거나 종료되었습니다.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return <JoinPageClient session={session} />;
}
