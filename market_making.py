def maker(arr):
    for row in arr:
        if int(row[2]) < 100 and int(row[3]) < 100:
            return row