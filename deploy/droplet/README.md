# Droplet cron relay — VE AI助手 + 报价 AI助手

Both bots stay on Vercel:

| Bot | Host |
|-----|------|
| VE AI风控助手 | `https://vex-llm-proxy.vercel.app` |
| 报价 AI风控小助手 | `https://quote-ai-troubleshooting-bot.vercel.app` |

Vercel scheduled crons are unreliable for heartbeats. This package installs a **DigitalOcean droplet crontab** that quietly hits:

- `/api/lark/oscillation-alert?ping=1` every **5m** (both bots)
- `/api/lark/cron-health` every **30m** at :03/:33 (both bots)

It does **not** call `alert-nudge` or full `cron-tick` (those caused group spam).

## Install on droplet

```bash
# on the droplet
sudo bash install-cron.sh
```

Or from a machine that has SSH:

```bash
export DROPLET_SSH_HOST=YOUR.DROPLET.IP
export DROPLET_SSH_USER=root
export DROPLET_SSH_PRIVATE_KEY="$(cat ~/.ssh/id_ed25519)"
bash remote-install.sh
```

## Verify

```bash
sudo tail -n 50 /var/log/lark-cron-relay/relay.log
sudo bash /opt/lark-cron-relay/run.sh all
```

After a green `all` run, Cursor agent quiet timers (`lark-osc-ping-5m`, `lark-cron-health-30m`) can be unsubscribed.
