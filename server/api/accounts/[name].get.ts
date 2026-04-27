import type { Account } from "../../../app/types/account";
import { floatingFetch } from "../../utils/floating-api";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Missing account name" });
  }

  return floatingFetch<Account>(event, `/passport/accounts/${encodeURIComponent(name)}`);
});
