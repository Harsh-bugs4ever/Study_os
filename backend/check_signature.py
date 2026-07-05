import inspect
import cognee

with open("cognee_signature.txt", "w") as f:
    f.write(str(inspect.signature(cognee.recall)))
