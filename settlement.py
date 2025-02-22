def calculate_settlement(data):
    """
    Calculate the settlement amounts between buyers and sellers and group by buyer.
    """
    # Create a dictionary to store net amounts between buyers and sellers
    net_amounts = {}

    # Calculate net amounts
    for row in data:
        buyer = row.buyerName
        seller = row.sellerName
        amount = row.rate * row.qty  # Calculate amount (rate * qty)

        # Initialize net amounts if not already present
        if buyer not in net_amounts:
            net_amounts[buyer] = {}
        if seller not in net_amounts[buyer]:
            net_amounts[buyer][seller] = 0

        # Add to the net amount
        net_amounts[buyer][seller] += amount

        # Subtract the reverse transaction (if any)
        if seller in net_amounts and buyer in net_amounts[seller]:
            net_amounts[seller][buyer] -= amount

    # Create a list of settlement transactions grouped by buyer
    settlement_data = []
    for buyer in net_amounts:
        sellers = []
        for seller in net_amounts[buyer]:
            if net_amounts[buyer][seller] > 0:
                sellers.append({
                    'seller': seller,
                    'amount': net_amounts[buyer][seller]
                })
        if sellers:
            settlement_data.append({
                'buyer': buyer,
                'sellers': sellers
            })

    return settlement_data
