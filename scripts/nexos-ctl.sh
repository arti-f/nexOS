#!/usr/bin/env bash
# nexos-ctl — quick management tool
# Usage: nexos-ctl {status|start|stop|restart|logs-api|logs-ui|health}

CMD=${1:-status}
API_PORT=$(grep PORT= /opt/nexos/api/.env 2>/dev/null | cut -d= -f2 || echo 3001)

case "$CMD" in
  status)
    systemctl status nexos-api nexos-ui --no-pager -l
    ;;
  start)
    systemctl start nexos-api nexos-ui && echo "Started."
    ;;
  stop)
    systemctl stop nexos-api nexos-ui && echo "Stopped."
    ;;
  restart)
    systemctl restart nexos-api nexos-ui && echo "Restarted."
    ;;
  logs-api)
    journalctl -u nexos-api -f --no-pager
    ;;
  logs-ui)
    journalctl -u nexos-ui -f --no-pager
    ;;
  health)
    echo "API health:"
    curl -sf "http://127.0.0.1:${API_PORT}/health" | python3 -m json.tool 2>/dev/null \
      || echo "API not responding on port $API_PORT"
    ;;
  *)
    echo "Usage: nexos-ctl {status|start|stop|restart|logs-api|logs-ui|health}"
    exit 1
    ;;
esac
