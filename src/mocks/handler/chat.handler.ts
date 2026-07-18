import { http, HttpResponse } from "msw";

interface MockChatMessage {
  chatId: number;
  roomId: number;
  stockId: number;
  ticker: string;
  stockName: string;
  senderId: string;
  nickname: string;
  message: string;
  messageType: string;
  reportCount: number;
  isHidden: boolean;
  createdAt: string;
}

export const mockChats: MockChatMessage[] = [
  {
    chatId: 1000,
    roomId: 200,
    stockId: 0,
    ticker: "GLOBAL",
    stockName: "글로벌토크",
    senderId: "mock-other-user-4",
    nickname: "시장감시자",
    message: "오늘 전반적으로 시장이 붉은빛이네요.",
    messageType: "NORMAL",
    reportCount: 0,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    chatId: 1001,
    roomId: 201,
    stockId: 1,
    ticker: "005930",
    stockName: "삼성전자",
    senderId: "mock-user-id-12345",
    nickname: "test_user",
    message: "삼성전자 오늘 실적 잘 나왔네요!",
    messageType: "NORMAL",
    reportCount: 0,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    chatId: 1002,
    roomId: 201,
    stockId: 1,
    ticker: "005930",
    stockName: "삼성전자",
    senderId: "mock-other-user-1",
    nickname: "주식초보",
    message: "지금 사도 늦지 않았을까요?",
    messageType: "NORMAL",
    reportCount: 0,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    chatId: 1003,
    roomId: 202,
    stockId: 2,
    ticker: "AAPL",
    stockName: "Apple Inc.",
    senderId: "mock-other-user-2",
    nickname: "팀쿡최고",
    message: "애플 신제품 발표회 기대됩니다.",
    messageType: "NORMAL",
    reportCount: 0,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    chatId: 1004,
    roomId: 203,
    stockId: 3,
    ticker: "TSLA",
    stockName: "Tesla Inc.",
    senderId: "mock-other-user-3",
    nickname: "일론머스크",
    message: "테슬라 자율주행 기술력 넘사벽이네요.",
    messageType: "NORMAL",
    reportCount: 0,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];

export const chatHandlers = [
  // 전체 종목 통합 채팅 조회
  http.get("*/api/chats/all", ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    const myUserID = authHeader?.includes("anonymous")
      ? "mock-anonymous-user-id"
      : "mock-user-id-12345";

    const nonHiddenChats = mockChats.filter((c) => !c.isHidden);

    const logs = nonHiddenChats.map((message) => {
      const time = new Date(message.createdAt).toISOString().slice(11, 19);
      return {
        chatId: message.chatId,
        ticker: message.ticker,
        senderType: message.senderId === myUserID ? "MY_LOG" : "OTHER",
        maskedNickname: message.nickname,
        message: message.message,
        formattedLog: `[${time}] [DEBUG] [${message.ticker}] ${message.nickname}: ${message.message}`,
        createdAt: message.createdAt,
      };
    });

    return HttpResponse.json({
      searchScope: "GLOBAL_TIMELINE",
      totalFetched: logs.length,
      logs,
    });
  }),

  // 특정 종목 채팅 조회
  http.get("*/api/chats/stocks/:ticker", ({ params, request }) => {
    const rawTicker = params.ticker;
    const ticker =
      typeof rawTicker === "string" ? decodeURIComponent(rawTicker) : "";
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "50");

    const tickerMessages = mockChats.filter(
      (c) => c.ticker === ticker && !c.isHidden,
    );

    const sorted = [...tickerMessages].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const startIndex = (page - 1) * limit;
    const paginated = sorted.slice(startIndex, startIndex + limit);

    const messages = paginated.map((m) => ({
      chatId: m.chatId,
      roomId: m.roomId,
      senderId: m.senderId,
      nickname: m.nickname,
      message: m.message,
      messageType: m.messageType,
      reportCount: m.reportCount,
      isHidden: m.isHidden,
      createdAt: m.createdAt,
    }));

    const stockID = tickerMessages[0]?.stockId ?? 999;
    const stockName = tickerMessages[0]?.stockName ?? ticker;

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: `/api/chats/stocks/${ticker}`,
      message: "종목 채팅 히스토리 조회가 완료되었습니다.",
      data: {
        stockId: stockID,
        ticker,
        stockName,
        page,
        limit,
        total: tickerMessages.length,
        messages,
      },
      error: null,
    });
  }),

  // 채팅 신고
  http.patch("*/api/chats/:chatId/report", ({ params }) => {
    const chatID = Number(params.chatId);
    const existing = mockChats.find((c) => c.chatId === chatID);

    if (!existing) {
      return HttpResponse.json(
        {
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: `/api/chats/${chatID}/report`,
          message: "존재하지 않는 채팅 메시지입니다.",
          data: null,
          error: "Not Found",
        },
        { status: 404 },
      );
    }

    existing.reportCount += 1;
    if (existing.reportCount >= 5) {
      existing.isHidden = true;
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: `/api/chats/${chatID}/report`,
      message: "해당 메시지에 대한 신고가 접수되었습니다.",
      data: {
        message: "해당 메시지에 대한 신고가 접수되었습니다.",
        chatId: existing.chatId,
        currentReportCount: existing.reportCount,
        isBlinded: existing.isHidden,
      },
      error: null,
    });
  }),
];
