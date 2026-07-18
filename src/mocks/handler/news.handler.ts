import { http, HttpResponse } from "msw";

export const mockNews = [
  {
    id: 1,
    title: "연준 금리 동결 발표, 물가 상승 둔화 추세 지켜본다",
    tag: "MACRO",
    source: "경제뉴스",
    summary:
      "연방준비제도가 기준금리를 동결하며 향후 인플레이션 추이를 신중하게 관찰하겠다고 발표했습니다.",
    link: "https://example.com/news/1",
    pub_date: new Date().toISOString(),
  },
  {
    id: 2,
    title: "삼성전자 분기 영업이익 급증, 반도체 부문 회복 가시화",
    tag: "EARNINGS",
    source: "테크투데이",
    summary:
      "삼성전자의 2분기 영업이익이 전년 대비 대폭 증가하며 반도체 업황 회복세를 입증했습니다.",
    link: "https://example.com/news/2",
    pub_date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 3,
    title: "AI 반도체 시장 급성장, 신생 벤처들의 도전장",
    tag: "INDUSTRY",
    source: "반도체리포트",
    summary:
      "생성형 AI 붐으로 특화 반도체 칩 시장이 팽창하면서 글로벌 스타트업들이 투자를 대거 유치 중입니다.",
    link: "https://example.com/news/3",
    pub_date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 4,
    title: "금융위, 공매도 규제 강화 가이드라인 발표",
    tag: "REGULATION",
    source: "금융보도",
    summary:
      "금융당국이 무차입 공매도를 방지하기 위한 전산 시스템과 처벌 규정을 강화하는 가이드라인을 최종 확정했습니다.",
    link: "https://example.com/news/4",
    pub_date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 5,
    title: "애플, 차세대 AI 비서 기능 탑재 기기 가을 출시 예정",
    tag: "ISSUE",
    source: "글로벌IT",
    summary:
      "애플이 차세대 모바일 운영체제에 심층 학습 기반 지능형 비서를 탑재해 올 가을 공개할 예정입니다.",
    link: "https://example.com/news/5",
    pub_date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

export const newsHandlers = [
  // 뉴스 타임라인 조회
  http.get("*/api/news", () => {
    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/api/news",
      message: "당일 AI 분석 뉴스 타임라인 조회가 완료되었습니다.",
      data: {
        totalCount: mockNews.length,
        items: mockNews,
      },
      error: null,
    });
  }),

  // 뉴스 상세 조회
  http.get("*/api/news/:id", ({ params }) => {
    const newsID = Number(params.id);
    const newsItem = mockNews.find((n) => n.id === newsID);

    if (!newsItem) {
      return HttpResponse.json(
        {
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: `/api/news/${newsID}`,
          message: "해당 뉴스를 찾을 수 없습니다.",
          data: null,
          error: "Not Found",
        },
        { status: 404 },
      );
    }

    const ticker = newsItem.title.includes("삼성")
      ? "005930"
      : newsItem.title.includes("애플")
        ? "AAPL"
        : null;

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: `/api/news/${newsID}`,
      message: "뉴스 상세 조회가 완료되었습니다.",
      data: {
        newsId: newsID,
        ticker,
        title: newsItem.title,
        aiSummaryPoints: [
          `해당 뉴스는 대외적인 ${newsItem.tag} 관련 흐름을 보여줍니다.`,
          `${newsItem.summary.slice(0, 40)}... 등의 주요 정보가 요약됩니다.`,
          "시장 참여자들은 변동성에 주의하며 대응할 것을 권장합니다.",
        ],
        originalUrl: newsItem.link,
        createdAt: newsItem.pub_date,
      },
      error: null,
    });
  }),
];
