from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class MyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        return SimpleHTTPRequestHandler.do_GET(self)

# Change to the directory containing your files
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Create server
PORT = 8000
server = HTTPServer(('localhost', PORT), MyHandler)
print(f'Server running at http://localhost:{PORT}')
server.serve_forever()
