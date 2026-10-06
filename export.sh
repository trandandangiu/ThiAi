#!/bin/bash
# ============================================================
# EXPORT ALL — Xuất source code tách riêng BE và FE
# Nhưng VẪN giữ đầy đủ như script cũ (root files, init-db, ...)
#
# Tạo 4 file:
#   - project_BE_<timestamp>.md     (backend/)
#   - project_BE_<timestamp>.txt    (backend/)
#   - project_FE_<timestamp>.md     (frontend/)
#   - project_FE_<timestamp>.txt    (frontend/)
#   - project_ROOT_<timestamp>.md   (root + init-db + docker)
#   - project_ROOT_<timestamp>.txt  (root + init-db + docker)
# ============================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="${PROJECT_ROOT}/exports"

mkdir -p "$OUTPUT_DIR"

# ═══════════════════════════════════════════════════════════
# CẤU HÌNH
# ═══════════════════════════════════════════════════════════
IGNORE_DIRS=(
  "node_modules" ".git" "dist" "build" ".next" ".vite"
  "coverage" ".cache" "tmp" "temp" ".idea" ".vscode"
  "uploads" "exports" ".turbo" "logs" "certs"
)

IGNORE_FILES=(
  ".DS_Store" "Thumbs.db" "package-lock.json" "yarn.lock"
  "pnpm-lock.yaml" ".env" ".env.local" ".env.production" ".env.development"
  "bun.lock"
)

INCLUDE_EXTS=(
  "js" "jsx" "ts" "tsx" "mjs" "cjs"
  "json" "css" "scss" "sass" "less"
  "html" "htm" "md" "mdx"
  "prisma" "sql" "yml" "yaml"
  "sh" "bash" "env.example" "dockerfile" "gitignore" "txt"
)

# ═══════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════
should_skip_dir() {
  for skip in "${IGNORE_DIRS[@]}"; do
    [[ "$1" == "$skip" ]] && return 0
  done
  return 1
}

should_skip_file() {
  for skip in "${IGNORE_FILES[@]}"; do
    [[ "$1" == $skip ]] && return 0
  done
  return 1
}

should_include_ext() {
  local name="$1"
  local ext="${name##*.}"
  if [[ "$name" == "$ext" ]]; then
    case "$name" in
      Dockerfile|dockerfile|Makefile|makefile|.env.example|.gitignore|.dockerignore)
        return 0 ;;
      *) return 1 ;;
    esac
  fi
  for allowed in "${INCLUDE_EXTS[@]}"; do
    [[ "$ext" == "$allowed" ]] && return 0
  done
  return 1
}

detect_lang() {
  local ext="${1##*.}"
  case "$ext" in
    js|mjs|cjs) echo "javascript" ;;
    jsx)        echo "jsx" ;;
    ts)         echo "typescript" ;;
    tsx)        echo "tsx" ;;
    json)       echo "json" ;;
    css)        echo "css" ;;
    scss)       echo "scss" ;;
    less)       echo "less" ;;
    html|htm)   echo "html" ;;
    md)         echo "markdown" ;;
    prisma)     echo "prisma" ;;
    sql)        echo "sql" ;;
    yml|yaml)   echo "yaml" ;;
    sh|bash)    echo "bash" ;;
    env)        echo "ini" ;;
    *)          echo "text" ;;
  esac
}

# ═══════════════════════════════════════════════════════════
# HÀM XUẤT CÂY THƯ MỤC
# ═══════════════════════════════════════════════════════════
print_tree_to() {
  local target="$1"
  local dir="$2"
  local prefix="$3"
  local items=()
  while IFS= read -r -d '' item; do
    items+=("$item")
  done < <(find "$dir" -maxdepth 1 -mindepth 1 -print0 | sort -z)

  local count=${#items[@]}
  local i=0
  for item in "${items[@]}"; do
    i=$((i + 1))
    local name=$(basename "$item")
    local is_last=0
    [[ $i -eq $count ]] && is_last=1
    local connector="├── "
    [[ $is_last -eq 1 ]] && connector="└── "

    if [[ -d "$item" ]]; then
      should_skip_dir "$name" && continue
      echo "${prefix}${connector}${name}/" >> "$target"
      local new_prefix="${prefix}"
      [[ $is_last -eq 0 ]] && new_prefix="${prefix}│   " || new_prefix="${prefix}    "
      print_tree_to "$target" "$item" "$new_prefix"
    else
      should_skip_file "$name" && continue
      echo "${prefix}${connector}${name}" >> "$target"
    fi
  done
}

# ═══════════════════════════════════════════════════════════
# HÀM XUẤT 1 FILE
# ═══════════════════════════════════════════════════════════
write_file_to() {
  local file="$1"
  local md_file="$2"
  local txt_file="$3"
  local rel_path="${file#$PROJECT_ROOT/}"
  local lang=$(detect_lang "$file")

  # MD
  {
    echo "### FILE: ${rel_path}"
    echo ""
    echo "\`\`\`${lang}"
    cat "$file" 2>/dev/null || echo "[Không đọc được file]"
    echo "\`\`\`"
    echo ""
    echo "---"
    echo ""
  } >> "$md_file"

  # TXT
  {
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "FILE: ${rel_path}"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    cat "$file" 2>/dev/null || echo "[Không đọc được file]"
    echo ""
    echo ""
  } >> "$txt_file"
}

# ═══════════════════════════════════════════════════════════
# BIẾN ĐẾM TOÀN CỤC
# ═══════════════════════════════════════════════════════════
FILE_COUNT_BE=0
FILE_COUNT_FE=0
FILE_COUNT_ROOT=0

# ═══════════════════════════════════════════════════════════
# XUẤT 1 THƯ MỤC CON (BE hoặc FE)
# ═══════════════════════════════════════════════════════════
export_subdir() {
  local sub_dir="$1"
  local md_file="$2"
  local txt_file="$3"
  local counter_name="$4"     # "FILE_COUNT_BE" or "FILE_COUNT_FE"

  while IFS= read -r -d '' item; do
    local name=$(basename "$item")
    if [[ -d "$item" ]]; then
      should_skip_dir "$name" && continue
      export_subdir "$item" "$md_file" "$txt_file" "$counter_name"
    else
      should_skip_file "$name" && continue
      if should_include_ext "$name"; then
        eval "$counter_name=\$((\$counter_name + 1))"
        local counter=$(eval "echo \$$counter_name")
        echo "  📄 [$counter] ${item#$PROJECT_ROOT/}"
        write_file_to "$item" "$md_file" "$txt_file"
      fi
    fi
  done < <(find "$sub_dir" -maxdepth 1 -mindepth 1 -print0 | sort -z)
}

# ═══════════════════════════════════════════════════════════
# XUẤT ROOT FILES (không thuộc BE/FE)
# ═══════════════════════════════════════════════════════════
export_root_files() {
  local md_file="$1"
  local txt_file="$2"

  while IFS= read -r -d '' item; do
    local name=$(basename "$item")
    # Bỏ qua backend/ và frontend/ (đã xuất riêng)
    [[ "$name" == "backend" || "$name" == "frontend" ]] && continue
    if [[ -d "$item" ]]; then
      should_skip_dir "$name" && continue
      # Đệ quy cho init-db/, nginx/, scripts/... (nếu có)
      while IFS= read -r -d '' sub; do
        local subname=$(basename "$sub")
        should_skip_file "$subname" && continue
        if should_include_ext "$subname"; then
          FILE_COUNT_ROOT=$((FILE_COUNT_ROOT + 1))
          echo "  📄 [$FILE_COUNT_ROOT] ${sub#$PROJECT_ROOT/}"
          write_file_to "$sub" "$md_file" "$txt_file"
        fi
      done < <(find "$item" -type f -print0 | sort -z)
    else
      should_skip_file "$name" && continue
      if should_include_ext "$name"; then
        FILE_COUNT_ROOT=$((FILE_COUNT_ROOT + 1))
        echo "  📄 [$FILE_COUNT_ROOT] ${item#$PROJECT_ROOT/}"
        write_file_to "$item" "$md_file" "$txt_file"
      fi
    fi
  done < <(find "$PROJECT_ROOT" -maxdepth 1 -mindepth 1 -print0 | sort -z)
}

# ═══════════════════════════════════════════════════════════
# XUẤT 1 PHẦN (BE / FE / ROOT)
# ═══════════════════════════════════════════════════════════
export_section() {
  local section="$1"       # "backend" | "frontend" | "root"
  local label="$2"         # "BE" | "FE" | "ROOT"
  local title="$3"         # Tên hiển thị

  local MD_FILE="${OUTPUT_DIR}/project_${label}_${TIMESTAMP}.md"
  local TXT_FILE="${OUTPUT_DIR}/project_${label}_${TIMESTAMP}.txt"

  echo "═══════════════════════════════════════════════════════════"
  echo "  📦 EXPORT ${label} — ${title}"
  echo "═══════════════════════════════════════════════════════════"

  # ═══ MD HEADER ═══
  {
    echo "# DỰ ÁN: VKS-QLCV-v3 — ${label}"
    echo ""
    echo "**Ngày xuất:** $(date +'%Y-%m-%d %H:%M:%S')"
    echo "**Phần:** ${title}"
    echo ""
    echo "---"
    echo ""
    echo "## 1. CẤU TRÚC THƯ MỤC"
    echo ""
    echo '```'
    echo "."
  } > "$MD_FILE"

  if [[ "$section" == "root" ]]; then
    # In cây của toàn bộ project (bỏ backend, frontend)
    print_tree_to "$MD_FILE" "$PROJECT_ROOT" ""
  else
    print_tree_to "$MD_FILE" "${PROJECT_ROOT}/${section}" ""
  fi

  {
    echo '```'
    echo ""
    echo "---"
    echo ""
    echo "## 2. NỘI DUNG SOURCE CODE"
    echo ""
  } >> "$MD_FILE"

  # ═══ TXT HEADER ═══
  {
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  DỰ ÁN: VKS-QLCV-v3 — ${label}"
    echo "║  Xuất ngày: $(date +'%Y-%m-%d %H:%M:%S')"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  CẤU TRÚC THƯ MỤC"
    echo "════════════════════════════════════════════════════════════"
  } > "$TXT_FILE"

  if [[ "$section" == "root" ]]; then
    print_tree_to "$TXT_FILE" "$PROJECT_ROOT" ""
  else
    print_tree_to "$TXT_FILE" "${PROJECT_ROOT}/${section}" ""
  fi

  {
    echo ""
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  TOÀN BỘ SOURCE CODE"
    echo "════════════════════════════════════════════════════════════"
    echo ""
  } >> "$TXT_FILE"

  # ═══ EXPORT ═══
  echo ""
  echo "Đang export file..."
  echo ""

  if [[ "$section" == "root" ]]; then
    export_root_files "$MD_FILE" "$TXT_FILE"
  else
    export_subdir "${PROJECT_ROOT}/${section}" "$MD_FILE" "$TXT_FILE" "FILE_COUNT_${label}"
  fi

  # ═══ XÁC ĐỊNH COUNTER CUỐI ═══
  local FINAL_COUNT
  if [[ "$section" == "root" ]]; then
    FINAL_COUNT=$FILE_COUNT_ROOT
  else
    FINAL_COUNT=$(eval "echo \$FILE_COUNT_${label}")
  fi

  # ═══ MD FOOTER ═══
  {
    echo "---"
    echo ""
    echo "## TỔNG KẾT"
    echo ""
    echo "- **Tổng số file đã export:** ${FINAL_COUNT}"
    echo "- **Ngày xuất:** $(date +'%Y-%m-%d %H:%M:%S')"
  } >> "$MD_FILE"

  # ═══ TXT FOOTER ═══
  {
    echo "════════════════════════════════════════════════════════════"
    echo "  TỔNG KẾT — ${label}"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "Tổng số file đã export: ${FINAL_COUNT}"
    echo "Ngày xuất: $(date +'%Y-%m-%d %H:%M:%S')"
  } >> "$TXT_FILE"

  echo ""
  echo "  ✅ ${label} HOÀN TẤT"
  echo "  📄 MD:  $MD_FILE"
  echo "         Dòng: $(wc -l < "$MD_FILE")  |  Size: $(du -h "$MD_FILE" | cut -f1)"
  echo "  📄 TXT: $TXT_FILE"
  echo "         Dòng: $(wc -l < "$TXT_FILE")  |  Size: $(du -h "$TXT_FILE" | cut -f1)"
  echo "  📊 Tổng file: ${FINAL_COUNT}"
  echo ""
}

# ═══════════════════════════════════════════════════════════
# CHẠY
# ═══════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📦 EXPORT PROJECT — VKS-QLCV-v3 (TÁCH BE / FE / ROOT)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. Backend (bao gồm cả backend/.env.example nếu có)
export_section "backend"  "BE"   "BACKEND"

# 2. Frontend
export_section "frontend" "FE"   "FRONTEND"

# 3. Root files (docker-compose, README, init-db, nginx, scripts, v.v...)
export_section "root"     "ROOT" "ROOT FILES & CONFIG"

# ═══════════════════════════════════════════════════════════
# KẾT QUẢ
# ═══════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ EXPORT HOÀN TẤT"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📁 Thư mục: $OUTPUT_DIR"
echo ""
ls -lh "$OUTPUT_DIR"/project_*_${TIMESTAMP}.* 2>/dev/null || true
echo ""
echo "═══════════════════════════════════════════════════════════"