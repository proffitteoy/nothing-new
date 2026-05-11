在我们初代的计划中分为了7大阶段：
![[4a0f8edb56228725d5a30b12f7879824.png]]
其中阶段2和3都是P0级别的，且都和leader的核心能力有关，因此我们把这两阶段合并处理。

我这里使用先计划后编写的策略，利用codex进行计划文档的编写，之后利用claude进行审核，codex的提示词如下：

```prompt
编写阶段 1的计划文档，至少完成状态机的设计，上下文的动态静态两种存储方式，子agent与leader的通讯链路
```

codex的输出跨越了几个文档，总体来说是较为详细的，我直接使用claude进行评审：
![[2ccc29b54a2df981267ce3215c8e8d88.png]]


claude对codex编写的计划总体评价比较高

定位清晰（"定型底座，不急着接生成器"），三件核心交付物（状态机、上下文存储、通讯链路）互相支撑且边界明确。同步更新的文档（架构模板、上下文设计、初始化计划、canvas、README）保持了一致性，没有出现术语分叉。

其中问题也比较明显：

|   # | 类别   | 问题                                                                                                                     | 建议                                                                    |
| --: | ---- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
|   1 | 状态机  | `BLOCKED` 从哪些阶段可以进入、如何恢复回主路径，计划中没有定义转换条件。                                                                              | 补一张 `BLOCKED` 的进入/退出条件行，或明确说明：“阶段 1 只声明语义，不实现 `BLOCKED` 转换”。          |
|   2 | 任务状态 | 任务只有 `pending` / `in_progress` / `completed`，但 `worker.blocker` 消息发出后任务处于什么状态？如果仍是 `in_progress`，如何区分“正在执行”和“已阻塞等待输入”？ | 考虑在 `execution-tasks.json` 中加一个 `blocked_reason` 字段；不扩充状态枚举，但让查询方能区分。 |
|   3 | 通讯链路 | `worker.progress` 的写入频率和格式没有约定。如果子 Agent 高频写入，`session` 目录会膨胀。                                                         | 建议约定：`progress` 只追加到 `events.jsonl`，不单独落文件；或约定最大条目数 / 覆盖策略。           |
|   4 | 验收   | 里程碑 4 说“用一个最小项目清单跑通链路”，但没有给出这个最小清单的定义。                                                                                 | 建议在计划中附一个 2–3 个任务的 fixture manifest，作为验收用的 golden path。               |
|   5 | 模块映射 | 第六节列了 6 个模块，但没有提到 `models.py`。`models.py` 是否需要在阶段 1 中扩展字段，比如 `blocked_reason`、消息类型枚举？                                  | 补充说明 `models.py` 在阶段 1 的变更范围。                                         |
|   6 | 文档链接 | `docs/README.md` 和 `README.md` 中的链接风格不一致：有的用绝对路径 `/C:/Users/84025/Desktop/ManiMind/...`，有的用相对路径 `./阶段1计划.md`。          | 统一为相对路径，避免换机器后链接失效。                                                   |
随后利用codex对这些问题进行修改，再次进行评审：

|#|风险|严重度|可能性|建议动作|
|--:|---|---|---|---|
|1|六类消息语义只在文档中，代码无对应实现。|高|确定|阶段 1 验收前必须至少实现消息类型枚举，并在 `events.jsonl` 中区分事件类型。|
|2|`POST_PRODUCE` / `PACKAGE` 阶段与任务 DAG 不对称。|中|确定|拆分 `post_produce.package` 为两个任务，或合并两个阶段为一个阶段。|
|3|`derive_current_stage()` 硬编码任务 ID。|中|低，短期内不会改 ID。|在计划中约定任务 ID 命名规范，或改为基于任务元数据推导，例如使用 `stage` 标签。|
|4|`manim-worker-pov/` 孤立无文档。|低|确定|在 `README.md` 或计划中声明定位，或移入 `experiments/`。|
|5|验收缺少 fixture manifest。|中|确定|提供一个 2–3 任务的最小 manifest，作为 golden path 验收用例。|
|6|文档链接使用绝对路径，例如 `/C:/Users/84025/Desktop/...`。|低|确定|统一为相对路径。|

在这一轮claude的评审已经聚焦于非常精细的问题了，比如说prompt的设计，文档的定位等。正常开发流程中评审应该需要三轮，但是这里第二轮已经基本没有P0问题，我直接让codex更新完文档之后就开始改代码了，最终结果如下：

阶段一已经从“文档约定”落成可执行代码，核心闭环现在是可跑通的。

已落地的关键实现：
- 状态机与任务映射正式固化：`ExecutionTask` 增加 `stage`，并把后处理拆成 `post_produce.outputs` + `package.delivery`，阶段派生改为按 `task.stage` 分组推导（[models.py](/F:/ManiMind/src/manimind/models.py)、[workflow.py](/F:/ManiMind/src/manimind/workflow.py)、[runtime.py](/F:/ManiMind/src/manimind/runtime.py)）。
- 通讯链路正式事件化：新增 `EventType`，并实现 `persist_agent_message`，支持 `worker.progress / worker.blocker / worker.result / review.decision`，统一写入项目级+会话级 `events.jsonl`，同时在任务快照回写 `blocked_reason/blocked_at/last_progress`（[runtime_store.py](/F:/ManiMind/src/manimind/runtime_store.py)）。
- 入口补齐：新增 CLI `agent-message` 命令和 API `POST /api/projects/events/message`（[main.py](/F:/ManiMind/src/manimind/main.py)、[events.py](/F:/ManiMind/backend/api/events.py)、[backend/main.py](/F:/ManiMind/backend/main.py)）。
- 文档同步：CLI/API 列表与阶段一计划已更新（[README.md](/F:/ManiMind/README.md)、[阶段1计划.md](/F:/ManiMind/docs/阶段1计划.md)、[初始化计划.md](/F:/ManiMind/docs/初始化计划.md)、[通用项目架构模板.md](/F:/ManiMind/docs/通用项目架构模板.md)）。

验证结果：
- 单元测试：`26 passed`。
- CLI 烟雾：`plan` 与 `agent-message` 已实测可执行并写入事件日志。
- API 烟雾：`/api/projects/plan` 与 `/api/projects/events/message` 实测返回 `200` 并落盘。

剩余风险（已收敛到阶段一边界内）：
- 真实渲染执行器（如 `manim-worker-pov`）还未直接对接该消息入口，当前是编排层已具备、执行器侧待接入。

后文的[[三、worker的POC实现]]和[[四、前端骨架的实现]]都是可以与这一步并行处理的