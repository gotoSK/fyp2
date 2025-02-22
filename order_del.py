from utils import assets, placedOrders
from user import users

def del_orders():
    global placedOrders

    for asset in assets:

        # delete orders of this asset
        asset.arr[:] = [row for row in asset.arr if row[1][8:9] != '1']

        asset.queue.clear()  # empty the queue
        asset.prices.clear()  # empty the prices list
        asset.buyOB.clear()  # empty bids order book
        asset.sellOB.clear()  # empty asks order book

    # restore the user's balance/collateral
    for order in placedOrders:
        if order and order[4] > 0:  # any open Limit orders
            if order[5] == 'Buy':
                users[order[7]].collateral += order[2] * order[3]  # restore the user's collateral if buy order
            else:
                users[order[7]].balance[order[1]] += order[2]  # restore the user's asset balance if sell order
    
    # delete those open orders from the placedOrders list
    placedOrders[:] = [order for order in placedOrders if order and order[4]==0]