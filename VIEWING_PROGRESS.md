# 查看 GitHub Actions 运行进展指南

## 📊 三种查看方式

### 1️⃣ 实时日志（推荐用于监控运行中的任务）

**步骤：**
1. 进入 GitHub 仓库 → `Actions` 标签
2. 点击正在运行的 workflow
3. 点击任意 `fetch-data (X)` 任务
4. 展开 "Fetch category data" 步骤

**你会看到：**

- **每1000次请求**输出一行完整日志：
  ```
  [2025-12-05T10:30:15.000Z] Progress: 0000a5b3 | Found: 12 | Processed: 42,419 (25.34%) | Rate: 5.2 req/s | ETA: 4.2h
  ```

- **每5分钟**输出一次详细进度报告：
  ```
  ╔═══════════════════ PROGRESS UPDATE ═══════════════════╗
  Time: 2025-12-05 10:30:15
  ├─ Last Processed: 0000a5b3
  ├─ Total Processed: 42,419
  ├─ Widgets Found: 12
  ├─ Average Rate: 5.22 req/s
  ├─ Elapsed Time: 2h 15m 30s
  ├─ Found Widgets:
  │  • GR-C-Categ-00000123
  │  • GR-C-Categ-00000456
  │  ... and 10 more
  ╚══════════════════════════════════════════════════════╝
  ```

---

### 2️⃣ Job Summary（推荐用于查看完成的任务）

**步骤：**
1. 进入 GitHub 仓库 → `Actions` 标签
2. 点击 workflow 运行
3. 点击任意任务，查看顶部的 "Summary" 标签页

**单个任务 Summary 包含：**

| Metric | Value |
|--------|-------|
| 📍 Last Processed | `0000a5b3` |
| 📊 Total Processed | **42,419** |
| ✅ Widgets Found | **12** |
| ⚡ Average Rate | 5.22 req/s |
| ⏱️ Runtime | 2h 15m 30s |
| 🎯 Success Rate | 0.0283% |

**进度可视化：**
- Completed: **25.3%** of assigned range
- Total IDs in range: 167,503
- IDs processed: 42,419

**找到的 Widgets：**
```
 1. GR-C-Categ-00000123
 2. GR-C-Categ-00000456
 ...
```

---

### 3️⃣ 最终汇总报告（所有任务完成后）

**步骤：**
1. 等待所有任务完成
2. 进入 `merge-results` 任务
3. 查看 Summary 标签页

**最终报告包含：**

#### 📊 Overall Statistics

**Configuration:**
- Range: `00000000` → `00ffffff`
- Parallel tasks: **10**
- Concurrency: **50**

**Results:**

| Metric | Value |
|--------|-------|
| 📁 Total JSON files | **145** |
| ✅ Unique widgets | **145** |
| 📦 Archive size | **2.3 MB** |
| 💾 Data size | **3.1 MB** |
| 📊 Total processed | **1,245,678** |
| 🎯 Success rate | **0.0116%** |

#### ✅ All Successful Widgets (点击展开)
```
  1. GR-C-Categ-00000123
  2. GR-C-Categ-00000456
  ...
145. GR-C-Categ-f210e5cd
```

#### 📋 Task Breakdown

| Task | Range | Progress | Processed | Found | Runtime |
|------|-------|----------|-----------|-------|---------|
| #1 | `00000000`→`0019999a` | 100.0% | 125,000 | 15 | 5h 48m |
| #2 | `0019999b`→`00333335` | 100.0% | 124,999 | 12 | 5h 47m |
| ... | ... | ... | ... | ... | ... |

---

## 📥 下载和查看详细数据

### 下载 Artifacts

在 workflow 运行页面底部，找到 **Artifacts** 部分，下载：

1. **`category-data-complete`** - 所有 JSON 文件打包（tar.gz）
2. **`successful-widgets-list`** - widget 列表和统计（txt）
3. **`category-data-part-X`** - 单个任务的输出（调试用）

### 查看下载的数据

```bash
# 解压完整数据
tar -xzf category-data-complete.tar.gz

# 查看 widget 列表
cat all-successful-widgets.txt

# 查看详细报告
cat final-report.txt

# 查看任务统计
cat task_stats.txt

# 查看某个任务的进度
cat all-results/progress.json | jq .
```

---

## 🔍 快速判断运行状态

### 任务状态图标

- ✅ **绿色勾号** - 任务成功完成
- 🔄 **黄色圆圈** - 任务正在运行
- ⏸️ **灰色** - 任务等待中
- ❌ **红色叉号** - 任务失败（但设置了 fail-fast: false，不影响其他任务）

### 关键日志信息

- `🚀 Processing range:` - 任务开始
- `⏰ Approaching time limit` - 即将达到6小时限制
- `⏳ Waiting for remaining X requests` - 等待最后的请求完成
- `✨ Scan finished!` - 任务完成

### 进度指标说明

- **📍 当前位置** - 正在处理的 hash 值
- **✅ Found** - 成功找到的 widget 数量
- **📊 Processed** - 已处理的请求数量和进度百分比
- **⚡ 速率** - 每秒处理的请求数（req/s）
- **⏳ ETA** - 预计剩余时间（基于当前速率）
- **🔄 Active** - 当前活跃的并发请求数

---

## 💡 实用技巧

### 1. 快速查看所有任务进度

在 workflow 运行页面，可以快速浏览所有任务的状态：
- 绿色越多 = 完成越多
- 点击任意任务查看详细 Summary

### 2. 判断是否找到了 widgets

- 看任务名称旁边有没有 Summary 徽章
- 打开 Summary，查看 "Widgets Found" 数量
- 数字 > 0 表示找到了

### 3. 估算总体进度

- 查看有多少个任务标记为完成 ✅
- 总进度 ≈ (完成任务数 / 总任务数) × 100%
- 例如：10个任务中完成了7个 = 约70%完成

### 4. 中断后继续扫描

1. 下载中断任务的 artifact
2. 查看 `output/progress.json` 中的 `lastProcessedHex`
3. 重新触发 workflow，设置：
   - 起始 Hash = lastProcessedHex 的下一个
   - 结束 Hash = 原来的目标值

### 5. 本地查看下载的数据

```bash
# 查看找到了哪些 widgets
cd all-results
find . -name "GR-C-Categ-*.json" | wc -l  # 数量
find . -name "GR-C-Categ-*.json"           # 列表

# 查看某个 widget 的内容
cat output/GR-C-Categ-00000123.json | jq .

# 统计所有任务的总处理数
grep processedCount */progress.json | awk -F: '{sum+=$NF} END {print sum}'
```

---

## 🆘 常见问题

### Q: 为什么看不到实时更新？
A: 需要不断刷新页面。GitHub Actions 日志不会自动更新。

### Q: 任务失败了怎么办？
A: 设置了 `continue-on-error: true`，失败的任务不影响其他任务。检查日志查看失败原因。

### Q: 如何知道是正常完成还是超时停止？
A: 查看 Summary 中的详细报告，或下载 `summary.txt` 查看 "Stop Reason" 字段。

### Q: 多久刷新一次日志比较好？
A: 每 5-10 分钟刷新一次即可，避免频繁刷新影响 GitHub 性能。

### Q: 所有任务都显示黄色圆圈是什么意思？
A: 表示任务正在排队或运行中。GitHub Actions 有并发限制，设置了 `max-parallel: 10`。

