# Safeway Category Data Fetcher

使用 GitHub Actions 进行分布式抓取 Safeway category 数据。

## 功能特点

- ✅ 支持自定义起始和结束 hash 范围
- ✅ 自动分割成多个并行任务
- ✅ 可配置每个任务的并发数
- ✅ 自动汇总所有结果
- ✅ 失败重试机制
- ✅ **智能时间管理** - 自动在接近 6 小时时优雅停止
- ✅ **实时进度追踪** - 每30秒保存进度，显示 ETA 和处理速度
- ✅ **详细统计报告** - 自动生成运行摘要和成功 widget 列表

## 本地运行

### 安装依赖

```bash
npm install
```

### 运行脚本

```bash
# 基本用法
node fetch-category.js [startHex] [endHex] [concurrency]

# 示例：从 00000000 到 00000fff，并发数为 50
node fetch-category.js 00000000 00000fff 50
```

### 参数说明

- `startHex`: 起始 hash（十六进制，默认：00000000）
- `endHex`: 结束 hash（十六进制，默认：ffffffff）
- `concurrency`: 并发请求数（默认：50）

## 使用 GitHub Actions

### 触发方式

1. 进入 GitHub 仓库的 **Actions** 标签页
2. 选择 **Fetch Category Data** workflow
3. 点击 **Run workflow** 按钮
4. 填写参数：
   - **起始 Hash**: 例如 `00000000`
   - **结束 Hash**: 例如 `00000fff`
   - **分割成几个并行任务**: 例如 `10`（将范围分成10个子任务）
   - **每个任务的并发数**: 例如 `50`

### 参数配置建议

#### 快速测试
```
起始 Hash: 00000000
结束 Hash: 00000fff
分割任务数: 4
并发数: 20
```

#### 中等范围
```
起始 Hash: 00000000
结束 Hash: 0000ffff
分割任务数: 10
并发数: 50
```

#### 大范围扫描
```
起始 Hash: 00000000
结束 Hash: 00ffffff
分割任务数: 20
并发数: 50
```

#### 全量扫描（需要很长时间）
```
起始 Hash: 00000000
结束 Hash: ffffffff
分割任务数: 100
并发数: 50
```

### 工作流程

1. **calculate-ranges**: 根据输入参数计算每个并行任务的范围
2. **fetch-data**: 并行执行多个抓取任务（最多同时10个）
   - 每个任务最多运行 5.8 小时（留出 buffer）
   - 实时显示进度：当前位置、找到的数量、处理速度、ETA
   - 每30秒自动保存进度到 `progress.json`
   - 接近时间限制时自动优雅停止
   - 生成详细的 `summary.txt` 统计报告
3. **merge-results**: 汇总所有任务的结果
   - 下载所有子任务的结果
   - 提取所有成功的 widget ID
   - 生成完整的统计报告
   - 打包成压缩文件

### 实时监控

运行时会显示实时进度：

```
📍 0000a5b3 | ✅ Found: 12 | 📊 Processed: 42,419 (25.34%) | ⚡ 5.2 req/s | ⏳ ETA: 4.2h | 🔄 Active: 50
```

指标说明：
- **📍 当前位置**: 正在处理的 hash 值
- **✅ Found**: 成功找到的 widget 数量
- **📊 Processed**: 已处理的请求数量和进度百分比
- **⚡ 速率**: 每秒处理的请求数
- **⏳ ETA**: 预计剩余时间
- **🔄 Active**: 当前活跃的并发请求数

### 下载结果

1. 进入 workflow 运行详情页
2. 在页面底部找到 **Artifacts** 部分
3. 下载：
   - **`category-data-complete`**: 所有任务汇总的完整 JSON 数据（tar.gz 格式）
   - **`successful-widgets-list`**: 所有成功的 widget ID 列表（txt 格式）
   - **`category-data-part-X`**: 单个任务的结果（可选，用于调试）

### 查看运行报告

每个任务完成后，在 GitHub Actions 的 Summary 页面可以看到：

**单个任务摘要：**
- 处理范围和进度
- 找到的 widget 数量和列表
- 详细的统计信息（处理速度、时间等）

**最终汇总报告：**
- 所有任务的总计数据
- 完整的成功 widget 列表
- 数据文件大小统计

## 输出格式

扫描完成后，会在 `output/` 目录生成以下文件：

### JSON 数据文件
每个有效的 category 会保存为一个 JSON 文件：

```
output/
  ├── GR-C-Categ-00000001.json
  ├── GR-C-Categ-00000042.json
  ├── ...
  ├── progress.json          # 实时进度信息
  └── summary.txt            # 最终统计摘要
```

### progress.json 格式

实时记录扫描进度（每30秒更新）：

```json
{
  "startHex": "00000000",
  "endHex": "00ffffff",
  "lastProcessedHex": "0000a5b3",
  "processedCount": 42419,
  "foundCount": 12,
  "successfulWidgets": [
    "GR-C-Categ-00000123",
    "GR-C-Categ-00000456",
    "..."
  ],
  "startTime": "2025-12-05T10:30:00.000Z",
  "lastUpdateTime": "2025-12-05T12:45:30.000Z",
  "elapsedSeconds": 8130,
  "avgRate": "5.22"
}
```

### summary.txt 示例

```
╔════════════════════════════════════════════════════════╗
║           SAFEWAY CATEGORY SCAN SUMMARY                ║
╚════════════════════════════════════════════════════════╝

📊 Scan Statistics:
   Start Range:        00000000
   End Range:          00ffffff
   Last Processed:     00a5b3c2
   Stop Reason:        time limit reached

⏱️  Time Statistics:
   Started:            2025-12-05T10:30:00.000Z
   Duration:           5h 48m 30s
   Avg Rate:           5.22 req/s

✅ Results:
   Total Processed:    108,930
   Widgets Found:      23
   Success Rate:       0.0211%

🎯 Found Widgets:
   - GR-C-Categ-00000123
   - GR-C-Categ-00000456
   - GR-C-Categ-f210e5cd
   ...
```

## 注意事项

1. **速率限制**: 建议并发数不超过 50，避免被目标服务器限制
2. **运行时间**: 
   - GitHub Actions 单个 job 最多运行 6 小时
   - 脚本会在 5.8 小时时自动优雅停止，留出 buffer
   - 可通过 `progress.json` 查看停止时的位置，继续后续扫描
3. **存储限制**: 
   - Artifacts 保留时间：单个任务30天，汇总结果90天
   - 注意定期下载和清理旧数据
4. **网络问题**: 
   - 设置了 `fail-fast: false`，一个任务失败不影响其他任务
   - 每个任务都会尝试完成并保存已获取的数据
5. **进度追踪**:
   - 每30秒自动保存 `progress.json`
   - 如果任务中断，可以从 `lastProcessedHex` 继续

## 进阶用法

### 恢复中断的扫描

如果某次扫描在时间限制前中断：

1. 下载对应任务的 artifact
2. 解压后查看 `output/progress.json`
3. 找到 `lastProcessedHex` 值
4. 重新运行，设置起始 Hash 为该值的下一个（例如：`0000a5b3` → `0000a5b4`）

**示例：**
```json
// progress.json 显示
{
  "lastProcessedHex": "0000a5b3",
  ...
}

// 重新运行时设置
起始 Hash: 0000a5b4
结束 Hash: 00ffffff  // 原来的结束值
```

### 如何查看实时进展

#### 方法1：GitHub Actions 实时日志

1. **进入正在运行的 workflow**
   - 在 GitHub 仓库，点击 `Actions` 标签
   - 选择正在运行的 workflow

2. **查看任务日志**
   - 点击任意 `fetch-data (X)` 任务
   - 展开 "Fetch category data" 步骤
   - 查看实时输出：
     ```
     [2025-12-05T10:30:15.000Z] Progress: 0000a5b3 | Found: 12 | Processed: 42,419 (25.34%) | Rate: 5.2 req/s | ETA: 4.2h
     ```

3. **查看定期进度更新**（每5分钟）
   - 日志中会显示格式化的进度报告：
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

#### 方法2：查看 Job Summary

1. **任务完成后查看总结**
   - 每个 `fetch-data` 任务完成后，点击该任务
   - 顶部会显示 "Summary" 标签页
   - 查看详细的统计表格和进度信息

2. **查看最终汇总报告**
   - 等待 `merge-results` 任务完成
   - 查看 Summary，包含：
     - 📊 整体统计数据
     - ✅ 所有成功的 widget 列表
     - 📋 各任务分解情况
     - 📥 下载链接

#### 方法3：本地监控脚本

如果在本地运行：

```bash
# 监控本地运行的进度
./view-progress.sh

# 或指定输出目录
./view-progress.sh /path/to/output
```

会显示实时刷新的监控界面：

```
╔════════════════════════════════════════════════════════╗
║           SAFEWAY CATEGORY SCAN MONITOR                ║
╚════════════════════════════════════════════════════════╝

📁 Output Directory: output
🕐 Current Time: 2025-12-05 10:30:15

════════════════ CURRENT PROGRESS ════════════════
Range: 00000000 → 00ffffff
Last Processed: 0000a5b3

📊 Processed: 42,419
✅ Found: 12 widgets
⚡ Rate: 5.22 req/s
⏱️  Runtime: 2h 15m 30s

Progress: 25.34%
[████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 25.34%

⏳ ETA: 4h 15m

════════════════ FOUND WIDGETS ════════════════
 1. GR-C-Categ-00000123
 2. GR-C-Categ-00000456
 ...
```

### 监控运行状态

**检查任务状态：**
- ✅ 绿色勾号：任务成功完成
- 🔄 黄色圆圈：任务正在运行
- ❌ 红色叉号：任务失败（但设置了 continue-on-error，不影响其他任务）

**识别时间限制：**
- 日志中会显示 `⏰ Approaching time limit` 提示
- 任务会在接近 6 小时时自动优雅停止
- 查看 `summary.txt` 中的 `Stop Reason` 字段：
  - `time limit reached`: 达到时间限制
  - `range completed`: 完成全部范围

**查看进度文件：**
1. 下载任务的 artifact
2. 解压后查看 `output/progress.json` 
3. 包含完整的进度信息和成功的 widget 列表

### 自定义范围扫描

如果你发现某个特定范围有更多数据，可以针对性扫描：

```
起始 Hash: f2100000
结束 Hash: f210ffff
分割任务数: 10
并发数: 50
```

## License

MIT

