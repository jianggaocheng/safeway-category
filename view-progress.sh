#!/bin/bash

# 查看进度脚本 - 用于监控运行中的任务

OUTPUT_DIR="${1:-output}"

if [ ! -d "$OUTPUT_DIR" ]; then
  echo "❌ Output directory not found: $OUTPUT_DIR"
  exit 1
fi

clear

while true; do
  clear
  echo "╔════════════════════════════════════════════════════════╗"
  echo "║           SAFEWAY CATEGORY SCAN MONITOR                ║"
  echo "╚════════════════════════════════════════════════════════╝"
  echo ""
  echo "📁 Output Directory: $OUTPUT_DIR"
  echo "🕐 Current Time: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  
  # 显示进度信息
  if [ -f "$OUTPUT_DIR/progress.json" ]; then
    echo "════════════════ CURRENT PROGRESS ════════════════"
    
    LAST_HEX=$(grep -o '"lastProcessedHex":"[^"]*"' "$OUTPUT_DIR/progress.json" | cut -d'"' -f4)
    PROCESSED=$(grep -o '"processedCount":[0-9]*' "$OUTPUT_DIR/progress.json" | grep -o '[0-9]*')
    FOUND=$(grep -o '"foundCount":[0-9]*' "$OUTPUT_DIR/progress.json" | grep -o '[0-9]*')
    RATE=$(grep -o '"avgRate":"[^"]*"' "$OUTPUT_DIR/progress.json" | cut -d'"' -f4)
    ELAPSED=$(grep -o '"elapsedSeconds":[0-9]*' "$OUTPUT_DIR/progress.json" | grep -o '[0-9]*')
    START_HEX=$(grep -o '"startHex":"[^"]*"' "$OUTPUT_DIR/progress.json" | cut -d'"' -f4)
    END_HEX=$(grep -o '"endHex":"[^"]*"' "$OUTPUT_DIR/progress.json" | cut -d'"' -f4)
    
    echo "Range: $START_HEX → $END_HEX"
    echo "Last Processed: $LAST_HEX"
    echo ""
    echo "📊 Processed: $(printf "%'d" $PROCESSED)"
    echo "✅ Found: $FOUND widgets"
    echo "⚡ Rate: $RATE req/s"
    echo "⏱️  Runtime: $((ELAPSED/3600))h $((ELAPSED%3600/60))m $((ELAPSED%60))s"
    echo ""
    
    # 计算进度百分比
    if [ ! -z "$START_HEX" ] && [ ! -z "$END_HEX" ] && [ ! -z "$LAST_HEX" ]; then
      START_DEC=$((16#$START_HEX))
      END_DEC=$((16#$END_HEX))
      LAST_DEC=$((16#$LAST_HEX))
      TOTAL=$((END_DEC - START_DEC + 1))
      DONE=$((LAST_DEC - START_DEC + 1))
      PROGRESS=$(awk "BEGIN {printf \"%.2f\", ($DONE / $TOTAL) * 100}")
      
      echo "Progress: $PROGRESS%"
      
      # 简单的进度条
      BAR_LENGTH=50
      FILLED=$(awk "BEGIN {printf \"%.0f\", ($PROGRESS / 100) * $BAR_LENGTH}")
      printf "["
      for i in $(seq 1 $BAR_LENGTH); do
        if [ $i -le $FILLED ]; then
          printf "█"
        else
          printf "░"
        fi
      done
      printf "] $PROGRESS%%\n"
      echo ""
      
      # ETA
      if [ "$DONE" -gt "0" ] && [ "$RATE" != "0" ]; then
        REMAINING=$((TOTAL - DONE))
        ETA_SECONDS=$(awk "BEGIN {printf \"%.0f\", $REMAINING / $RATE}")
        echo "⏳ ETA: $((ETA_SECONDS/3600))h $((ETA_SECONDS%3600/60))m"
      fi
    fi
    
    echo ""
    echo "════════════════ FOUND WIDGETS ════════════════"
    
    if [ "$FOUND" -gt "0" ]; then
      grep -o '"GR-C-Categ-[^"]*"' "$OUTPUT_DIR/progress.json" | tr -d '"' | nl -w2 -s'. '
    else
      echo "(none yet)"
    fi
  else
    echo "⏳ Waiting for progress data..."
  fi
  
  echo ""
  echo "════════════════════════════════════════════════"
  echo "Files: $(find "$OUTPUT_DIR" -name "GR-C-Categ-*.json" 2>/dev/null | wc -l | tr -d ' ')"
  echo "Size: $(du -sh "$OUTPUT_DIR" 2>/dev/null | cut -f1)"
  echo ""
  echo "Press Ctrl+C to exit | Refreshing every 5 seconds..."
  
  sleep 5
done

