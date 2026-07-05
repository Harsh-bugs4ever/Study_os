import sys
import importlib
try:
    import cognee
    print("IMPORTED COGNEE FROM:", cognee.__file__)
except Exception as e:
    print("IMPORT ERROR:", repr(e))
