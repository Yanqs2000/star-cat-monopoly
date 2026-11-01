"""Serve archived source/HD comparisons locally with persistent HTTP connections."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import argparse
class Handler(SimpleHTTPRequestHandler):
 protocol_version='HTTP/1.1'
 def log_message(self,*args):pass
class Server(ThreadingHTTPServer):
 request_queue_size=128
 daemon_threads=True
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=64867);args=parser.parse_args()
 root=Path(__file__).resolve().parents[1]/'public'
 with Server(('127.0.0.1',args.port),partial(Handler,directory=str(root))) as server:
  print(f'Review http://127.0.0.1:{server.server_address[1]}/hd-review/non-character-18-21/',flush=True)
  server.serve_forever()
