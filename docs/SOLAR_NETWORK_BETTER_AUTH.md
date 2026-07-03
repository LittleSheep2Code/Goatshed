# Solar Network × better-auth 集成笔记

本文档记录了将 Goatshed 从自研 OAuth 系统迁移到 better-auth + PostgreSQL 过程中的观察与经验。

## 架构概览

```
Browser → Goatshed (Nuxt 4/Nitro) → Solarpass (Solian OIDC Provider)
              ↕                              ↕
         PostgreSQL                    Solar Network API
                                           ↕
                                      Profile Cache (account.solar_profile)
```

- **better-auth** 使用 `genericOAuth` 插件通过 OIDC Discovery 与 Solarpass 集成
- **Session** 存储在 PostgreSQL (better-auth 的 `session` 表)
- **Profile 数据** 缓存在 `account.solar_profile` (jsonb)，TTL 24h
- **Niro 插件** 在每次请求时解析 session，挂载到 `event.context.session`

## 1. better-auth 配置

### genericOAuth 插件

```typescript
// server/utils/auth.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  plugins: [
    genericOAuth({
      config: [{
        providerId: "solian",
        clientId: process.env.SOLIAN_CLIENT_ID!,
        clientSecret: process.env.SOLIAN_CLIENT_SECRET!,
        discoveryUrl: "https://solian.app/.well-known/openid-configuration",
        scopes: ["openid", "profile", "email", "account.connections"],
        pkce: false,  // 见下方 "PKCE 问题"
      }],
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
```

### 回调路由

better-auth 的通用回调路径为 `/api/auth/callback/:providerId`，因此 Nitro catch-all 路由：

```typescript
// server/api/auth/[...all].ts
import { auth } from "../../utils/auth";
import { toWebRequest } from "h3";

export default defineEventHandler((event) => {
  const request = toWebRequest(event);
  return auth.handler(request);
});
```

> **注意**：better-auth 的 handler 接收标准 `Request` 对象，需用 `h3` 的 `toWebRequest()` 转换 `IncomingMessage`。

## 2. PKCE 注意事项

### 现象

初始配置时回调报 `oauth_code_verification_failed`。

### 根因

Solarpass 的 OAuth 客户端（`id.solian.app`）上的 `client_secret` 与 better-auth 中配置的不一致。Solarpass 支持 PKCE，错误是由于服务端 secret 不匹配导致 code exchange 失败。

### 观察

- Solarpass **完整支持 PKCE**，无需禁用
- `oauth_code_verification_failed` 是 Solarpass 返回的错误码，表示 token exchange 阶段的 code_verifier 验证失败
- 当 client_secret 不正确时，Solarpass 可能无法正确验证 code_verifier（因为 secret 是 token exchange 请求的一部分）
- 确认 secret 一致后，PKCE 正常工作
- `pkce: false` 是临时调试手段，生产环境应保持默认启用（better-auth 默认开启 PKCE）

## 3. Session 管理

### Nitro Plugin 模式

```typescript
// server/plugins/auth.ts — 在每次请求时解析 session
nitroApp.hooks.hook("request", async (event) => {
  const cookieHeader = getRequestHeader(event, "cookie") || "";
  if (!cookieHeader) { event.context.session = null; return; }

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  event.context.session = session;
});
```

**为什么需要这个插件？**

better-auth 的 `useSession()` 客户端工具只能在组件中使用。在 route middleware 和 server API 中，需要自行解析 session。Nitro plugin 确保每次请求都有 `event.context.session` 可用。

**注意事项**：

- `auth.api.getSession()` 会查询一次数据库。不要在每个 API 路由中重复调用，直接使用 `event.context.session`
- Profile endpoint (`/api/sn/profile`) 最初独立调用 `auth.api.getSession()`，导致 SSR sub-request 的 cookie 转发问题。改用 `event.context.session` 后问题解决

### 路由中间件

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    const session = await useServerSession(); // 读取 event.context.session
    if (!session) return navigateTo("/login");
  } else {
    const { data: session } = await useAuth().useSession(useFetch);
    if (!session.value) return navigateTo("/login");
  }
});
```

## 4. Profile 缓存

### 设计

Solar Network API (`/passport/accounts/me`) 每次调用都有网络开销。在 `account` 表的 `solar_profile` (jsonb) 列中缓存完整响应，TTL 24h。

```typescript
// server/db/schema.ts
export const account = pgTable("account", {
  // ... 标准 better-auth 列
  solarProfile: jsonb("solar_profile"),
  solarProfileUpdatedAt: timestamp("solar_profile_updated_at"),
});
```

### 缓存逻辑

```typescript
// server/utils/solarProfile.ts
export async function getCachedSolarProfile(userId: string, force = false) {
  // 1. 检查缓存是否新鲜 (< 24h)
  // 2. 如果 force 或过期，用 account.access_token 调用 API
  // 3. 更新 account.solar_profile 和 solar_profile_updated_at
}
```

### 观察

- `account.access_token` 已经由 better-auth 在 OAuth 流程中存储
- API 使用 Bearer token 认证：`Authorization: Bearer ${token}`
- Profile 数据包含 `name`, `nick`, `profile`, `language`, `region` 等字段

## 5. 头像 URL 问题

### 问题

better-auth 的 `user.image` 字段来自 OIDC 的 `picture` claim，Solarpass 不提供此字段。需要手动构造头像 URL。

### 解决

创建专用 endpoint `/api/sn/avatar`，从缓存的 solar profile 中读取 account name，构造 URL：

```
https://api.solian.app/passocol/accounts/{name}/picture
```

### 观察

- Solar Network 的 account picture 使用 account name（如 `littlesheep`），而非 display name
- better-auth 的 `user.name` 是 display name（如 `小羊`），不适用于构造 picture URL
- 需要始终使用 solar profile 的 `name` 字段

## 6. Admin 自动提升

利用 Nitro plugin 在每次 session 解析时检查用户 email，如果是 admin 则自动设置 `is_admin = true`：

```typescript
// server/plugins/auth.ts
const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",").map(e => e.trim()).filter(Boolean);

async function maybeAssignAdmin(userId: string, email: string) {
  if (!adminEmails.includes(email)) return;
  // 1h rate limit via in-memory Map
  await db.update(userTable).set({ isAdmin: true }).where(eq(userTable.id, userId));
}
```

### 观察

- 使用内存 Map 做 rate limit（单次请求周期内生效，重启清空）
- Dev 模式下 `ADMIN_EMAILS` 为空时，Capital 的逻辑是所有用户都是 admin。Goatshed 未继承此行为
- 注意：只检查 session resolve 时的 email，不监听 email 变更。如果用户更换 email，旧的 admin 状态不会自动撤销

## 7. SSR 子请求的 Cookie 转发

### 问题

Nuxt 的 `useFetch` 在 SSR 模式下向 `/api/sn/profile` 发子请求时，若不显式转发 cookie，session 无法解析。

### 解决

```typescript
// 在所有 SSR 期间的 useFetch 中
const { data: profile } = await useFetch("/api/sn/profile", {
  headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
});
```

### 观察

- 客户端请求自动携带 cookie（同源）
- SSR 子请求默认不转发原始请求的 cookie
- `useRequestHeaders(["cookie"])` 显式复制 cookie header
- 更优的解法是在 API endpoint 中使用 `event.context.session`，避免重复 session 解析

## 8. callbackURL 问题

### 现象

`signIn.social({ provider: 'solian', callbackURL: next })` 使用相对路径 `/me` 时，OAuth 完成后会回到 `/login?next=/me` 而非 `/me`。

### 解决

```typescript
const callbackURL = new URL(next, useRequestURL().origin).toString();
await auth.signIn.social({ provider: "solian", callbackURL });
```

### 观察

- better-auth 需要完整的绝对 URL 作为 `callbackURL`
- 相对路径会被拼接或忽略，导致重定向异常

## 9. Bootstrap Icon / 通用 OAuth provider ID

better-auth 的 `genericOAuth` 使用 `providerId` 作为回调路径的一部分：

- 回调 URL: `/api/auth/callback/{providerId}`
- 如果 providerId 为 `solian`，则回调为 `/api/auth/callback/solar`

需要在 Solarpass 的 OAuth client 配置中注册对应的重定向 URI。

## 10. 总结

| 方面 | 自研方案 | better-auth |
|------|---------|------------|
| Session 存储 | 文件系统 (Nitro storage) | PostgreSQL |
| Session 解析 | 自研 HMAC 签名 cookie | better-auth 内置 |
| OAuth 流程 | 手动 PKCE + state | 自动处理 |
| Profile 缓存 | 文件系统 (1h TTL) | PostgreSQL JSONB (24h TTL) |
| Admin 管理 | 硬编码锁定 | DB flag + 自动提升 |
| 代码量 | ~250 行 session.ts | ~30 行 auth.ts |

### 不适用场景

- Solarpass 不支持 PKCE，需显式禁用
- Solarpass 不提供 `picture` claim，需手动构造头像 URL
- Solarpass 的 `id_token` 可能需要特殊解析（better-auth 的 genericOAuth 已处理）
