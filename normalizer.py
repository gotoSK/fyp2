from collections import defaultdict
import networkx as nx
from tarjan import find_strongly_connected_components
import copy


class TransactionGraph:
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_transaction(self, buyer, seller, qty, rate):
        """Add transactions to the graph, summing up if an edge already exists."""
        if self.graph.has_edge(buyer, seller):
            self.graph[buyer][seller]['qty'] += qty
        else:
            self.graph.add_edge(buyer, seller, qty=qty, rate=rate)

    def normalize(self):
        """Normalize the graph by removing reciprocal transactions within SCCs."""

        # Convert the graph to a format suitable for Tarjan's algorithm
        graph_dict = defaultdict(list)
        for u, v in self.graph.edges():
            graph_dict[u].append(v)

        # Use a static copy to avoid dictionary size changes during iteration
        static_graph_dict = copy.deepcopy(graph_dict)

        # Find SCCs using Tarjan's algorithm
        sccs = find_strongly_connected_components(static_graph_dict)

        # Normalize edges within each SCC
        for scc in sccs:
            to_remove = []
            to_add = []

            for u in scc:
                for v in scc:
                    if u != v and self.graph.has_edge(u, v) and self.graph.has_edge(v, u):
                        qty_uv = self.graph[u][v]['qty']
                        qty_vu = self.graph[v][u]['qty']
                        net_qty = qty_uv - qty_vu

                        if net_qty > 0:
                            to_add.append((u, v, net_qty))
                        elif net_qty < 0:
                            to_add.append((v, u, -net_qty))

                        to_remove.append((u, v))
                        to_remove.append((v, u))

            # Remove reciprocal edges
            for u, v in to_remove:
                if self.graph.has_edge(u, v):
                    self.graph.remove_edge(u, v)

            # Add normalized edges
            for u, v, qty in to_add:
                self.graph.add_edge(u, v, qty=qty)

        # Remove self-loops explicitly
        self_loops = [(u, v) for u, v in self.graph.edges() if u == v]
        self.graph.remove_edges_from(self_loops)

    def get_normalized_graph(self):
        """Return the normalized graph as a list of edges with source, target, qty, and rate."""
        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({"source": u, "target": v,
                         "qty": data['qty'], "rate": data.get('rate', 0)})
        return edges
