(function() {
  'use strict';
  
  function fill(array, val) {
    for (var i = 0; i < array.length; ++i)
      array[i] = val;
  }

  function lca(match, base, p, a, b) {
    var used = new Array(match.length);
    fill(used, false);
    
    while (true) {
      a = base[a];
      used[a] = true;
      if (match[a] === -1)
        break;
      a = p[match[a]];
    }

    while (true) {
      b = base[b];
      if (used[b] === true)
        return b;
      b = p[match[b]];
    }
  }

  function markPath(match, base, blossom, p, v, b, children) {
    for (; base[v] !== b; v = p[match[v]]) {
      blossom[base[v]] = blossom[base[match[v]]] = true;
      p[v] = children;
      children = match[v];
    }
  }

  function findPath(graph, match, p, root) {
    fill(p, -1);
    var n = graph.length;
    var used = new Array(n);
    var base = new Array(n);
    for (var i = 0; i < n; ++i) {
      used[i] = false;
      base[i] = i;
    }
    used[root] = true;
    var qh = 0;
    var qt = 0;
    var q = new Array(n);
    fill(q, 0);
    q[qt++] = root;
    while (qh < qt) {
      var v = q[qh++];
      for (i = 0; i < graph[v].length; ++i) {
        var to = graph[v][i];
        if (base[v] === base[to] || match[v] === to)
          continue;
        if (to === root || match[to] !== -1 && p[match[to]] !== -1) {
          var curbase = lca(match, base, p, v, to);
          var blossom = new Array(n);
          fill(blossom, false);
          markPath(match, base, blossom, p, v, curbase, to);
          markPath(match, base, blossom, p, to, curbase, v);
          for (var j = 0; j < n; ++j) {
            if (blossom[base[j]] === true) {
              base[j] = curbase;
              if (used[j] === false) {
                used[j] = true;
                q[qt++] = j;
              }
            }
          }
        } else if (p[to] === -1) {
          p[to] = v;
          if (match[to] === -1)
            return to;
          to = match[to];
          used[to] = true;
          q[qt++] = to;
        }
      }
    }

    return -1;
  }

  function maxMatching(graph) {
    var n = graph.length;
    var match = new Array(n);
    fill(match, -1);
    var p = new Array(n);
    fill(p, 0);
    for (var i = 0; i < n; ++i) {
      if (match[i] === -1) {
        var v = findPath(graph, match, p, i);
        while (v !== -1) {
          var pv = p[v];
          var ppv = match[pv];
          match[v] = pv;
          match[pv] = v;
          v = ppv;
        }
      }
    }
    var matches = [];
    for (i = 0; i < n; ++i)
      if (match[i] !== -1)
        matches.push([i, match[i]]);
    return matches;
  }

  angular.module('edmons', [])
    .value('edmons', {
      maxMatching: maxMatching
    });
})();
