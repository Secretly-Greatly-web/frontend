import { http, HttpResponse } from "msw";

export const authHandlers = [
  // 회원가입
  http.post("*/api/auth", async ({ request }) => {
    const body = (await request.json()) as any;
    if (
      !body.email ||
      !body.fixedNickname ||
      !body.password ||
      !body.checkPassword
    ) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth",
          message: "필수 입력 항목이 누락되었습니다.",
          data: null,
          error: "Bad Request",
        },
        { status: 400 },
      );
    }

    if (body.password !== body.checkPassword) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth",
          message: "비밀번호가 일치하지 않습니다.",
          data: null,
          error: "Bad Request",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: "/api/auth",
      message: "회원가입이 완료되었습니다.",
      data: {
        userId: "mock-new-user-id-56789",
      },
      error: null,
    });
  }),

  // 로그인 성공 모킹 핸들러
  http.post("*/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as any;

    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth/login",
          message: "이메일과 비밀번호를 입력해주세요.",
          data: null,
          error: "Bad Request",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/api/auth/login",
      message: "로그인에 성공했습니다. 에디터 세션이 동기화됩니다.",
      data: {
        userId: "mock-user-id-12345",
        fixedNickname: "test_user",
        accessToken: "mock-jwt-access-token-abcde",
      },
      error: null,
    });
  }),

  // 익명 임시 세션 발급 핸들러
  http.post("*/api/auth/anonymous", () => {
    return HttpResponse.json({
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: "/api/auth/anonymous",
      message: "익명 임시 세션 발급이 완료되었습니다.",
      data: {
        userId: "mock-anonymous-user-id",
        anonymousToken: "mock-anonymous-token-uuid",
        accessToken: "mock-jwt-anonymous-token-xyz",
      },
      error: null,
    });
  }),

  // 현재 로그인 사용자 조회
  http.get("*/api/auth/me", ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    const isAnonymous = authHeader?.includes("anonymous") || false;

    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/api/auth/me",
      message: "현재 로그인 사용자 조회에 성공했습니다.",
      data: {
        userId: isAnonymous ? "mock-anonymous-user-id" : "mock-user-id-12345",
        email: isAnonymous ? null : "test_user@example.com",
        nickname: isAnonymous ? "anonymous_user" : "test_user",
        isAnonymous: isAnonymous,
        createdAt: new Date().toISOString(),
      },
      error: null,
    });
  }),

  // KIS key 등록
  http.post("*/api/auth/kis-credential", async ({ request }) => {
    const body = (await request.json()) as any;
    if (!body.appKey || !body.appSecret) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth/kis-credential",
          message: "appKey와 appSecret을 모두 입력해주세요.",
          data: null,
          error: "Bad Request",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: "/api/auth/kis-credential",
      message: "KIS API 키가 등록되었습니다.",
      data: {
        registered: true,
        maskedAppKey: `${body.appKey.slice(0, 4)}****${body.appKey.slice(-4)}`,
        registeredAt: new Date().toISOString(),
      },
      error: null,
    });
  }),

  // KIS key 조회
  http.get("*/api/auth/kis-credential", () => {
    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/api/auth/kis-credential",
      message: "KIS API 키 등록 상태 조회 성공",
      data: {
        registered: true,
        maskedAppKey: "PSxa****9f2c",
        registeredAt: new Date().toISOString(),
      },
      error: null,
    });
  }),

  // 임시 비밀번호 메일 발송
  http.post("*/api/auth/passwords/reset-request", async ({ request }) => {
    const body = (await request.json()) as any;
    if (!body.email) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth/passwords/reset-request",
          message: "이메일을 입력해주세요.",
          data: null,
          error: "Bad Request",
        },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/api/auth/passwords/reset-request",
      message:
        "등록된 이메일로 임시 비밀번호가 발송되었습니다. 메일함을 확인해주세요.",
      data: {
        mailSent: true,
      },
      error: null,
    });
  }),

  // 비밀번호 최종 재설정 및 변경
  http.patch("*/api/auth/passwords", async ({ request }) => {
    const body = (await request.json()) as any;
    if (!body.currentPassword || !body.newPassword || !body.checkNewPassword) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth/passwords",
          message: "필수 입력 항목이 누락되었습니다.",
          data: null,
          error: "Bad Request",
        },
        { status: 400 },
      );
    }
    if (body.newPassword !== body.checkNewPassword) {
      return HttpResponse.json(
        {
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth/passwords",
          message: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
          data: null,
          error: "Bad Request",
        },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: "/api/auth/passwords",
      message:
        "비밀번호 재설정이 완료되었습니다. 새 비밀번호로 다시 로그인해주세요.",
      data: {
        passwordUpdated: true,
      },
      error: null,
    });
  }),
];
