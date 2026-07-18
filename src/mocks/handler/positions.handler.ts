import { http, HttpResponse } from "msw";
import { mockStocks } from "./stocks.handler";

export const mockPositions = [
  {
    positionId: 501,
    stockId: 1,
    stockCode: "005930",
    stockName: "삼성전자",
    market: "KR",
    averagePrice: 70000,
    quantity: 10,
    totalInvestedAmount: 700000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    positionId: 502,
    stockId: 2,
    stockCode: "AAPL",
    stockName: "Apple Inc.",
    market: "US",
    averagePrice: 175.5,
    quantity: 5,
    totalInvestedAmount: 877.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const positionsHandlers = [
  // 내 종목 리스트 조회
  http.get("*/api/positions", () => {
    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/api/positions",
      message: "내 종목 리스트 조회가 완료되었습니다.",
      data: mockPositions,
      error: null,
    });
  }),

  // 내 종목 일괄 추가
  http.post("*/api/positions", async ({ request }) => {
    const body = (await request.json()) as any[];
    const createdItems: any[] = [];

    for (const item of body) {
      const stock = mockStocks.find((s) => s.stockId === item.stockId);
      if (!stock) continue;

      const existing = mockPositions.find((p) => p.stockId === item.stockId);
      if (existing) {
        const oldTotal = existing.averagePrice * existing.quantity;
        const newTotal = item.purchasePrice * item.purchaseQuantity;
        existing.quantity += item.purchaseQuantity;
        existing.averagePrice =
          Math.round(((oldTotal + newTotal) / existing.quantity) * 100) / 100;
        existing.totalInvestedAmount =
          existing.averagePrice * existing.quantity;
        existing.updatedAt = new Date().toISOString();
        createdItems.push(existing);
      } else {
        const nextID =
          Math.max(...mockPositions.map((p) => p.positionId), 500) + 1;
        const newItem = {
          positionId: nextID,
          stockId: stock.stockId,
          stockCode: stock.code,
          stockName: stock.name,
          market: stock.market === "DOMESTIC" ? "KR" : "US",
          averagePrice: item.purchasePrice,
          quantity: item.purchaseQuantity,
          totalInvestedAmount: item.purchasePrice * item.purchaseQuantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockPositions.push(newItem);
        createdItems.push(newItem);
      }
    }

    return HttpResponse.json({
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: "/api/positions",
      message: "내 종목이 성공적으로 추가되었습니다.",
      data: createdItems,
      error: null,
    });
  }),

  // 내 종목 수정
  http.patch("*/api/positions/:positionId", async ({ params, request }) => {
    const positionID = Number(params.positionId);
    const body = (await request.json()) as any;
    const existing = mockPositions.find((p) => p.positionId === positionID);

    if (!existing) {
      return HttpResponse.json(
        {
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: `/api/positions/${positionID}`,
          message: "해당 보유 주식을 찾을 수 없습니다.",
          data: null,
          error: "Not Found",
        },
        { status: 404 },
      );
    }

    if (body.averagePrice !== undefined) {
      existing.averagePrice = body.averagePrice;
    }
    if (body.quantity !== undefined) {
      existing.quantity = body.quantity;
    }
    existing.totalInvestedAmount = existing.averagePrice * existing.quantity;
    existing.updatedAt = new Date().toISOString();

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: `/api/positions/${positionID}`,
      message: "내 종목 수정에 성공했습니다.",
      data: existing,
      error: null,
    });
  }),

  // 내 종목 삭제
  http.delete("*/api/positions/:positionId", ({ params }) => {
    const positionID = Number(params.positionId);
    const index = mockPositions.findIndex((p) => p.positionId === positionID);

    if (index === -1) {
      return HttpResponse.json(
        {
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: `/api/positions/${positionID}`,
          message: "해당 보유 주식을 찾을 수 없습니다.",
          data: null,
          error: "Not Found",
        },
        { status: 404 },
      );
    }

    const deleted = mockPositions.splice(index, 1)[0];

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: `/api/positions/${positionID}`,
      message: "내 종목이 성공적으로 삭제되었습니다.",
      data: {
        positionId: deleted.positionId,
      },
      error: null,
    });
  }),
];
