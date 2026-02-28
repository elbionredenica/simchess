# SimChess — Simultaneous Chess

A real-time multiplayer chess game where both players submit their moves **simultaneously**. No waiting — both sides reveal at the same time, creating a uniquely chaotic and strategic experience.

**Live site:** [simchess.tech](https://simchess.tech)

---

## Features

- Simultaneous move submission with a countdown timer
- Invite friends via shareable game URL (`/join/<game_id>`)
- Chess clocks per player
- Interactive walkthrough modal for new players
- Real-time updates via WebSocket (Flask-SocketIO + eventlet)

---

## Local Development

### Prerequisites
- Python 3.9+
- pip

### Setup

```bash
git clone https://github.com/your-username/simchess.git
cd simchess
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Run

```bash
flask run
```

or

```bash
python app.py
```

Open `http://localhost:5000` in two browser tabs to test multiplayer locally.

---

## Project Structure

```
app.py              # App factory + SocketIO init
routes.py           # HTTP routes (/, /api/create_game, /api/resign_game, /join/<id>)
sockets.py          # SocketIO event handlers
engine/
  board.py          # SimChessBoard — pseudo-legal move override
  game.py           # SimChessGame — move logic, clocks, illegality rules
static/
  css/style.css
  js/game.js
templates/index.html
```

---

## Production Deployment (DigitalOcean)

The app runs on an Ubuntu 24.04 LTS Droplet behind nginx with HTTPS via Let's Encrypt.

### 1. Provision a Droplet

Create a Ubuntu 24.04 droplet and SSH in:

```bash
ssh root@<your-ip>
```

### 2. Install dependencies

```bash
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git
```

### 3. Clone and set up the app

```bash
cd /var/www
git clone https://github.com/your-username/simchess.git
cd simchess
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Create a systemd service

`/etc/systemd/system/simchess.service`:

```ini
[Unit]
Description=SimChess Flask-SocketIO App
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/simchess
Environment="PATH=/var/www/simchess/venv/bin"
Environment="SECRET_KEY=<your-secret-key>"
ExecStart=/var/www/simchess/venv/bin/gunicorn \
    --worker-class eventlet \
    -w 1 \
    --bind 127.0.0.1:10000 \
    "app:create_app()"
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable simchess
systemctl start simchess
```

### 5. Configure nginx

`/etc/nginx/sites-available/simchess`:

```nginx
server {
    listen 80;
    server_name simchess.tech www.simchess.tech;

    location / {
        proxy_pass http://127.0.0.1:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/simchess /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 6. Enable HTTPS with Let's Encrypt

```bash
certbot --nginx -d simchess.tech -d www.simchess.tech
```

Certbot auto-renews via a systemd timer. Verify with:

```bash
certbot renew --dry-run
```

### 7. DNS

Point an A record for `simchess.tech` (and `www`) to the Droplet's public IP.

### Useful commands

```bash
systemctl status simchess          # Check service status
journalctl -u simchess -f          # Tail logs
systemctl restart simchess         # Restart after code changes
git pull && systemctl restart simchess   # Deploy update
```


