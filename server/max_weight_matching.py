import sys
import wsgiref
from wsgiref.util import setup_testing_defaults
from wsgiref.simple_server import make_server

import networkx as nx
import json

def max_weight_matching(env, start_response):
  setup_testing_defaults(env)

  # CORS
  if env['REQUEST_METHOD'] == 'OPTIONS':
    start_response('200 OK', [
      ('Accept', 'application/json'),
      ('Access-Control-Allow-Origin', '*'),
      ('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'),
      ('Content-Type', 'text/plain')
      ])
    return []

  if env['REQUEST_METHOD'] == 'POST':
    try:
      request_body_size = int(env.get('CONTENT_LENGTH', 0))
    except (ValueError):
      request_body_size = 0
    request_body = env['wsgi.input'].read(request_body_size)
    edges = json.loads(request_body.decode('utf-8'))
    edges = [(e[0], e[1], e[2]) for e in edges]
    g = nx.Graph()
    g.add_weighted_edges_from(edges)
    parings = nx.max_weight_matching(g, True)
    paired = set()
    out_pairings = []
    for p1, p2 in parings:
      if p1 not in paired and p2 not in paired:
        paired.add(p1)
        paired.add(p2)
        out_pairings.append([p1, p2])
    start_response('200 OK', [('Access-Control-Allow-Origin', '*'), ('Content-type', 'text/html')])
    return [json.dumps(out_pairings).encode('utf-8')]

  start_response('200 OK', [('Access-Control-Allow-Origin', '*'), ('Content-type', 'text/html')])
  return [json.dumps([]).encode('utf-8')]

def main():
  httpd = make_server('0.0.0.0', 8156, max_weight_matching)
  print("Serving on port 8156...")
  sys.stdout.flush()
  httpd.serve_forever()

if __name__ == "__main__":
  main()
