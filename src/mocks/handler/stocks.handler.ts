import { http, HttpResponse } from "msw";

export const mockStocks = [
  {
    stockId: 1,
    code: "005930",
    name: "삼성전자",
    price: 74500,
    change: 1.36,
    volume: 12450000,
    market: "DOMESTIC",
  },
  {
    stockId: 2,
    code: "AAPL",
    name: "Apple Inc.",
    price: 182.3,
    change: -0.45,
    volume: 54120000,
    market: "OVERSEAS",
  },
  {
    stockId: 3,
    code: "TSLA",
    name: "Tesla Inc.",
    price: 174.6,
    change: 2.84,
    volume: 81200000,
    market: "OVERSEAS",
  },
  {
    stockId: 5,
    code: "035420",
    name: "NAVER",
    price: 188500,
    change: 0.8,
    volume: 450000,
    market: "DOMESTIC",
  },
];

const mockWatchlist = [
  {
    watchlistId: 101,
    stockId: 1,
    displayFileName: "삼성전자.json",
    ticker: "005930",
    currentPrice: 74500,
    fluctuationRate: 1.36,
    volume: 12450000,
    displayOrder: 1,
  },
  {
    watchlistId: 102,
    stockId: 2,
    displayFileName: "Apple Inc..json",
    ticker: "AAPL",
    currentPrice: 182.3,
    fluctuationRate: -0.45,
    volume: 54120000,
    displayOrder: 2,
  },
];

export const stocksHandlers = [
  // 주식 목록 조회 핸들러
  http.get("*/api/stocks", ({ request }) => {
    const url = new URL(request.url);
    const market = url.searchParams.get("market");
    const keyword = url.searchParams.get("keyword")?.toLowerCase();

    let filtered = [...mockStocks];

    if (market) {
      filtered = filtered.filter((s) => s.market === market);
    }

    if (keyword) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(keyword) ||
          s.code.toLowerCase().includes(keyword),
      );
    }

    return HttpResponse.json({
      sortedBy: "change",
      totalCount: filtered.length,
      items: filtered,
    });
  }),

  // 종목 시세 조회 (시세 시트용)
  http.post("*/api/stocks/quotes", async ({ request }) => {
    const body = (await request.json()) as any;
    const stockIds = body.stockIds || [];

    const quotes = stockIds.map((id: number) => {
      const stock = mockStocks.find((s) => s.stockId === id);
      const basePrice = stock ? stock.price : 100;
      return {
        stockId: id,
        currentPrice: basePrice,
        changeRate: stock ? stock.change : 0,
        changeRate15m: (Math.random() - 0.5) * 2,
        changeRate30m: (Math.random() - 0.5) * 3,
        volume: stock ? stock.volume : 10000,
      };
    });

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/api/stocks/quotes",
      message: "요청한 종목의 시세 조회가 완료되었습니다.",
      data: {
        quotes,
      },
      error: null,
    });
  }),

  // 즐겨찾기 등록
  http.post("*/api/stocks/watchlist", async ({ request }) => {
    const body = (await request.json()) as any;
    const stockID = body.stockId;
    const stock = mockStocks.find((s) => s.stockId === stockID);

    if (!stock) {
      return HttpResponse.json(
        {
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: "/api/stocks/watchlist",
          message: "해당 종목을 찾을 수 없습니다.",
          data: null,
          error: "Not Found",
        },
        { status: 404 },
      );
    }

    const existing = mockWatchlist.find((w) => w.stockId === stockID);
    if (existing) {
      return HttpResponse.json({
        statusCode: 201,
        timestamp: new Date().toISOString(),
        path: "/api/stocks/watchlist",
        message: `관심 종목 [${stock.name}]이(가) 이미 존재합니다.`,
        data: {
          watchlistId: existing.watchlistId,
          stockName: stock.name,
          totalRegisteredCount: mockWatchlist.length,
        },
        error: null,
      });
    }

    const nextWatchlistID =
      Math.max(...mockWatchlist.map((w) => w.watchlistId), 0) + 1;
    const nextOrder =
      Math.max(...mockWatchlist.map((w) => w.displayOrder), 0) + 1;

    const newItem = {
      watchlistId: nextWatchlistID,
      stockId: stock.stockId,
      displayFileName: `${stock.name}.json`,
      ticker: stock.code,
      currentPrice: stock.price,
      fluctuationRate: stock.change,
      volume: stock.volume,
      displayOrder: nextOrder,
    };

    mockWatchlist.push(newItem);

    return HttpResponse.json({
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: "/api/stocks/watchlist",
      message: `관심 종목 [${stock.name}]이(가) 성공적으로 생성되었습니다.`,
      data: {
        watchlistId: newItem.watchlistId,
        stockName: stock.name,
        totalRegisteredCount: mockWatchlist.length,
      },
      error: null,
    });
  }),

  // 즐겨찾기 목록 조회
  http.get("*/api/stocks/watchlist", () => {
    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/api/stocks/watchlist",
      message: "지정된 조건으로 필터링된 즐겨찾기 목록을 반환합니다.",
      data: {
        currentTimeframe: "1d",
        currentSortBy: "displayOrder",
        totalCount: mockWatchlist.length,
        items: mockWatchlist,
      },
      error: null,
    });
  }),

  // 종목 1분봉 캔들 차트 조회
  http.get("*/api/stocks/:stockId/candles", ({ params, request }) => {
    const stockID = Number(params.stockId);
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") || "250");

    const stock = mockStocks.find((s) => s.stockId === stockID);
    const basePrice = stock ? stock.price : 100;

    const candles = [];
    let currentTime = Math.floor(Date.now() / 1000) - limit * 60;

    for (let i = 0; i < limit; i++) {
      const change = (Math.random() - 0.5) * (basePrice * 0.02);
      const open = basePrice + change;
      const close = open + (Math.random() - 0.5) * (basePrice * 0.01);
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.005);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.005);
      const volume = Math.floor(Math.random() * 100000);

      candles.push({
        time: currentTime,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume,
      });

      currentTime += 60;
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: `/api/stocks/${stockID}/candles`,
      message: "종목 1분봉 캔들 차트 조회 성공",
      data: {
        candles,
      },
      error: null,
    });
  }),

  // 즐겨찾기 종목 해제
  http.delete("*/api/stocks/watchlist/:watchlistId", ({ params }) => {
    const watchlistID = Number(params.watchlistId);
    const index = mockWatchlist.findIndex((w) => w.watchlistId === watchlistID);

    if (index === -1) {
      return HttpResponse.json(
        {
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: `/api/stocks/watchlist/${watchlistID}`,
          message: "즐겨찾기 항목을 찾을 수 없습니다.",
          data: null,
          error: "Not Found",
        },
        { status: 404 },
      );
    }

    mockWatchlist.splice(index, 1);

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: `/api/stocks/watchlist/${watchlistID}`,
      message: "즐겨찾기가 해제되었습니다.",
      data: {
        deletedWatchlistId: watchlistID,
        remainingCount: mockWatchlist.length,
      },
      error: null,
    });
  }),

  // Yahoo 프록시 시세 조회
  http.get("*/api/quotes", ({ request }) => {
    const url = new URL(request.url);
    const symbolsParam = url.searchParams.get("symbols") || "";
    const symbols = symbolsParam.split(",").filter(Boolean);

    const quotes = symbols.map((symbol) => {
      const cleanSymbol = symbol.replace(".KS", "");
      const stock = mockStocks.find((s) => s.code === cleanSymbol);
      const basePrice = stock ? stock.price : 100;
      const change = stock ? stock.change : 0;
      const volume = stock ? stock.volume : 500000;

      return {
        symbol,
        price: basePrice,
        changePercent: change,
        change15m: change + (Math.random() - 0.5) * 0.5,
        change30m: change + (Math.random() - 0.5) * 1.0,
        volume,
        open: basePrice * 0.99,
        high: basePrice * 1.02,
        low: basePrice * 0.98,
        previousClose: basePrice / (1 + change / 100),
      };
    });

    return HttpResponse.json({ quotes });
  }),

  // Yahoo 프록시 캔들 조회
  http.get("*/api/candles", ({ request }) => {
    const url = new URL(request.url);
    const symbol = url.searchParams.get("symbol") || "";
    const interval = url.searchParams.get("interval") || "1d";
    const limit = 250;

    const cleanSymbol = symbol.replace(".KS", "");
    const stock = mockStocks.find((s) => s.code === cleanSymbol);
    const basePrice = stock ? stock.price : 100;

    const candles = [];
    let currentTime = Math.floor(Date.now() / 1000) - limit * 24 * 60 * 60;

    if (interval.endsWith("m")) {
      const minutes = parseInt(interval) || 1;
      currentTime = Math.floor(Date.now() / 1000) - limit * minutes * 60;
    }

    for (let i = 0; i < limit; i++) {
      const change = (Math.random() - 0.5) * (basePrice * 0.02);
      const open = basePrice + change;
      const close = open + (Math.random() - 0.5) * (basePrice * 0.01);
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.005);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.005);
      const volume = Math.floor(Math.random() * 100000);

      candles.push({
        time: currentTime,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume,
      });

      if (interval.endsWith("m")) {
        const minutes = parseInt(interval) || 1;
        currentTime += minutes * 60;
      } else {
        currentTime += 24 * 60 * 60;
      }
    }

    return HttpResponse.json({ candles });
  }),

  // 환율 조회 프록시
  http.get("*/api/fx", () => {
    return HttpResponse.json({
      usdKrw: 1345.5,
    });
  }),
];
