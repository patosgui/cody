import http.server
import socketserver
import json

CR_NL = "\r\n"

class RequestHandler(http.server.SimpleHTTPRequestHandler):

    def completion_response(self, text : str):
        event_completion = "event: completion"
        return f"{len(text)+24}{CR_NL}{event_completion}\ndata: {text}\n\n\r\n"

    def do_POST(self):
        print(f"Received headers: {self.headers}")
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = ''
        if content_length:
            post_data = self.rfile.read(content_length).decode('utf-8')
        else:
            while True:
                    line = self.rfile.readline().strip()
                    chunk_length = int(line, 16)

                    if chunk_length != 0:
                        chunk = self.rfile.read(chunk_length)
                        print(f"Received chunk: {chunk.decode('utf-8')}")

                    # Each chunk is followed by an additional empty newline
                    # that we have to consume.
                    self.rfile.readline()

                    # Finally, a chunk size of 0 is an end indication
                    if chunk_length == 0:
                        break
            data = json.loads(chunk)
            human_text_fields = [msg['text'] for msg in data['messages'] if 'text' in msg and msg['speaker'] == 'human']
            human_text_fields_as_string = " ".join(human_text_fields)
            response_size = len(human_text_fields_as_string)
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Transfer-Encoding', 'chunked')
            self.end_headers()

                
            response = self.completion_response(human_text_fields_as_string.encode('unicode_escape').decode("utf-8"))
            print(response)
            self.wfile.write(response.encode("utf-8"))
            self.wfile.write(b"0\r\n\r\n")
            return

        print(f"Received message: {post_data}")

        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(post_data.encode('utf-8'))

def run_server(port=49300):
    with socketserver.TCPServer(("", port), RequestHandler) as httpd:
        print(f"HTTP server running on port {port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Received Ctrl+C, shutting down server...")
            httpd.shutdown()

if __name__ == '__main__':
    run_server()