# GitLab Code Review MCP 使用说明（简化版）

本 README 只关注 **怎么用、能做什么、如何扩展 Review 规则**，适合第一次接触或日常使用。

---

## 一、这个 MCP 是干什么的？

这是一个 **GitLab Code Review MCP Server**，可以让 IDE / Agent：

* 读取 GitLab Merge Request 的信息和 Diff
* 基于代码内容进行自动 Review
* 将 Review 结果直接评论到 GitLab（普通评论 / 行内评论）

典型用途：

* 打开 MR 链接 → 自动拉取代码 → 分析问题 → 回写评论

---

## 二、能力一览（MCP 能做什么）

当前 MCP 提供以下能力：

### 1️⃣ 获取 MR 内容并用于 Review

* MR 基本信息（标题、描述、作者、分支）
* 变更文件列表
* 每个文件的 diff 内容

### 2️⃣ 自动 Review（由大模型完成）

* 分析代码逻辑问题
* 发现潜在 Bug / 风险
* 给出优化建议

### 3️⃣ 向 GitLab 回写结果

* 普通评论（MR 时间线）
* 指定文件 + 行号的行内评论

---

## 三、配置方式（必看）

### 1️⃣ Antigravity IDE 中配置 MCP

```json
{
  "mcpServers": {
    "gitlab-review-server": {
      "command": "node",
      "args": [
        "/Users/xxx/gitlab-code-review-mcp/dist/index.mjs"
      ],
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

| 变量名          | 是否必填 | 说明                                                    |
| ------------ | ---- | ----------------------------------------------------- |
| GITLAB_TOKEN | ✅    | 具有 API 访问权限的 Token                                    |
| GITLAB_HOST  | ❌    | GitLab 地址，默认 [https://gitlab.com](https://gitlab.com) |

⚠️ **注意**：

* MCP 通过 `stdio` 通信，**不要在 stdout 打印非 JSON 内容**
* 日志请使用 `console.error`

---

## 四、启动与使用流程

### 使用流程（最常见）

1. IDE 启动 MCP Server
2. 在对话中提供 GitLab MR 链接
3. Agent 自动调用 MCP 工具：

   * 读取 MR + Diff
   * 执行代码 Review
4. 根据需要：

   * 给出 Review 结果
   * 或直接回写 GitLab 评论

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

* MCP 只负责 **拿数据 + 回写结果**
* **Review 逻辑 = Prompt 决定**

这是最稳定、最低维护成本的方案。

---

### 方式二：做成「可选 Review 模块」（进阶）

你可以抽象成：

```ts
const reviewRules = {
  reactHooks: {
    useMemo: true,
    useCallback: true
  }
}
```

然后在 Prompt 中：

```text
当前启用的 Review 规则：
- React Hooks 性能规范（useMemo / useCallback）
```

这样可以做到：

* 不同项目启用不同 Review 关注点
* 同一个 MCP Server，多种 Review 风格

---

## 七、不推荐的做法（⚠️）

❌ 不建议：

* 把 Review 规则写死在 MCP Server 代码里
* 为每种规则新增一个 MCP Tool

原因：

* MCP 应该是「能力层」，不是「策略层」
* Review 策略频繁变化，Prompt 更适合

---

## 八、最佳实践总结

* MCP：

  * 只做 **数据获取 / 回写 GitLab**
* Prompt：

  * 决定 **怎么 Review、关注什么**
* 新增 Review 细节：

  * 99% 情况只需要改 Prompt

如果你后面想：

* 把 Review 规则模板化
* 或做成公司级 Review 规范
* 或接入 CI 做 Gate

都可以在这个结构上自然演进。
