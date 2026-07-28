import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | 첫지음",
};

/**
 * ⚠️ 초안(draft)입니다. 실제 서비스 운영 전 아래 항목을 검토·확정하세요.
 * - [대괄호] 플레이스홀더(보호책임자, 보유기간 등)를 실제 값으로 교체
 * - 실제로 수집·위탁하는 현황과 100% 일치시킬 것 (불일치 시 위법)
 * - Supabase 리전은 한국(국내)이므로 국외이전 고지는 생략함 (리전 변경 시 반드시 추가)
 * - 결제 오픈 전 법무 검토 1회 권장
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보 처리방침" effectiveDate="2026년 7월 28일">
      <p>
        먼데이랩스(이하 &ldquo;회사&rdquo;)는 「개인정보 보호법」 등 관련 법령을
        준수하며, 이용자의 개인정보를 보호하기 위해 다음과 같이 개인정보
        처리방침을 수립·공개합니다.
      </p>

      <LegalSection heading="1. 수집하는 개인정보 항목">
        <p>
          회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다.
          <br />• <strong>회원 인증</strong>: 이메일 주소
          <br />• <strong>작명 서비스 이용</strong>: 성(姓), 생년월일 및 출생
          시각, 기타 이용자가 입력하는 작명 관련 정보
          <br />• <strong>유료 결제</strong>: 결제 승인 정보(결제 수단·승인 내역
          등). 단, 카드번호 등 민감한 결제 정보는 회사가 저장하지 않으며
          결제대행사가 처리합니다.
          <br />• <strong>자동 수집</strong>: 서비스 이용 기록, 접속 로그, 기기
          정보 등
        </p>
      </LegalSection>

      <LegalSection heading="2. 개인정보의 수집 및 이용 목적">
        <p>
          • 회원 식별 및 인증(매직링크 로그인)
          <br />
          • AI 작명 결과 생성 및 제공, 결과 보관·재열람
          <br />
          • 유료 서비스 대금 결제 및 정산
          <br />• 고객 문의 응대 및 공지사항 전달
        </p>
      </LegalSection>

      <LegalSection heading="3. 개인정보의 보유 및 이용 기간">
        <p>
          회사는 원칙적으로 개인정보 수집·이용 목적이 달성되면 지체 없이
          파기합니다. 다만 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안
          보관합니다.
          <br />
          • 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)
          <br />
          • 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)
          <br />
          • 소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)
          <br />• 회원 정보: 회원 탈퇴 시 [즉시/○○일 이내] 파기
        </p>
      </LegalSection>

      <LegalSection heading="4. 개인정보의 처리 위탁">
        <p>
          회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를
          외부에 위탁하고 있으며, 위탁계약 시 개인정보가 안전하게 관리되도록
          규정하고 있습니다.
          <br />• <strong>토스페이먼츠</strong>: 결제 처리 및 결제 도용 방지
          <br />• <strong>Supabase</strong>: 데이터 보관 및 회원 인증 인프라
          운영
          <span className="text-ink-light">
            {" "}
            (데이터는 국내 리전에 보관되며, 개인정보 국외 이전은 발생하지
            않습니다.)
          </span>
        </p>
      </LegalSection>

      <LegalSection heading="5. 개인정보의 제3자 제공">
        <p>
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만
          이용자가 사전에 동의한 경우 또는 법령에 근거가 있는 경우에 한하여
          제공합니다.
        </p>
      </LegalSection>

      <LegalSection heading="6. 정보주체의 권리와 행사 방법">
        <p>
          이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를
          요구할 수 있습니다. 요청은 아래 개인정보 보호책임자에게 서면, 이메일
          등으로 하실 수 있으며, 회사는 지체 없이 조치합니다.
        </p>
      </LegalSection>

      <LegalSection heading="7. 개인정보의 파기 절차 및 방법">
        <p>
          전자적 파일 형태의 정보는 복구·재생이 불가능한 방법으로 영구 삭제하며,
          종이 문서에 기록된 정보는 분쇄하거나 소각하여 파기합니다.
        </p>
      </LegalSection>

      <LegalSection heading="8. 개인정보의 안전성 확보 조치">
        <p>
          회사는 개인정보의 안전한 처리를 위해 접근 권한 관리, 접속 기록 보관,
          전송 구간 암호화 등 관리적·기술적 보호 조치를 시행합니다.
        </p>
      </LegalSection>

      <LegalSection heading="9. 쿠키 등 자동 수집 장치의 운영">
        <p>
          회사는 서비스 이용 편의를 위해 쿠키 등을 사용할 수 있으며, 이용자는
          브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="10. 개인정보 보호책임자">
        <p>
          • 개인정보 보호책임자: 예병수
          <br />
          • 연락처: mondaylabs0132@gmail.com
          <br />
          이용자는 서비스 이용 중 발생하는 개인정보 관련 문의를 위 연락처로 하실
          수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="11. 개인정보 처리방침의 변경">
        <p>
          이 개인정보 처리방침은 시행일로부터 적용되며, 법령·정책 또는 서비스
          변경에 따라 내용이 추가·삭제·수정될 경우 변경사항을 시행 7일 전부터
          공지합니다.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
