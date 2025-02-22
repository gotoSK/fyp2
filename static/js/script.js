document.addEventListener('DOMContentLoaded', function() {
    
    var socket = io();
    
    // Store the last known values
    var uname = sessionStorage.getItem('uname') ? sessionStorage.getItem('uname') : null;
    let balances = sessionStorage.getItem('balances') ? JSON.parse(sessionStorage.getItem('balances')) || {} : {}; // {'asset1':xxx, 'asset2':xxx, ...}
    let collateral = sessionStorage.getItem('collateral') ? parseFloat(sessionStorage.getItem('collateral')) : 0.0;  // symbol that is being displayed
    
    var dataMat = sessionStorage.getItem('dataMat') ? JSON.parse(sessionStorage.getItem('dataMat')) || [] : [];  // [LTP, Symbol, Name, PrevClose, [chart plots]] for each stock
    
    var symbol = sessionStorage.getItem('symbol') ? sessionStorage.getItem('symbol') : null;  // symbol that is being displayed
    
    var lastSellOB = sessionStorage.getItem('lastSellOB') ? JSON.parse(sessionStorage.getItem('lastSellOB')) || [] : []; 
    var lastBuyOB = sessionStorage.getItem('lastBuyOB') ? JSON.parse(sessionStorage.getItem('lastBuyOB')) || [] : [];
    
    var lastDatabase = sessionStorage.getItem('lastDatabase') ? JSON.parse(sessionStorage.getItem('lastDatabase')) || [] : [];
    
    var placedOrders = sessionStorage.getItem('placedOrders') ? JSON.parse(sessionStorage.getItem('placedOrders')) || [] : [];
    
    var mktStatus = sessionStorage.getItem('mktStatus') ? sessionStorage.getItem('mktStatus') === "true" : true;  // True for open market status, False for closed market session
    
    var lastCheckTime = sessionStorage.getItem('lastCheckTime') ? sessionStorage.getItem('lastCheckTime') : Date.now();
    var labels = sessionStorage.getItem('labels') ? JSON.parse(sessionStorage.getItem('labels')) || [] : [];  // For x-axis labels (timestamps)
    
    var ctx = document.getElementById('priceChart').getContext('2d');  // Get the canvas context for drawing the chart


    // Listen for user_info event from Flask
    socket.on("user_info", function (data) {
        // Update username
        if (data.uname) {
            uname = data.uname;
            sessionStorage.setItem('uname', uname);
        }

        // Update user's name
        if (data.name) {
            document.getElementById("user-name").innerText = `${data.name}`;
        }
        
        // Update collateral display
        if (data.collateral) {
            collateral = data.collateral;
            sessionStorage.setItem("collateral", collateral);
            document.getElementById("collateral-display").innerText = `Collateral: NPR ${collateral.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        
        // Update balance list
        if (data.balance) {
            balances = data.balance;
            sessionStorage.setItem('balances', JSON.stringify(balances));
            let balancesList = document.getElementById("balances");
            balancesList.innerHTML = ""; // Clear previous values
    
            for (let asset in balances) {
                let listItem = document.createElement("li");
                listItem.innerText = `${asset}: ${balances[asset].toLocaleString("en-US")}`;
                balancesList.appendChild(listItem);
            }
        }
    });

    // Collateral deduction request from server for market orders
    socket.on("deduct_req", function (data) {
        socket.emit('deduct_buy', {'amt': data.amt, 'uname': data.uname});
    });


    function load_exploreTab() {
        // Get the class 'explore' element
        const exploreElement = document.querySelector('.explore');
    
        // Clear any existing rows to avoid duplication
        exploreElement.innerHTML = `
            <div class="header">
                <span>Scrip</span>
                <span>LTP</span>
                <span>% Change</span>
            </div>
        `;
    
        // Track the currently selected row
        let selectedRow = null;
    
        // Loop through the dataMat and add rows dynamically
        dataMat.forEach((row, index) => {
            const scrip = row[1];
            const ltp = row[0];
            const pC = row[3];
            change = (((ltp - pC) / pC) * 100);
            const percentChange = change > 0 ? '+' + change.toFixed(2) : change.toFixed(2);
    
            // Create a new row
            const rowElement = document.createElement('div');
            rowElement.classList.add('row');
            rowElement.setAttribute('data-scrip', scrip); // Store the scrip as a custom attribute
            rowElement.innerHTML = `
                <span>${scrip}</span>
                <span>${ltp}</span>
                <span>${percentChange}%</span>
            `;
    
            // Check if this row should be selected by default
            if (scrip === symbol) {
                rowElement.classList.add('selected');
                selectedRow = rowElement; // Set as the initially selected row
            }
    
            // Add an event listener for clicks
            rowElement.addEventListener('click', () => {
                // Remove 'selected' class from the previously selected row
                if (selectedRow) {
                    selectedRow.classList.remove('selected');
                }
    
                // Highlight the currently selected row
                rowElement.classList.add('selected');
                selectedRow = rowElement; // Update the selectedRow variable
    
                socket.emit('scrip_selected', { scrip });
    
                // Update the page
                symbol = scrip;
                sessionStorage.setItem('symbol', symbol);
                load_topbar();
    
                lastBuyOB = [];
                lastSellOB = [];
                sessionStorage.setItem('lastSellOB', JSON.stringify(lastSellOB));
                sessionStorage.setItem('lastBuyOB', JSON.stringify(lastBuyOB));
                document.getElementById('order-book-table-body').innerHTML = '';
                
                updateChart(symbol);
                load_Floorsheet();
            });
    
            // Append the row to the exploreElement
            exploreElement.appendChild(rowElement);
        });
    } load_exploreTab();    

    socket.on('stock_list', function(data) {
        dataMat.push([data.ltp, data.sym, data.scripName, data.prevClose, []]);
        
        sessionStorage.setItem('dataMat', JSON.stringify(dataMat));

        load_exploreTab();
    });

    socket.on('display_asset', function(data) {
        symbol = data.sym;
        
        sessionStorage.setItem('symbol', symbol);

        load_topbar();
    });
    
    function load_topbar() {
        var stockInfo = document.getElementById('stock-info');
        stockInfo.innerHTML = '';  // Clear current content

        for (let x of dataMat) {
            if (symbol == x[1]) {
                // Insert Symbol
                var col = document.createElement('div');
                col.textContent = symbol;
                stockInfo.appendChild(col);
        
                // Insert Security's Name
                var col = document.createElement('div');
                col.textContent = x[2];
                stockInfo.appendChild(col);
        
                // Insert price (LTP)
                col = document.createElement('div');
                col.textContent = x[0];
                stockInfo.appendChild(col);
                
                // Insert %change
                col = document.createElement('div');
                change = ((x[0] - x[3]) / x[3]) * 100;
                if (change > 0) {
                    col.textContent = '+' + change.toFixed(2) + '%';
                }
                else {
                    col.textContent = change.toFixed(2) + '%';
                }
                stockInfo.appendChild(col);
        
                // Insert Prev. Day's Closing Price
                col = document.createElement('div');
                col.textContent = 'Pre Close: ' + x[3];
                stockInfo.appendChild(col);

                break;
            }
        }
        
    } load_topbar();


    function load_OrderBook() {
        var orderBookTableBody = document.getElementById('order-book-table-body');
        orderBookTableBody.innerHTML = '';  // Clear current table content

        var sellOrders = lastSellOB.slice().reverse();

        // Insert rows for flipped 'sellOB'
        sellOrders.forEach(function(order) {
            var row = document.createElement('tr');
            order.forEach(function(value) {
                var cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });
            orderBookTableBody.appendChild(row);
        });
        
        // Insert a single row for 'LTP'
        for (let x of dataMat) {
            if (x[1] == symbol) {
                var ltpRow = document.createElement('tr');
                var ltpCell = document.createElement('td');
                ltpCell.setAttribute('colspan', '3');  // Make it span 3 columns
                ltpCell.textContent = 'LTP: ' + x[0];
                ltpCell.style.textAlign = 'left';  // Align LTP to the left
                ltpRow.appendChild(ltpCell);
                orderBookTableBody.appendChild(ltpRow);
                break;
            }
        }

        // Insert rows for 'buyOB'
        lastBuyOB.forEach(function(order) {
            var row = document.createElement('tr');
            order.forEach(function(value) {
                var cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });
            orderBookTableBody.appendChild(row);
        });
    } load_OrderBook();

    function ext_pricePlots(sym) {
        if (!sym) {
            for (let x of dataMat) {
                if (x[1] == symbol) {
                    return x[4];
                }
            }
            return [];
        }
        else {
            for (let x of dataMat) {
                if (x[1] == sym) {
                    return [x[0], x[3], x[4]];
                }
            }
        }
    }
    
    // Create a real-time line chart
    var priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,  // X-axis labels
            datasets: [{
                label: 'Stock Price',  // Name of the dataset
                data: ext_pricePlots(),  // Y-axis data for LTP arr
                borderColor: function() {
                    pricePlots = ext_pricePlots();
                    // if price is above day's open then green else red
                    return pricePlots[pricePlots.length - 1] >= pricePlots[1] ? 'rgba(0, 200, 0, 1)' : 'rgba(200, 0, 0, 1)';
                },  // Line color
                backgroundColor: function() {
                    var gradient = ctx.createLinearGradient(0, 0, 0, 400);  // Create a gradient background for the line
                    pricePlots = ext_pricePlots();
                    if (pricePlots[pricePlots.length - 1] >= pricePlots[1]) {  // if price is above day's open then green else red
                        // Green gradient for upward trend
                        gradient.addColorStop(0, 'rgba(0, 200, 0, 0.3)');
                        gradient.addColorStop(1, 'rgba(0, 200, 0, 0)');
                    } else {
                        // Red gradient for downward trend
                        gradient.addColorStop(0, 'rgba(200, 0, 0, 0.3)');
                        gradient.addColorStop(1, 'rgba(200, 0, 0, 0)');
                    }
                    return gradient;
                },
                borderWidth: 2,  // Line width
                fill: true,  // Don't fill the area under the line
                pointRadius: function(context) {
                    pricePlots = ext_pricePlots();
                    // Show a point only on the last data point
                    return context.dataIndex === pricePlots.length - 1 ? 5 : 0;
                },
                pointHoverRadius: 3,  // Hover effect on the last point
                pointBackgroundColor: function() {
                    pricePlots = ext_pricePlots();
                    // if price is above day's open then green else red
                    return pricePlots[pricePlots.length - 1] >= pricePlots[1] ? 'rgba(0, 200, 0, 1)' : 'rgba(200, 0, 0, 1)';
                },  // Color for the last point
                pointBorderWidth: function(context) {
                    pricePlots = ext_pricePlots();
                    // Make the last point thicker
                    return context.dataIndex === pricePlots.length - 1 ? 1 : 0;
                }
            }]
        },
        options: {
            scales: {
                x: {
                    grid: {
                        display: false,  // Hide gridlines for X-axis
                    },
                    ticks: {
                        color: '#ccc',  // X-axis label color
                        display: false
                    }
                },
                y: {
                    position: 'right', // Position price scale on the right side
                    grid: {
                        display: false,  // Hide gridlines for Y-axis
                    },
                    ticks: {
                        color: '#ccc'  // Y-axis label color
                    },
                    beginAtZero: false  // Stock prices don't start from zero
                }
            },
            plugins: {
                legend: {
                    display: false  // Disable legend to simplify the chart
                },
                tooltip: {
                    mode: 'index',  // Show all points at the same index
                    intersect: false,  // Show the tooltip on hover regardless of exact point
                    usePointStyle: true,  // Use point style in tooltip
                    callbacks: {
                        label: function(tooltipItem) {
                            return ' NPR ' + tooltipItem.raw;  // Custom label in tooltip
                        }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.4  // Smooth out the line
                }
            },
            hover: {
                mode: 'index',  // Show tooltip and hover effect on closest point along x-axis
                intersect: false  // Activate hover effect even when not intersecting with the line
            }
        }
    });

    function load_Floorsheet() {
        var floorsheetTableBody = document.getElementById('floorsheet-table-body');
        floorsheetTableBody.innerHTML = '';  // Clear current floorsheet table content

        // Use provided database or fallback to last known database
        var floorsheetData = lastDatabase.slice().reverse();

        // Insert rows for floorsheet with updated format
        floorsheetData.forEach(function(entry) {
            var row = document.createElement('tr');
            
            if (entry.symbol == symbol) {
                // Calculate amount = qty * rate
                var amount = entry.qty * entry.rate;

                // Add cells for each column
                var idCell = document.createElement('td');
                idCell.textContent = entry.id;
                row.appendChild(idCell);

                var conIDCell = document.createElement('td');
                conIDCell.textContent = entry.conID;
                row.appendChild(conIDCell);

                var qtyCell = document.createElement('td');
                qtyCell.textContent = entry.qty;
                row.appendChild(qtyCell);

                var rateCell = document.createElement('td');
                rateCell.textContent = entry.rate;
                row.appendChild(rateCell);

                var amountCell = document.createElement('td');
                amountCell.textContent = amount.toFixed(2);  // Keep 2 decimal places for amount
                row.appendChild(amountCell);

                var buyerNameCell = document.createElement('td');
                buyerNameCell.textContent = entry.buyerName;
                row.appendChild(buyerNameCell);

                var sellerNameCell = document.createElement('td');
                sellerNameCell.textContent = entry.sellerName;
                row.appendChild(sellerNameCell);

                floorsheetTableBody.appendChild(row);
            }
        });
    } load_Floorsheet();

    function updateChart(sym) {
        const currentTime = Date.now();
        pricePlots = ext_pricePlots(sym);  // [LTP, PrevClose, chart-plots]

        // if time within 1 minu. interval
        if (currentTime-lastCheckTime < 60000) {
            // Add the new LTP value to the chart data
            if (pricePlots[2].length == 0){
                pricePlots[2].push(pricePlots[1]);  // fill first index of chart as previous closing price
                pricePlots[2].push(pricePlots[0]);  // fill second index of chart as the first LTP of the day
            }
            else pricePlots[2][pricePlots[2].length - 1] = pricePlots[0];  // fill rest of the indices of chart as incoming LTPs
            sessionStorage.setItem('dataMat', JSON.stringify(dataMat));
            
            // Add label (time for the x-axis)
            if (labels.length == 0) {
                labels.push('');  // this label is empty for the previous day's close which is the first plotted price on chart
                labels.push(new Date().toLocaleTimeString());  // print time label
                labels.push('');  // leave a gap from last plotted price
                sessionStorage.setItem('labels', JSON.stringify(labels));
            }
        }

        // if 1 minu. interval finished
        else {
            lastCheckTime = currentTime;
            labels[labels.length-1] = new Date().toLocaleTimeString();
            labels.push('');
            dataMat.forEach(x => {
                x[4].push(x[0]);
            });
            sessionStorage.setItem('lastCheckTime', lastCheckTime);
            sessionStorage.setItem('dataMat', JSON.stringify(dataMat));
            sessionStorage.setItem('labels', JSON.stringify(labels));
        }
        if (sym == symbol)  priceChart.update();
    }

    function load_placedOrders() {
        // Clear the current table content
        $('#open-orders-table-body').empty();
        $('#filled-orders-table-body').empty();

        placedOrders.forEach(function(order) {
            if (order && order[7] == uname) {
                var row = '<tr>' +
                    '<td>' + order[1] + '</td>' + // Symbol
                    '<td>' + order[2] + '</td>' + // Qty
                    '<td>' + order[3] + '</td>' + // Rate
                    '<td>' + order[4] + '</td>' + // Rem.
                    '<td>' + order[5] + '</td>';  // Type (Buy/Sell)

                // If Success is False, show loading circle
                if (!order[6]) {
                    row += '<td><div class="loading-circle"></div></td>';
                }
                else {
                    if (order[4] > 0) {
                        row += '<td>Yes</td>';
                    }
                }
                
                row += '</tr>';
                // If Rem. is greater than 0, it's an open order
                if (order[4] > 0) {
                    $('#open-orders-table-body').append(row);
                } else {
                    $('#filled-orders-table-body').append(row);
                }
            }
        });
    } load_placedOrders();


    // Listen for 'order_book' event from the server
    socket.on('order_book', function(data) {
        // Update last known values if new data is provided
        if (data.sym == symbol) {
            if (data.sellOB) {
                lastSellOB = data.sellOB;
                sessionStorage.setItem('lastSellOB', JSON.stringify(lastSellOB));
            }
            if (data.buyOB) {
                lastBuyOB = data.buyOB;
                sessionStorage.setItem('lastBuyOB', JSON.stringify(lastBuyOB));
            }
        }
        if (data.ltp) {
            for (let x of dataMat) {
                if (x[1] == data.sym) {
                    x[0] = data.ltp;
                    break;
                }
            }
            sessionStorage.setItem('dataMat', JSON.stringify(dataMat));
        }

        load_OrderBook();
        updateChart(data.sym);
        load_topbar();
        load_exploreTab();
    });

    // Listen for 'floorsheet' event from the server
    socket.on('floorsheet', function(data) {
        // Update last known database if new data is provided
        lastDatabase = data.database;
        
        sessionStorage.setItem('lastDatabase', JSON.stringify(lastDatabase));

        load_Floorsheet();
    });

    // Toggle between Chart, Database and Stats
    $('#chart-container-btn').click(function() {
        $(this).addClass('active');
        $('#database-container-btn').removeClass('active');
        $('#stats-container-btn').removeClass('active');
        $('#chart-container').show();
        $('#database-container').hide();
        $('#stats-container').hide();
    });
    $('#database-container-btn').click(function() {
        $(this).addClass('active');
        $('#chart-container-btn').removeClass('active');
        $('#stats-container-btn').removeClass('active');
        $('#chart-container').hide();
        $('#database-container').show();
        $('#stats-container').hide();
    });
    $('#stats-container-btn').click(function() {
        $(this).addClass('active');
        $('#chart-container-btn').removeClass('active');
        $('#database-container-btn').removeClass('active');
        $('#chart-container').hide();
        $('#database-container').hide();
        $('#stats-container').show();
    });

    // Handle form submission via AJAX to avoid page reload
    $('.order-form').on('submit', function(event) {
        event.preventDefault();  // Prevent default form submission
        var formData = $(this).serialize();  // Serialize the form data
        var form = $(this); // Save reference to the current form

        // Validate before sending AJAX request
        var rate = parseFloat(form.find('#rate').val());
        var qty = parseInt(form.find('#qty').val());
        var action = form.find('input[name="action"]').val();
        
        // Validation
        if (rate || rate == 0) {
            if (action == 'Buy' && rate > lastSellOB[0][2]) {
                alert('Buy Limit exceeds top bid price');
                return;
            }
            else if (action == 'Sell' && rate < lastBuyOB[0][2]) {
                alert('Sell Limit falls short to top ask price');
                return;
            }

            for (let x of dataMat) {
                if (x[1] == symbol) {
                    prevClose = x[3];
                    break;
                }
            }
            let p1 = parseFloat((prevClose*0.9).toFixed(1));
            let p2 = parseFloat((prevClose*1.1).toFixed(1));
            if (rate < p1 || rate > p2) {
                alert(`You're breaking circuit. Rate must be within (${p1} - ${p2}).`);
                return;
            }
            if (!/^\d+(\.\d{1})?$/.test(rate)) {
                alert(`Rate must be multiple of 0.1. ${rate}`);
                return;
            }
        }

        if (qty < 10) {
            alert('Quantity must be of at least 10 units.');
            return;
        }
        
        // Validating with user balance and collateral
        if (action == 'Sell') { // Limit/Market sell
            if (qty > balances[symbol]) {
                alert(`Sell amount exceeds your balance! Your balance for ${symbol}: ${balances[symbol]}`);
                return;
            }
        }
        if (action == 'Buy') { // Limit Buy
            if (rate && rate*qty > collateral) {
                alert(`Buy amount exceeds your collateral! Your collateral: NPR ${collateral}`);
                return;
            }
            else if (!rate) { // Market Buy
                // set price as the upper circuit for conservative estimation of the market order's rate
                let mktRate = dataMat.find(asset => asset[1] == symbol) [3] * 1.1
                if (mktRate * qty > collateral) {
                    alert(`Buy amount exceeds your collateral! Your collateral: NPR ${collateral}`);
                    return;
                }
            }
        }

        // Deducting collateral
        if (action == 'Buy') {
            if (rate) { // Limit order (for market orders deduction occurs when order is filled at market price)
                collateral -= qty * rate;
                sessionStorage.setItem("collateral", collateral);
                // Emit deduction event to Flask
                socket.emit('deduct_buy', {'amt': qty*rate});
            }
        }
        // Deducting asset balance
        if (action == 'Sell') {
            balances[symbol] -= qty
            sessionStorage.setItem('balances', JSON.stringify(balances));
            socket.emit('deduct_sell', {'qty': qty});
        }
        
        // Submit form data via AJAX
        $.ajax({
            url: '/place_order',
            method: 'POST',
            data: formData,
            success: function(response) {
                alert(action + ' order placed successfully!');
                form.find('input[type="number"]').val('');  // Clear the rate and quantity inputs
            },
            error: function(error) {
                alert('Error placing ' + action + ' order.');
            }
        });
    });

    // Toggle between Limit Order and Market Execution forms
    $('#limit-order-btn').click(function() {
        $(this).addClass('active');
        $('#market-execution-btn').removeClass('active');
        $('#limit-order-form').show();
        $('#market-execution-form').hide();
    });
    $('#market-execution-btn').click(function() {
        $(this).addClass('active');
        $('#limit-order-btn').removeClass('active');
        $('#market-execution-form').show();
        $('#limit-order-form').hide();
    });

    // Listen for 'placed_orders' event from the server
    socket.on('placed_orders', function(data) {
        if (data.placedOrders) placedOrders = data.placedOrders;
        sessionStorage.setItem('placedOrders', JSON.stringify(placedOrders));
        load_placedOrders();
    });

    // Toggle between "Open Orders" and "Filled Orders"
    $('#open-orders-btn').click(function() {
        $(this).addClass('active');
        $('#filled-orders-btn').removeClass('active');
        $('#open-orders').show();
        $('#filled-orders').hide();
    });
    $('#filled-orders-btn').click(function() {
        $(this).addClass('active');
        $('#open-orders-btn').removeClass('active');
        $('#filled-orders').show();
        $('#open-orders').hide();
    });
    
    socket.on('finished_matching', function(data) {
        for (let i in dataMat) {
            if (dataMat[i][1] == data.sym) {
                dataMat.splice(i, 1);
                sessionStorage.setItem('dataMat', JSON.stringify(dataMat));
                break;
            }
        }
        load_exploreTab();
    });


    if (document.getElementById("close-market-btn")) {
        document.getElementById("close-market-btn").addEventListener("click", function(event) {
            event.preventDefault();  // Prevent the default action
        
            let closeMarketBtn = event.target;
            closeMarketBtn.style.pointerEvents = "none";  // Disable clicking
            closeMarketBtn.style.opacity = "0.5";  // Grey it out to indicate it's disabled
            closeMarketBtn.innerText = "Closing Market...";  // Update text
        
            fetch("/close_market", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Market is closing" })
            }).then(response => response.json())
              .then(data => {
                  console.log("Server Response:", data);
              })
              .catch(error => {
                  console.error("Error:", error);
                  closeMarketBtn.style.pointerEvents = "auto";  // Re-enable if error occurs
                  closeMarketBtn.style.opacity = "1";  
                  closeMarketBtn.innerText = "Close Market";  // Reset text
              });
        });       
    }

    function wrapUp() {
        if (!mktStatus) {
            document.getElementById('order-book').classList.add('blurred');
            document.getElementById('mid-sec').classList.add('blurred');
            document.querySelector('.form-container').classList.add('blurred');
        }
    } wrapUp();

    // Listen for the 'wrapping_up' event from the server
    socket.on('wrap_up', function() {
        mktStatus = false
        sessionStorage.setItem('mktStatus', mktStatus);
        wrapUp();
    });

    // Listen when market is finally closed
    socket.on('mkt_closed', function() {
        let closeMarketBtn = document.getElementById("close-market-btn");
        if (closeMarketBtn) {
            closeMarketBtn.style.pointerEvents = "none";  // Disable clicking
            closeMarketBtn.style.opacity = "0.5";
            closeMarketBtn.innerText = "Market Closed";
        }
    });


    // ensure the chart values are saved before the page is unloaded (for data integrity &/or backup for unexpected interruptions)
    window.addEventListener("beforeunload", function () {
        sessionStorage.setItem('uname', uname);
        sessionStorage.setItem('balances', JSON.stringify(balances));
        sessionStorage.setItem("collateral", collateral);
        sessionStorage.setItem('dataMat', JSON.stringify(dataMat));
        sessionStorage.setItem('symbol', symbol);
        sessionStorage.setItem('lastSellOB', JSON.stringify(lastSellOB));
        sessionStorage.setItem('lastBuyOB', JSON.stringify(lastBuyOB));
        sessionStorage.setItem('lastDatabase', JSON.stringify(lastDatabase));
        sessionStorage.setItem('placedOrders', JSON.stringify(placedOrders));
        sessionStorage.setItem('mktStatus', mktStatus);
        sessionStorage.setItem('lastCheckTime', lastCheckTime);
        sessionStorage.setItem('labels', JSON.stringify(labels));
    });
});