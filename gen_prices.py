from utils import TOP_BIDSASKS_NO

# def no_circuit_break(x, prevClose):
#     lower_bound = prevClose * 0.9
#     upper_bound = prevClose * 1.1
#     return lower_bound <= x <= upper_bound

def genPrices(x, type, prices):
    temp = [] # to store bid/ask prices within this funtion temporarily before passing to actual list
    count = 0
    if type == 'bids':
        for idx, price in enumerate(prices):
            if x == price:
                while idx >= 0 and count != TOP_BIDSASKS_NO:
                    temp.append(prices[idx])
                    idx -= 1
                    count += 1
                if count != TOP_BIDSASKS_NO:
                    # while count != TOP_BIDSASKS_NO and no_circuit_break(temp[count-1]-1, prevClose):
                    while count != TOP_BIDSASKS_NO:
                        temp.append(temp[count-1]-1)
                        count += 1
                break
            elif price > x:
                temp.append(x)
                count += 1
                if idx == 0:
                    # while count != TOP_BIDSASKS_NO and no_circuit_break(temp[count-1]-1, prevClose):
                    while count != TOP_BIDSASKS_NO:
                        temp.append(temp[count-1]-1)
                        count += 1
                else:
                    idx -= 1
                    while idx >= 0 and count != TOP_BIDSASKS_NO:
                        temp.append(prices[idx])
                        idx -= 1
                        count += 1
                    if count != TOP_BIDSASKS_NO:
                        # while count != TOP_BIDSASKS_NO and no_circuit_break(temp[count-1]-1, prevClose):
                        while count != TOP_BIDSASKS_NO:
                            temp.append(temp[count-1]-1)
                            count += 1
                break
        return temp
    
    elif(type == 'asks'):
        for idx, price in enumerate(prices):
            if x == price:
                while idx < len(prices) and count != TOP_BIDSASKS_NO:
                    temp.append(prices[idx])
                    idx += 1
                    count += 1
                if count != TOP_BIDSASKS_NO:
                    # while count != TOP_BIDSASKS_NO and no_circuit_break(temp[count-1]+1, prevClose):
                    while count != TOP_BIDSASKS_NO:
                        temp.append(temp[count-1]+1)
                        count += 1
                break
            elif price > x:
                temp.append(round(x+0.2, 1)) # making a spread of 0.2
                count += 1
                if idx == len(prices)-1:
                    # while count != TOP_BIDSASKS_NO and no_circuit_break(temp[count-1]+1, prevClose):
                    while count != TOP_BIDSASKS_NO:
                        temp.append(temp[count-1]+1)
                        count += 1
                else:
                    if temp[0] == prices[idx]:
                        idx +=1
                    while idx < len(prices) and count != TOP_BIDSASKS_NO:
                        temp.append(prices[idx])
                        idx += 1
                        count += 1
                    if count != TOP_BIDSASKS_NO:
                        # while count != TOP_BIDSASKS_NO and no_circuit_break(temp[count-1]+1, prevClose):
                        while count != TOP_BIDSASKS_NO:
                            temp.append(temp[count-1]+1)
                            count += 1
                break
        return temp