from collections import defaultdict

class TarjanSCC:
    def __init__(self, graph):
        self.graph = graph
        self.index = 0
        self.stack = []
        self.indices = {}
        self.low_links = {}
        self.sccs = []

    def strongconnect(self, node):
        self.indices[node] = self.index
        self.low_links[node] = self.index
        self.index += 1
        self.stack.append(node)

        for neighbor in self.graph[node]:
            if neighbor not in self.indices:
                self.strongconnect(neighbor)
                self.low_links[node] = min(self.low_links[node], self.low_links[neighbor])
            elif neighbor in self.stack:
                self.low_links[node] = min(self.low_links[node], self.indices[neighbor])

        if self.low_links[node] == self.indices[node]:
            scc = []
            while True:
                neighbor = self.stack.pop()
                scc.append(neighbor)
                if neighbor == node:
                    break
            self.sccs.append(scc)

    def find_sccs(self):
        for node in list(self.graph.keys()):  # Iterate over a static copy
            if node not in self.indices:
                self.strongconnect(node)
        return self.sccs

def find_strongly_connected_components(graph):
    """
    Find strongly connected components (SCCs) in a graph using Tarjan's algorithm.
    """
    tarjan = TarjanSCC(graph)
    return tarjan.find_sccs()