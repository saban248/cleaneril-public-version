



class OFRecordBuilder:

    def __init__(self):
        self.lines = []

    def add(self, line):
        self.lines.append(line)

    def build(self):
        # CRLF
        return "".join(self.lines)+'\r\n'