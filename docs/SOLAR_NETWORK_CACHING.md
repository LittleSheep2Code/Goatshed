# Solar Network API 调用与用户信息缓存

本文档描述了 Goatshed 如何调用 Solar Network API 并在 PostgreSQL 中缓存用户信息。

## 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          Profife Load                            │
│                                                                  │
│  1. Check cache (account.solar_profile, solar_profile_updated_at)│
│  2. If fresh (< 24h) → return cached                            │
│  3. If stale/missing → fetch from Solar Network API             │
│  4. Update cache → return fresh data                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 1. 数据库模型

### Account 表扩展

在 better-auth 标准的 `account` 表基础上，添加两列用于缓存：

```typescript
// server/db/schema.ts
export const account = pgTable("account", {
  // ... better-auth 标准列
  id: text("id").primaryKey(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  // ...

  // Solar Network profile cache
  solarProfile: jsonb("solar_profile"),
  solarProfileUpdatedAt: timestamp("solar_profile_updated_at"),
});
```

### 为什么放在 account 表而非 user 表

- OAuth tokens 本身就在 `account` 表中（better-auth 的设计）
- Profile 数据是通过 `account.access_token` 获取的
- 一个 user 可能绑定多个 account（多 OAuth provider）
- 缓存与 token 关联，token 过期时缓存自然失效

## 2. 缓存读取工具

### getSolarToken

从 `account` 表读取 access_token：

```typescript
// server/utils/solarProfile.ts
export async function getSolarToken(userId: string): Promise<string | null> {
  const [record] = await db
    .select({ accessToken: account.accessToken })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "solian")))
    .limit(1);
  return record?.accessToken ?? null;
}
```

### getCachedSolarProfile

带 TTL 检查和强制刷新能力的缓存读取：

```typescript
export async function getCachedSolarProfile(userId: string, force = false) {
  // 1. 读取缓存
  const [record] = await db
    .select({
      solarProfile: account.solarProfile,
      solarProfileUpdatedAt: account.solarProfileUpdatedAt,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "solian")))
    .limit(1);

  // 2. 检查新鲜度
  if (!force && isFresh(record)) {
    return record.solarProfile;
  }

  // 3. 获取 token 并调用 API
  const token = await getSolarToken(userId);
  if (!token) return record?.solarProfile ?? null;

  // 4. 调用 Solar Network API
  const response = await fetch(
    `${config.public.apiBaseUrl}/passport/accounts/me`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) return record?.solarProfile ?? null;

  // 5. 解析并更新缓存
  const profile = await response.json();
  await db.update(account)
    .set({ solarProfile: profile, solarProfileUpdatedAt: new Date() })
    .where(...);

  return profile;
}
```

## 3. Solar Network API 调用

### 认证方式

所有 API 调用使用 Bearer token（来自 account 表的 access_token）：

```
Authorization: Bearer <access_token>
```

### 常用端点

| 端点 | 用途 | 需要认证 |
|------|------|---------|
| `/passport/accounts/me` | 当前用户完整 Profile | ✅ |
| `/passport/accounts/{name}` | 公开账户信息 | 可选 |
| `/sphere/posts` | 文章列表 | 可选（锁定内容需要） |
| `/sphere/posts/{id}` | 单篇文章 | 可选（锁定内容需要） |
| `/sphere/publishers/{name}` | 发布者信息 | ❌ |

### floatingFetch 封装

```typescript
// server/utils/floating-api.ts
export async function floatingFetch<T>(
  event: Parameters<typeof useRuntimeConfig>[0],
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const config = useRuntimeConfig(event);
  const headers = new Headers(options.headers || {});

  if (!headers.has("content-type") && options.body) {
    headers.set("content-type", "application/json");
  }
  if (options.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${config.public.apiBaseUrl}${path}`, {
    ...options, headers,
  });

  if (!response.ok) { /* throw */ }

  const data = await response.json();
  return snakeToCamel<T>(data);  // snake_case → camelCase
}
```

### 调用示例

```typescript
// 带认证的 API 调用
const token = await getSolarToken(userId);
const profile = await floatingFetch<Profile>(
  event,
  `/passport/accounts/${encodeURIComponent(name)}`,
  { token: token ?? undefined }
);
```

## 4. API 端点实现

### GET /api/sn/profile

返回当前用户的 solar profile（带缓存）：

```typescript
export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) throw createError({ statusCode: 401 });

  const profile = await getCachedSolarProfile(session.user.id);
  return profile;
});
```

### POST /api/sn/refresh

强制刷新缓存：

```typescript
export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) throw createError({ statusCode: 401 });

  const profile = await getCachedSolarProfile(session.user.id, true);
  return profile;
});
```

### GET /api/sn/avatar

轻量端点，仅返回头像 URL：

```typescript
export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) throw createError({ statusCode: 401 });

  const [record] = await db
    .select({ solarProfile: account.solarProfile })
    .from(account)
    .where(...);

  const name = record?.solarProfile?.name;
  if (!name) return { avatarUrl: null, name: session.user.name };

  return {
    avatarUrl: `${config.public.apiBaseUrl}/passport/accounts/${encodeURIComponent(name)}/picture`,
    name,
  };
});
```

### GET /api/accounts/{name}

公开账户信息（从 Solar Network API 读取）：

```typescript
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  const token = await getSolarTokenFromSession(event);
  return floatingFetch(event, `/passport/accounts/${name}`, { token });
});
```

## 5. 缓存策略

### TTL

| 数据类型 | TTL | 存储位置 |
|---------|-----|---------|
| Solar Profile | 24h | account.solar_profile (jsonb) |
| Avatar URL | 24h | 从 solar_profile.name 构造 |
| Session | 由 better-auth 管理 | better-auth session 表 |
| OAuth Token | 由 better-auth 管理 | account.access_token |

### 失效策略

- **时间过期**：`solar_profile_updated_at` 超过 24h 自动失效
- **手动刷新**：用户点击"刷新资料"调用 POST /api/sn/refresh
- **Token 过期**：如果 access_token 过期，API 调用失败，继续使用旧缓存
- **新用户**：首次登录时 `solar_profile` 为 null，必须从 API 获取

### 客户端刷新

```typescript
// app/pages/me.vue
async function refreshProfile() {
  isRefreshing.value = true;
  try {
    const data = await $fetch("/api/sn/refresh", { method: "POST" });
    if (data) profile.value = { ...data, updatedAt: new Date().toISOString() };
  } finally {
    isRefreshing.value = false;
  }
}
```

## 6. 缓存穿透处理

| 场景 | 行为 |
|------|------|
| 缓存为空 + API 成功 | 写入缓存，返回数据 |
| 缓存为空 + API 失败 | 返回 null |
| 缓存过期 + API 成功 | 更新缓存，返回新数据 |
| 缓存过期 + API 失败 | 返回过期缓存（stale-while-error）|
| 强制刷新 + API 失败 | 返回过期缓存（不抛错）|

## 7. 跨 API 调用模式

当 API 需要当前用户的 token 时，统一通过以下链路获取：

```
event.context.session (Niro Plugin 已解析)
    ↓
session.user.id
    ↓
getSolarToken(userId) → SELECT access_token FROM account WHERE ...
    ↓
floatingFetch(event, path, { token })
```

不需要在每个 API 中重复解析 session。

## 8. 注意事项

- Solar Network API 的 `access_token` 由 better-auth 在 OAuth callback 时存储
- Token 刷新由 better-auth 的 `refreshToken` 机制处理（如果 provider 返回 refresh_token）
- Profile 的 `name` 字段是 Solar Network 账户名（如 `littlesheep`），用于构造 picture URL
- Profile 的 `nick` 字段是用户昵称（如 `小羊`），用于 UI 显示
- `account.providerId` 固定为 `"solian"`，用于区分多 provider 场景
