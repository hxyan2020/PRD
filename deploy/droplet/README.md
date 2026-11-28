# Droplet cron relay — VE AI助手 + 报价 AI助手 (permanent)

Keeps **every** Lark cron alive for both bots. Survives reboot. Does **not** stop unless Yan explicitly asks (`CONFIRM_STOP=yan-said-so`).

Apps stay on Vercel; the droplet is the durable scheduler/watchdog (Vercel crons alone have been going quiet).

## Install

```bash
# on droplet
sudo bash install-cron.sh
```

Or remotely:

```bash
export DROPLET_SSH_HOST=YOUR.DROPLET.IP
export DROPLET_SSH_USER=root
export DROPLET_SSH_PRIVATE_KEY="$(cat ~/.ssh/id_ed25519)"
bash remote-install.sh
```

## What gets installed

- `/opt/lark-cron-relay/` — scripts + `DO_NOT_STOP` marker
- `/etc/cron.d/lark-bot-heartbeat` — full schedule (tick, health, osc, demo, market, nudge, daily, token, weekly)
- systemd timers `lark-bot-tick.timer` + `lark-bot-health.timer` — second layer if cron dies

See [JOBS.md](./JOBS.md) for the full inventory.

## Verify

```bash
sudo tail -n 80 /var/log/lark-cron-relay/relay.log
sudo /opt/lark-cron-relay/run.sh ping
sudo /opt/lark-cron-relay/run.sh health
systemctl list-timers 'lark-bot-*'
```

After green logs, Cursor agent timers (`lark-osc-ping-5m`, `lark-cron-health-30m`) can be unsubscribed. **Droplet crons stay.**

## Stop (Yan only)

```bash
CONFIRM_STOP=yan-said-so sudo bash install-cron.sh uninstall
```

## Pause group alert-nudge only

If Yan asks to pause group nudges but keep everything else:

```bash
echo 'ENABLE_ALERT_NUDGE=0' | sudo tee -a /opt/lark-cron-relay/env
# tick still runs; alert-nudge mode no-ops
```
