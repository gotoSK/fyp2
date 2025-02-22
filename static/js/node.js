document.addEventListener("DOMContentLoaded", function () {
    const entitySelect = document.getElementById("entity-select");
    const symbolSelect = document.getElementById("symbol-select");

    // Fetch unique buyer and seller names from the server
    d3.json("/entities").then(function (entities) {
        entities.forEach(entity => {
            const option = document.createElement("option");
            option.value = entity;
            option.textContent = entity;
            entitySelect.appendChild(option);
        });
    });

    // Fetch unique symbols from the server
    d3.json("/symbols").then(function (symbols) {
        symbols.forEach(symbol => {
            const option = document.createElement("option");
            option.value = symbol;
            option.textContent = symbol;
            symbolSelect.appendChild(option);
        });
    });

    entitySelect.addEventListener("change", function () {
        const selectedEntity = this.value;
        const selectedSymbol = symbolSelect.value;
        if (selectedEntity && selectedSymbol) {
            renderGraphs(selectedEntity, selectedSymbol);
        }
    });

    symbolSelect.addEventListener("change", function () {
        const selectedEntity = entitySelect.value;
        const selectedSymbol = this.value;
        if (selectedEntity && selectedSymbol) {
            renderGraphs(selectedEntity, selectedSymbol);
        }
    });

    function renderGraphs(selectedEntity, selectedSymbol) {
        // Fetch and render the before graph
        d3.json(`/graph_data?entity=${selectedEntity}&symbol=${selectedSymbol}`).then(function (graph) {
            renderGraph("#before-graph", graph, true);
        });

        // Fetch and render the after graph
        d3.json(`/normalized_graph_data?entity=${selectedEntity}&symbol=${selectedSymbol}`).then(function (graph) {
            renderGraph("#after-graph", graph, false);
        });
    }

    function renderGraph(selector, graph, isBeforeNormalization) {
        const width = window.innerWidth / 2, height = window.innerHeight / 1.5;

        const svg = d3.select(selector)
            .attr("width", width)
            .attr("height", height);

        svg.selectAll("*").remove(); // Clear previous graph

        // Define smaller arrow markers for the graph edges
        svg.append("defs").selectAll("marker")
            .data(["end"])
            .enter().append("marker")
            .attr("id", String)
            .attr("viewBox", "0 -10 20 20")
            .attr("refX", 100)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-10L10,0L0,10L2,0Z")
            .attr("fill", "#black")
            .style("stroke-width", "3px");

        const simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id).distance(200))
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(width / 2, height / 2));

        // Handle multiple links between the same nodes
        const nodes = [];
        const links = [];
        const nodeMap = new Map();

        graph.forEach(edge => {
            if (!nodeMap.has(edge.source)) {
                nodeMap.set(edge.source, { id: edge.source });
                nodes.push(nodeMap.get(edge.source));
            }
            if (!nodeMap.has(edge.target)) {
                nodeMap.set(edge.target, { id: edge.target });
                nodes.push(nodeMap.get(edge.target));
            }
            links.push({ source: edge.source, target: edge.target, qty: edge.qty, rate: edge.rate });
        });

        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .attr("stroke-width", 4)
            .attr("marker-end", "url(#end)");

        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 20)
            .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
            .call(d3.drag()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded));

        const label = svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes)
            .enter().append("text")
            .attr("dy", ".35em")
            .attr("class", "label")
            .attr("x", 12)
            .attr("y", -12)
            .text(d => d.id);

        const weightLabel = svg.append("g")
            .attr("class", "weights")
            .selectAll("text")
            .data(links)
            .enter().append("text")
            .attr("class", "weight")
            .attr("dy", ".35em")
            .text(d => d.qty);

        simulation
            .nodes(nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(links);

        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            label
                .attr("x", d => d.x)
                .attr("y", d => d.y);

            weightLabel
                .attr("x", d => (d.source.x + d.target.x) / 2)
                .attr("y", d => (d.source.y + d.target.y) / 2);
        }

        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }
});