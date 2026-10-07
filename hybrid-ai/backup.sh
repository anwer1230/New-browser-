#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups/$DATE
mkdir -p $BACKUP_DIR

# Qdrant
docker exec qdrant tar czf - /qdrant/storage > $BACKUP_DIR/qdrant.tar.gz

# Redis
docker exec redis redis-cli SAVE
docker cp redis:/data/dump.rdb $BACKUP_DIR/redis.rdb

# الكود
tar czf $BACKUP_DIR/code.tar.gz ~/hybrid-ai --exclude=venv --exclude=qdrant_data

echo "✅ Backup: $BACKUP_DIR"
