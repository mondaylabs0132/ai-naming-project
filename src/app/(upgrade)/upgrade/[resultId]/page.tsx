import Image from "next/image";
import Link from "next/link";

export default async function UpgradeEmailPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;

  return (
    <main className="flex min-h-dvh flex-col bg-[#FEFCFF] px-5 py-11 text-center text-ink">
      <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col">
        <Link href="/">
          <Image
            src="/assets/logo.png"
            alt="첫지음"
            width={1106}
            height={620}
            priority
            className="mx-auto h-auto w-[90px] object-contain"
          />
        </Link>

        <section className="mt-[78px]" aria-labelledby="upgrade-email-title">
          <h1
            id="upgrade-email-title"
            className="text-[30px] font-extrabold leading-[1.45] tracking-[-0.4px] text-ink"
          >
            이메일로
            <br />
            <span className="text-primary-light">간편하게</span> 시작하세요
          </h1>

          <p className="mt-8 text-[16px] font-semibold leading-[1.65] tracking-[-0.2px] text-ink-muted">
            비밀번호 없이 이메일만으로
            <br />
            로그인해요
          </p>

          <form
            action={`/upgrade/${resultId}/sent`}
            className="mt-[50px] space-y-5"
          >
            <label htmlFor="upgrade-email" className="sr-only">
              이메일
            </label>
            <input
              id="upgrade-email"
              name="email"
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              placeholder="이메일을 입력해주세요"
              className="h-[70px] w-full rounded-[22px] border border-divider bg-white px-6 text-[18px] font-semibold tracking-[-0.2px] text-ink shadow-[0_2px_10px_rgba(45,37,64,0.03)] outline-none transition placeholder:text-ink-light focus:border-primary focus:ring-4 focus:ring-primary-pale"
            />

            <button
              type="submit"
              className="h-[62px] w-full rounded-[20px] bg-primary-light text-[19px] font-bold leading-none tracking-[-0.2px] text-white shadow-[0_8px_22px_rgba(124,111,205,0.24)] transition hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              인증번호 받기
            </button>
          </form>

          <aside className="mt-[50px] flex items-center rounded-[22px] border border-divider bg-white px-4 py-3 text-left shadow-[0_2px_12px_rgba(124,111,205,0.05)]">
            <Image
              src="/assets/auth/lock.png"
              alt=""
              width={1024}
              height={1024}
              className="h-[55px] w-[55px] shrink-0 object-contain"
            />
            <div>
              <p className="text-[15px] font-bold leading-[1.45] tracking-[-0.2px] text-primary">
                입력하신 정보는 안전하게 보호돼요
              </p>
              <p className="mt-1 text-[14px] font-semibold leading-[1.45] tracking-[-0.1px] text-ink-muted">
                외부에 공개되지 않아요
              </p>
            </div>
          </aside>
        </section>

        <footer className="mt-auto flex items-center justify-center gap-5 border-t border-divider pt-6 text-[14px] font-semibold leading-none text-ink-muted">
          <Link href="/terms">이용약관</Link>
          <span aria-hidden="true" className="h-3 w-px bg-ink-light" />
          <Link href="/privacy">개인정보처리방침</Link>
        </footer>
      </div>
    </main>
  );
}
