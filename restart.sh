#!/bin/bash

# Kill by port 3027
if lsof -t -i:3027 >/dev/null 2>&1; then
    sudo kill -9 $(sudo lsof -t -i:3027)
    echo "Killed process on port 3027"
fi

# Define PID file path
PID_FILE="/www/server/nodejs/vhost/pids/artlist_crawler_backend.pid"
SCRIPT_FILE="/www/server/nodejs/vhost/scripts/artlist_crawler_backend.sh"

# Check if PID file exists and kill process
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if [ ! -z "$OLD_PID" ]; then
        kill -9 $OLD_PID 2>/dev/null || echo "Process $OLD_PID already dead"
    fi
fi

# Check if process is still running
sleep 2  # Give some time for process to die
pid=$(ps aux | grep artlist_crawler_backend | grep -v grep | wc -l)
echo "Process count: ${pid}"

# If process not running, start it
if [ "${pid}" == "0" ]; then
    echo "Starting new process..."
    if [ -f "$SCRIPT_FILE" ]; then
        bash "$SCRIPT_FILE"
        echo "Started new process"
    else
        echo "Script file not found: $SCRIPT_FILE"
        exit 1
    fi
fi