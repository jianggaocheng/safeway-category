# 自动扫描指南

## 📋 方案对比

### 方案 1：自动循环触发 (auto-scan-loop.yml)
**优点：**
- ✅ 无需等待，完成一批立即开始下一批
- ✅ 扫描速度最快

**缺点：**
- ⚠️ 可能触发 GitHub 的反滥用机制（链式触发限制）
- ⚠️ 如果某一批失败，后续批次不会自动运行
- ⚠️ 需要手动监控

**适用场景：**
- 一次性快速扫描
- 需要密切监控的情况

---

### 方案 2：定时自动扫描 (scheduled-scan.yml) ⭐ **推荐**
**优点：**
- ✅ 更稳定，不会被 GitHub 限制
- ✅ 自动保存和恢复进度
- ✅ 每 6 小时自动运行，无需人工干预
- ✅ 失败后下次会自动重试
- ✅ 可以随时查看总体进度

**缺点：**
- ⏳ 需要更长时间完成全部扫描（每批次间隔 6 小时）

**适用场景：**
- 长期运行，无人值守
- 稳定可靠的后台扫描

---

## 🚀 使用方法

### 方案 1：自动循环触发

1. 在 GitHub 仓库页面，点击 **Actions** 标签
2. 选择 **Auto Scan Loop** workflow
3. 点击 **Run workflow**
4. 设置参数：
   - `start_from`: 留空（从头开始）或指定起始 hex
   - `batch_size`: `03000000` (每批处理 5000 万个 ID)
   - `concurrency`: `50` (并发数)
   - `auto_continue`: `true` (自动继续)
5. 点击 **Run workflow** 开始

**监控：**
- 在 Actions 页面查看运行状态
- 每个批次完成后会自动触发下一批
- 如果某批失败，需要手动重新触发

---

### 方案 2：定时自动扫描 ⭐

#### 启动方式 1：手动首次启动
1. 在 GitHub 仓库页面，点击 **Actions** 标签
2. 选择 **Scheduled Auto Scan** workflow
3. 点击 **Run workflow**
4. 设置参数：
   - `reset_progress`: `false` (继续之前的进度) 或 `true` (从头开始)
   - `batch_size`: `03000000`
   - `concurrency`: `50`
5. 点击 **Run workflow**

#### 启动方式 2：自动定时运行
- Workflow 会在每天 0:00, 6:00, 12:00, 18:00 UTC 自动运行
- 无需任何手动操作
- 自动从上次结束的位置继续

**优势：**
- ✅ 自动保存进度到 artifact
- ✅ 每次运行自动加载上次进度
- ✅ 失败后下次会自动重试
- ✅ 完成所有范围后自动停止

---

## 📊 进度查看

### 查看当前进度
1. 进入最近一次运行的 workflow
2. 查看 **Summary** 页面
3. 可以看到：
   - 当前批次范围
   - 总体进度百分比
   - 找到的 widgets 数量
   - 下一批次起始位置

### 下载结果
1. 在 workflow 运行页面，滚动到底部
2. 在 **Artifacts** 部分可以下载：
   - `batch-XXXXXXXX-to-YYYYYYYY`: 每个批次的结果
   - `scan-progress`: 进度文件（方案 2）
   - `successful-widgets-list`: 找到的所有 widgets（合并后）

---

## 🔢 完整扫描预估

**范围：** 00000000 到 ffffffff = 4,294,967,296 个 ID

**方案 1（自动循环）：**
- 每批次：50,331,648 个 ID (03000000)
- 总批次数：约 85 批
- 每批耗时：约 5.8 小时
- **预计总时间：约 20 天**（连续运行）

**方案 2（定时触发）：**
- 每批次：50,331,648 个 ID (03000000)
- 总批次数：约 85 批
- 每批耗时：约 5.8 小时
- 批次间隔：6 小时（其中 5.8 小时运行 + 0.2 小时空闲）
- **预计总时间：约 21 天**

---

## 🛠️ 调整参数

### 增加扫描速度
```yaml
batch_size: '05000000'  # 增加批次大小
concurrency: '100'       # 增加并发数（注意 API 限制）
```

### 降低 API 压力
```yaml
batch_size: '01000000'  # 减小批次大小
concurrency: '30'        # 降低并发数
```

---

## ⚠️ 注意事项

1. **GitHub Actions 限制：**
   - 免费账户：每月 2000 分钟
   - 完整扫描需要约 30,000 分钟（500 小时）
   - 建议使用付费账户或分多个月完成

2. **API 限制：**
   - 如果遇到大量 429 错误，降低 `concurrency`
   - 监控日志中的错误率

3. **存储空间：**
   - Artifacts 会占用存储空间
   - 定期下载并删除旧的 artifacts

4. **手动干预：**
   - 可以随时停止 workflow
   - 方案 2 会在下次运行时自动恢复进度

---

## 🎯 推荐配置

**初次使用：**
```yaml
workflow: scheduled-scan.yml
reset_progress: true
batch_size: 03000000
concurrency: 50
```

**恢复扫描：**
```yaml
workflow: scheduled-scan.yml
reset_progress: false
batch_size: 03000000
concurrency: 50
```

**快速测试：**
```yaml
workflow: auto-scan-loop.yml
start_from: 00000000
batch_size: 00100000  # 只扫描一小部分
concurrency: 50
auto_continue: false
```

---

## 📞 故障排查

### 问题：进度丢失
**解决：**
- 检查 artifacts 中的 `scan-progress`
- 如果丢失，手动指定 `start_from`

### 问题：扫描速度慢
**解决：**
- 增加 `concurrency`
- 检查网络连接
- 查看是否有大量失败请求

### 问题：workflow 没有自动触发
**解决：**
- 检查 scheduled-scan.yml 是否在 master 分支
- 确保 workflow 已启用
- 手动触发一次以激活定时任务

---

## 📈 监控建议

1. **每天检查一次：**
   - 查看最新的 workflow 运行状态
   - 确认进度正常推进

2. **每周下载一次：**
   - 下载所有新的 batch artifacts
   - 备份到本地存储

3. **完成后：**
   - 下载所有结果
   - 禁用定时触发（如果不再需要）

