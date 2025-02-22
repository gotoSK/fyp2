from flask import Flask
from gevent.pywsgi import WSGIServer
from gevent import spawn

# First Flask app
app1 = Flask(__name__)

@app1.route("/")
def home1():
    return "This is App 1"

# Second Flask app
app2 = Flask(__name__)

@app2.route("/")
def home2():
    return "This is App 2"

if __name__ == "__main__":
    # Create WSGI servers for each app
    server1 = WSGIServer(('0.0.0.0', 5000), app1)
    server2 = WSGIServer(('0.0.0.0', 5001), app2)

    # Run servers in parallel
    spawn(server1.serve_forever)
    spawn(server2.serve_forever).join()
