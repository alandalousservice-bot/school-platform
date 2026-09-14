#!/usr/bin/env bash
# نسخ احتياطي يومي لقاعدة البيانات (لا يوجد سحابة — يُخزَّن على قرص خارجي/USB).
# أضفه إلى crontab على حاسوب المدرسة، مثال (كل يوم الساعة 2 صباحًا):
#   0 2 * * * /path/to/school-platform/scripts/backup.sh >> /var/log/school-backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-/mnt/usb-backup/school-db}"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M)
mkdir -p "$BACKUP_DIR"

docker compose exec -T db pg_dump -U school school | gzip > "$BACKUP_DIR/school_${TIMESTAMP}.sql.gz"

# الاحتفاظ بآخر 30 نسخة فقط لتفادي امتلاء القرص مع الوقت
ls -1t "$BACKUP_DIR"/school_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm --

echo "تم إنشاء نسخة احتياطية: $BACKUP_DIR/school_${TIMESTAMP}.sql.gz"
