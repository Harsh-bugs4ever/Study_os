import inspect
import cognee

with open("cognee_remember_signature.txt", "w") as f:
    f.write(str(inspect.signature(cognee.remember)))
