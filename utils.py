from seperate_assets import allSymbols, prevDay

import threading


# contain objects, each obj represent a particular asset
assets = []
# total no. of top buy/sell orders to display in order book
TOP_BIDSASKS_NO = 9
# OrderID of placed orders by user
Orders = 0
# all existing MKT orders' OrderID
MKT_Orders = []
# all types of orders placed by user
placedOrders = []
# default symbol to display
symbol = None
# datecode in conID
datecode = None
# specific locks for each object
lock_orderPlacing = []


# attributes:                        OrderNo, Symbol, Qty, Rate, Remaining Qty, Type, Sucess_on_placing
# attribute col-index (placedOrders):      0,      1,   2,    3,             4,    5,                 6


class AssetData():
    def __init__(self, arr) -> None:
        # extracted data (orders) of this asset, used to simulate supply-demand
        self.arr = arr[::-1]
        # list to store unique prices in sorted manner
        self.prices = [el[5] for el in self.arr]
        # list of buy/sell orders lists sorted on basis of price-time
        self.queue = []
        # prev. day closing price
        self.prevClose = None
        # security's name
        self.name = None
        # order book for top bid & ask prices
        self.buyOB = []; self.sellOB = []
        # total no. of sub-threads in existance
        self.subThreads = 0 
        # while waiting for main thread to be halted
        self.event_start_subThread = threading.Event()
        # while LMT order is being placed
        self.event_place_LMT = threading.Event()
        # when main-thread is not waiting
        self.skip = False
        # market execution mode
        self.mkt_ex_mode = False

        # attributes:               id, contractID, Buyer, Seller, Qty, Rate, Time, Buyer Name, Seller Name, Symbol
        # attribute col-index (arr): 0,          1,     2,      3,   4,    5,    6,          7,           8,      9

        self.load_PrevClose()
        self.load_dataStructs()


    @staticmethod
    def radixSort(arr):
        # Convert floats to integers by scaling
        scale_factor = 10 ** max(len(str(price).split('.')[1]) if '.' in str(price) else 0 for price in arr)
        int_arr = [int(price * scale_factor) for price in arr]

        # Perform radix sort on the integer array
        max_val = max(int_arr)
        exp = 1
        while max_val // exp > 0:
            AssetData.counting_sort(int_arr, exp)
            exp *= 10

        # Convert back to floats
        sorted_arr = [price / scale_factor for price in int_arr]
        return sorted_arr

    @staticmethod
    def counting_sort(arr, exp):
        n = len(arr)
        output = [0] * n
        count = [0] * 10

        # Count occurrences of each digit
        for i in range(n):
            index = (arr[i] // exp) % 10
            count[index] += 1

        # Update count[i] to be the actual position in output
        for i in range(1, 10):
            count[i] += count[i - 1]

        # Build the output array
        for i in range(n - 1, -1, -1):
            index = (arr[i] // exp) % 10
            output[count[index] - 1] = arr[i]
            count[index] -= 1

        # Copy output array to arr
        for i in range(n):
            arr[i] = output[i]

    @staticmethod
    def remove_duplicates(lst):
        unique_list = []
        prev_item = None
        for item in lst:
            if item != prev_item:
                unique_list.append(item)
                prev_item = item
        return unique_list


    def createQueue(self):
        for price in self.prices:
            temp = []
            for x in self.arr:
                if(price == x[5]):
                    temp.append([x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7], x[8], x[9]])
            self.queue.append(temp)


    # extracting prev. closing price of the security
    def load_PrevClose(self):
        # attributes:                      stockId, Symbol, securityName, Rate
        # attribute col-index (prevDay):         0,      1,            2,    3
        for line in prevDay:
            if(line[1] == self.arr[0][9]):
                self.prevClose = line[3]
                self.name = line[2]
                break


    def load_dataStructs(self):
        self.prices = self.remove_duplicates(self.radixSort(self.prices)) # sort the prices and remove duplicates
        self.createQueue()


print("Creating Objects ...")
for i, sec in enumerate(allSymbols):
    assets.append(AssetData(sec))
    lock_orderPlacing.append(threading.Lock())
    
datecode = assets[0].arr[0][1][:8]
symbol = assets[len(assets)-1].arr[0][9]
