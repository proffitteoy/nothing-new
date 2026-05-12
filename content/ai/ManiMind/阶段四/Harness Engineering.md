
**产品化不是继续堆 prompt，而是做 harness**。目前来说demo已经算是成功，也能跑出完整的视频，因此接下来重心应该转向业务逻辑优化和智能体约束上。

主要围绕这些东西：

```text
1. 可重跑
2. 可观测
3. 可定位
4. 可约束
5. 可恢复
6. 可审核
7. 可复现
```

更具体地说：

**第一，重跑工程。**  
每个阶段都要能单独重跑，而不是只能从 `run_to_review` 开始全链路重跑。比如：

```text
rerun ingest
rerun explorer
rerun planner
rerun coordinator
rerun html_worker for segment_003
rerun manim_worker repair for segment_004
rerun review
rerun finalize
```

这叫 **stage-level rerun** 或 **step-level replay**。它解决的是：某一步坏了，不要整条链路全部重来。很多 agent 系统失败不是因为模型不会做，而是缺少可观测 runtime，导致 retry 变成盲猜。

**第二，日志与 trace 工程。**  
普通日志只记录“开始/结束/报错”。产品级 harness 要记录：

```text
role_id
stage
task_id
input_context_keys
prompt_sections
model route
model output
parsed output
schema validation result
artifact files
render command
render stdout/stderr
duration
token usage
retry count
failure reason
```

这属于 **LLM observability / agent observability**。重点不是“多写点日志”，而是让你能回答：模型当时看到了什么、输出了什么、为什么进入下一步、失败发生在哪一层。现在已有 `events.jsonl` 和 `context-packets`，这是好基础，但还要把它系统化。LLM 观测工具通常强调捕获每次模型调用的请求、响应、token、延迟和错误数据，本质上就是为了避免 agent 静默失败。

**第三，模型边界工程。**  
每个角色必须有明确边界：

```text
explorer 只读，不写正式产物
planner 只规划，不写脚本
coordinator 写脚本和 handoff，不写代码
html_worker 只写 HTML
manim_worker 只写 Manim
reviewer 只出审核草案
human_reviewer 才能 approve / return
```

这就是 **role boundary / permission boundary / capability boundary**。模型不是“想干什么就干什么”，而是被 harness 限定在一个可审计的工作域里。Harness 通常包括工具、权限、运行时、记忆规则、日志、停止条件和审批路径这些模型外部控制层。

**第四，失败定位工程。**  
失败不能只显示 “failed”。要能分类：

```text
input_missing
pdf_extract_failed
llm_json_invalid
schema_validation_failed
worker_output_invalid
html_render_failed
manim_latex_error
manim_syntax_error
ffmpeg_merge_failed
audio_video_duration_mismatch
review_not_completed
missing_required_outputs
```

这叫 **failure taxonomy**。没有失败分类，系统只能“重新试一次”；有失败分类，系统才能知道该修 prompt、修代码、修依赖、修输入，还是打回人工。

**第五，schema contract 工程。**  
prompt 里要求什么字段，normalize 函数就必须保留什么字段，reviewer 就必须检查什么字段，前端就必须能展示什么字段。比如 planner 输出：

```json
{
  "semantic_type": "...",
  "cognitive_goal": "...",
  "why_this_worker": "...",
  "density_level": "...",
  "prerequisites": [...]
}
```

那 `_normalize_segment_priorities()` 就不能只保留：

```json
{
  "objective": "...",
  "primary_worker_path": "...",
  "estimated_seconds": 20
}
```

否则 prompt 工程做得再漂亮，运行时协议会把信息吃掉。这个属于 **contract engineering**，也是 harness 的核心部分。

**第六，工具与产物边界工程。**  
HTML、Manim、SVG、TTS、ffmpeg 都是工具链。产品级 harness 要知道每个工具的输入、输出、失败模式和降级方案：

```text
HTML 输出 index.html + scene.mp4
Manim 输出 scene.py + scene.mp4 + render.log
SVG 输出 scene.svg，可选转 mp4
TTS 输出 wav + duration
ffmpeg 输出 merged video
```

这不是模型能力问题，是 **tool orchestration** 问题。很多 agent 失败来自工具调用、schema drift、工具参数错误、上下文漂移等外部系统问题，而不是单次模型生成质量。

**第七，审核与回滚工程。**  
产品不能让模型自己说“我通过了”。应该是：

```text
reviewer 生成审核草案
human_reviewer approve / return
return 写入 review.return.memo
下一轮 context-pack 注入 prompt_patch
只重跑 target_roles
保留上一轮成功产物
```
