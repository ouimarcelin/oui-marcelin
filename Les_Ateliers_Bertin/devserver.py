#!/usr/bin/env python3
"""Serveur statique de développement : sert le dossier du site SANS cache navigateur.
   Évite que le navigateur garde d'anciens .js / .css pendant les tests
   (cause classique de « mes modifications n'apparaissent pas »).

   Usage : python3 devserver.py [port]        (port par défaut : 4599)
   Le dossier servi est toujours celui qui contient ce fichier.
"""
import os
import sys
import http.server
import socketserver

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4599
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_header(self, key, value):
        if key.lower() == "last-modified":   # coupe les réponses 304
            return
        super().send_header(key, value)


class Server(socketserver.TCPServer):
    allow_reuse_address = True


with Server(("", PORT), NoCacheHandler) as httpd:
    print(f"Dev server (no-cache) — {os.getcwd()} → http://localhost:{PORT}")
    httpd.serve_forever()
