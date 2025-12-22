# GitLab Code Review MCP 使用说明（简化版）

本 README 只关注 **怎么用、能做什么、如何扩展 Review 规则**，适合第一次接触或日常使用。

---

## 一、这个 MCP 是干什么的？

这是一个 **GitLab Code Review MCP Server**，可以让 IDE / Agent：

- 读取 GitLab Merge Request 的信息和 Diff
- 基于代码内容进行自动 Review
- 将 Review 结果直接评论到 GitLab（普通评论 / 行内评论）

典型用途：

- 打开 MR 链接 → 自动拉取代码 → 分析问题 → 回写评论

---

## 二、能力一览（MCP 能做什么）

当前 MCP 提供以下能力：

### 1️⃣ 获取 MR 内容并用于 Review

- MR 基本信息（标题、描述、作者、分支）
- 变更文件列表
- 每个文件的 diff 内容

### 2️⃣ 自动 Review（由大模型完成）

- 分析代码逻辑问题
- 发现潜在 Bug / 风险
- 给出优化建议

### 3️⃣ 向 GitLab 回写结果

- 普通评论（MR 时间线）
- 指定文件 + 行号的行内评论

---

## 三、配置方式（必看）

### 1️⃣ Antigravity IDE 中配置 MCP

```json
{
  "mcpServers": {
    "gitlab-review-server": {
      "command": "node",
      "args": ["/Users/xxx/gitlab-code-review-mcp/dist/index.mjs"],
      "env": {
        "GITLAB_TOKEN": "<你的 GitLab Token>",
        "GITLAB_HOST": "https://gitlab.example.com",
        "NODE_TLS_REJECT_UNAUTHORIZED": "0"
      }
    }
  }
}
```

### 2️⃣ 环境变量说明

| 变量名       | 是否必填 | 说明                                                       |
| ------------ | -------- | ---------------------------------------------------------- |
| GITLAB_TOKEN | ✅       | 具有 API 访问权限的 Token                                  |
| GITLAB_HOST  | ❌       | GitLab 地址，默认 [https://gitlab.com](https://gitlab.com) |

⚠️ **注意**：

- MCP 通过 `stdio` 通信，**不要在 stdout 打印非 JSON 内容**
- 日志请使用 `console.error`

---

## 四、启动与使用流程

### 使用流程（最常见）

1. IDE 启动 MCP Server
2. 在对话中提供 GitLab MR 链接
3. Agent 自动调用 MCP 工具：

   - 读取 MR + Diff
   - 执行代码 Review

4. 根据需要：

   - 给出 Review 结果
   - 或直接回写 GitLab 评论

### 示例

> 帮我 review 这个 MR：
> [https://gitlab.example.com/foo/bar/-/merge_requests/123](https://gitlab.example.com/foo/bar/-/merge_requests/123)

---

## 五、如果我想「新增 Review 关注点」该怎么做？（重点）

### 场景示例

> 我希望在 Review React 代码时，**特别关注 `useMemo` 和 `useCallback` 的使用是否合理**

这类需求 **不需要改 MCP 代码**，而是通过 **Prompt / Review 规则** 来完成。

---

## 六、正确的扩展方式（推荐）

### 方式一：在 Review Prompt 中新增规则（最推荐）

你需要做的是：

#### 1️⃣ 明确规则描述（给模型看的）

```text
在 Review React 代码时，请额外关注以下内容：

- useMemo：
  - 是否真的存在性能收益
  - 依赖数组是否完整、正确
  - 是否存在滥用（包裹轻量计算）

- useCallback：
  - 是否用于稳定函数引用（如 props / deps）
  - 是否存在无意义的 useCallback
  - 依赖项是否正确
```

#### 2️⃣ 让 Agent 在调用 MCP 前加载该 Prompt

- MCP 只负责 **拿数据 + 回写结果**
- **Review 逻辑 = Prompt 决定**

这是最稳定、最低维护成本的方案。

---

### 方式二：做成「可选 Review 模块」（进阶）

你可以抽象成：

```ts
const reviewRules = {
  reactHooks: {
    useMemo: true,
    useCallback: true,
  },
};
```

然后在 Prompt 中：

```text
当前启用的 Review 规则：
- React Hooks 性能规范（useMemo / useCallback）
```

这样可以做到：

- 不同项目启用不同 Review 关注点
- 同一个 MCP Server，多种 Review 风格

---

## 七、不推荐的做法（⚠️）

❌ 不建议：

- 把 Review 规则写死在 MCP Server 代码里
- 为每种规则新增一个 MCP Tool

原因：

- MCP 应该是「能力层」，不是「策略层」
- Review 策略频繁变化，Prompt 更适合

---

## 八、最佳实践总结

- MCP：

  - 只做 **数据获取 / 回写 GitLab**

- Prompt：

  - 决定 **怎么 Review、关注什么**

- 新增 Review 细节：

  - 99% 情况只需要改 Prompt

如果你后面想：

- 把 Review 规则模板化
- 或做成公司级 Review 规范
- 或接入 CI 做 Gate

都可以在这个结构上自然演进。

---

## 九、MCP Tools 使用详解

### 工具列表

| 工具名                       | 功能描述                 | 参数                                           |
| ---------------------------- | ------------------------ | ---------------------------------------------- |
| `fetch_mr_context`           | 获取 MR 基本信息和 Diff  | `url`: MR 完整 URL                             |
| `analyze_changes_with_rules` | 使用内置规则分析代码变更 | `changes`: 文件变更数组                        |
| `post_mr_comment`            | 发表普通 MR 评论         | `url`, `commentBody`                           |
| `post_inline_comment`        | 发表行内评论             | `url`, `filePath`, `lineNumber`, `commentBody` |

### 详细使用示例

#### 1️⃣ 获取 MR 信息

```
帮我获取这个 MR 的详细信息：
https://gitlab.example.com/foo/bar/-/merge_requests/123
```

#### 2️⃣ 完整 Review 流程

```
请帮我 Review 这个 MR 并给出建议：
https://gitlab.example.com/foo/bar/-/merge_requests/123

重点关注：
- 代码安全性
- 性能问题
- 代码规范
```

#### 3️⃣ 使用内置规则分析

```
请使用内置的代码规则分析这个 MR 的变更：
https://gitlab.example.com/foo/bar/-/merge_requests/123
```

#### 4️⃣ 发表评论到 GitLab

```
请将 Review 结果以评论形式发布到 MR：
https://gitlab.example.com/foo/bar/-/merge_requests/123
```

#### 5️⃣ 发表行内评论

```
请在 src/utils/helper.ts 文件的第 42 行添加行内评论，
指出这里可能存在的空指针问题：
https://gitlab.example.com/foo/bar/-/merge_requests/123
```

---

## 十、如何新增 Review 规则

### 方式一：在 `src/rules/` 目录新增代码规则

适用于：固定的、通用的检查规则（如禁止 console.log、检测 debugger 等）

#### 步骤 1：创建规则文件

```typescript
// src/rules/noDebugger.ts
import type { FileChange, ReviewFinding } from "./types";

export function noDebugger(change: FileChange): ReviewFinding[] {
  // 使用正则检测 debugger 语句
  const regex = /^\+.*\bdebugger\b/gm;

  if (!regex.test(change.diff)) return [];

  return [
    {
      filePath: change.filePath,
      severity: "error",
      ruleId: "no-debugger",
      message: "debugger statement should not be committed",
      suggestion: "Remove the debugger statement before merging",
    },
  ];
}
```

#### 步骤 2：在 index.ts 中注册规则

```typescript
// src/rules/index.ts
import { noConsoleLog } from "./noConsoleLog.js";
import { largeDiff } from "./largeDiff.js";
import { noDebugger } from "./noDebugger.js"; // 新增

export const rules = [noConsoleLog, largeDiff, noDebugger]; // 新增
```

#### 步骤 3：重新构建

```bash
npm run build
```

#### 规则类型定义参考

```typescript
// src/rules/types.ts
export type Severity = "info" | "warning" | "error";

export interface ReviewFinding {
  filePath: string;
  line?: number; // 可选：具体行号
  severity: Severity;
  ruleId: string; // 规则唯一标识
  message: string; // 问题描述
  suggestion: string; // 修复建议
}
```

---

### 方式二：通过 Prompt 指导 Agent（推荐用于动态规则）

适用于：灵活的、项目特定的 Review 关注点

在对话中直接告诉 Agent 你的 Review 关注点：

```
请 Review 这个 MR，特别关注：
1. React Hooks 的使用是否正确（useMemo、useCallback 依赖项）
2. 是否有潜在的内存泄漏
3. API 调用是否有错误处理

https://gitlab.example.com/foo/bar/-/merge_requests/123
```

#### 更完整的 Prompt 示例

```
作为资深工程师，请帮我 Review 以下 MR：

## Review 重点
- **安全性**：检查是否有 SQL 注入、XSS 等安全漏洞
- **性能**：检查是否有 N+1 查询、不必要的重渲染
- **代码规范**：变量命名、函数拆分、注释完整性
- **React 特定**：Hooks 依赖项、组件拆分合理性

## 输出格式
请按严重程度分类输出问题，并给出具体的修改建议。

MR 链接：https://gitlab.example.com/foo/bar/-/merge_requests/123
```

#### 优势

- 无需修改代码，即时生效
- 可针对不同项目、不同场景灵活调整
- 适合团队成员根据自己的关注点定制
