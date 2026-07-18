import { http, HttpResponse } from "msw";

export const indicatorsHandlers = [
  // VSCode 상태 표시줄 위장 선행지표 조회
  http.get("*/api/indicators/statusbar", () => {
    const components = [
      {
        componentId: "status.market.kospi",
        label: "KSP",
        value: "2684.50 (-0.42%)",
      },
      {
        componentId: "status.market.kosdaq",
        label: "KSD",
        value: "845.20 (+0.15%)",
      },
      {
        componentId: "status.market.nasdaq",
        label: "NAS",
        value: "16100.20 (+0.85%)",
      },
      {
        componentId: "status.market.nasdaq100",
        label: "NDX",
        value: "18020.10 (+0.92%)",
      },
      {
        componentId: "status.market.sp500",
        label: "S&P",
        value: "5120.30 (+0.60%)",
      },
    ];

    const singleLineStream = components
      .map((c) => `${c.label} ${c.value}`)
      .join("  |  ");

    return HttpResponse.json({
      success: true,
      message:
        "VSCode 에디터 하단 상태 표시줄 위장 선행지표 캐시 조회가 완료되었습니다.",
      data: {
        totalComponents: components.length,
        singleLineStream,
        components,
      },
    });
  }),

  // 물타기/추가매수 평단가 시뮬레이션
  http.post("*/api/indicators", async ({ request }) => {
    const body = (await request.json()) as any;
    const {
      code,
      currentAvgPrice,
      currentQuantity,
      purchasePrice,
      purchaseQuantity,
    } = body;

    if (
      !code ||
      currentAvgPrice === undefined ||
      currentQuantity === undefined ||
      purchasePrice === undefined ||
      purchaseQuantity === undefined
    ) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: "/api/indicators",
          message: "필수 입력 항목이 누락되었습니다.",
          data: null,
          error: "Bad Request",
        },
        { status: 400 },
      );
    }

    const calculatedQuantity = currentQuantity + purchaseQuantity;
    const currentTotalAmount = currentAvgPrice * currentQuantity;
    const purchaseTotalAmount = purchasePrice * purchaseQuantity;
    const totalInvestedAmount = currentTotalAmount + purchaseTotalAmount;

    const calculatedAvgPrice =
      Math.round((totalInvestedAmount / calculatedQuantity) * 100) / 100;
    const calculatedEvaluationAmount = purchasePrice * calculatedQuantity; // currentPrice is assumed to be purchasePrice in simulation engine
    const calculatedEvaluationProfit =
      calculatedEvaluationAmount - totalInvestedAmount;
    const calculatedRateOfReturn =
      Math.round((calculatedEvaluationProfit / totalInvestedAmount) * 10000) /
      100;

    const formattedPrice = calculatedAvgPrice.toLocaleString();
    const formattedQty = calculatedQuantity.toFixed(1);
    const formattedReturn = calculatedRateOfReturn.toFixed(2);
    const formattedLog = `[Optimizer Info] Asset '${code}' thread tuned. Expected AvgPrice: ${formattedPrice}, Total Qty: ${formattedQty}, ReturnRatio: ${formattedReturn}. Break-even threshold optimized.`;

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/api/indicators",
      message: "가상 추가 매수 시뮬레이션 7대 자산 연산이 완료되었습니다.",
      data: {
        code,
        currentPrice: purchasePrice,
        calculatedAvgPrice,
        calculatedQuantity,
        calculatedEvaluationAmount,
        calculatedEvaluationProfit,
        calculatedRateOfReturn,
        formattedLog,
      },
      error: null,
    });
  }),
];
