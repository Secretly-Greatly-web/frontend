import { authHandlers } from "./handler/auth.handler";
import { stocksHandlers } from "./handler/stocks.handler";
import { healthHandlers } from "./handler/health.handler";
import { newsHandlers } from "./handler/news.handler";
import { positionsHandlers } from "./handler/positions.handler";
import { indicatorsHandlers } from "./handler/indicators.handler";
import { chatHandlers } from "./handler/chat.handler";

export const handlers = [
  ...authHandlers,
  ...stocksHandlers,
  ...healthHandlers,
  ...newsHandlers,
  ...positionsHandlers,
  ...indicatorsHandlers,
  ...chatHandlers,
];
