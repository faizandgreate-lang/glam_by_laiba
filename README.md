Glam by Laiba - Flask Project (READY)
====================================

What's included:
- Single-page main site + Academy page
- Photo & Video uploads (thumbnail + play), stored in static/uploads
- Hidden admin button (bottom-right). Password: 1234
- SQLite DB in instance/data.db (auto-created)
- Run on port 5001

Quick run (mac/linux):
1) python3 -m venv venv
2) source venv/bin/activate
3) pip install -r requirements.txt
4) python app.py
5) Open: http://127.0.0.1:5001

Deploy notes:
- Push to GitHub and deploy on Render (free) (I can provide exact Render steps)
- Uploaded media saved to static/uploads (persist on Render if you attach persistent storage or use external storage)
