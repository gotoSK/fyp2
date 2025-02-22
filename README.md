# Order Matching &amp; Clearing Obligations

- Step 1
    - Install the Project as ``Zip File``
    - Extract the Zip File and Designate a Location
- Step 2
    - Go to the Folder than contains other Folders given as ``data``, ``databases``, ``instance`` and ``templates`` along with other ``.py files``
    - Then run the following command on ``terminal``/``bash``/``psw`` from the location as
    ```ps
    python -m venv venv
    ```
    This creates a virtual environment for python with folder named ``venv``
- Step 3
    - Execute Follwing command 
    ```ps
    venv\Scripts\activate
    ```
- Step 4
    - Run the following command to install dependencies
    ```ps
        pip install -r requirements.txt
    ```
- Step 5 
    - Then type in the following command to execute the project
    ```ps
    python app.py
    ```
    The command interface shows as
    ```ps
    Extracting data ...
    Selecting Stocks ...
    Extracting previous day's data ...
    Writing file ...
    Creating Objects ...
    Configuring App & DB setups ...
     * Serving Flask app 'app'
     * Debug mode: on
    WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
     * Running on http://127.0.0.1:5000
    Press CTRL+C to quit
    ```
    - ``Ctrl + Click`` on the Url given as ``http://127.0.0.1:5000`` which opens up browser displaying the contents of project.

